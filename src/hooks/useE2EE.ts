'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import * as E2EE from '@/lib/e2ee';

// ─── Module-level Key Registry ─────────────────────────────────────────────────
// Keys survive component remounts, chat-list re-renders, and hot-reloads.
// Format: `${userId}:${conversationId}` → CryptoKey (AES-256-GCM)
const keyRegistry = new Map<string, CryptoKey>();

// Deduplicates concurrent init calls for the same conversation
const initPromises = new Map<string, Promise<CryptoKey>>();

function regKey(userId: string, conversationId: string) {
  return `${userId}:${conversationId}`;
}

// ─── E2EE State Machine ────────────────────────────────────────────────────────
// States: 'idle' | 'initializing' | 'ready' | 'error'
// Send is only enabled in the 'ready' state.

export function useE2EE(conversationId?: string) {
  const profile = useAuthStore(s => s.profile);

  // React state for UI rendering
  const [e2eeState, setE2eeState] = useState<'idle' | 'initializing' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Stable Supabase client — createClient() inside hook body + in deps array was
  // the original catastrophic bug (new reference every render → infinite useEffect loop)
  const supabaseRef = useRef(createClient());

  // The AES key lives in a ref so encrypt() always reads the live value
  // without any React render cycle delay. Both are updated atomically.
  const convKeyRef = useRef<CryptoKey | null>(null);

  // ─── Identity Init ────────────────────────────────────────────────────────────
  // Run once per userId. Ensures RSA keypair exists in IndexedDB before
  // conversation key init starts.
  const [identityReady, setIdentityReady] = useState(false);
  const identityReadyRef = useRef(false);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    const supabase = supabaseRef.current;

    async function initIdentity() {
      try {
        let keys = await E2EE.loadKeyPair(profile!.id);
        if (!keys) {
          // No keys in IndexedDB — generate fresh RSA-2048 keypair
          keys = await E2EE.generateRSAKeyPair();
          await E2EE.storeKeyPair(profile!.id, keys.publicKey, keys.privateKey);
          const pubKeyB64 = await E2EE.exportPublicKey(keys.publicKey);
          if (!cancelled) {
            await supabase.from('profiles').update({ public_key: pubKeyB64 }).eq('id', profile!.id);
            useAuthStore.getState().setProfile({ ...profile!, public_key: pubKeyB64 });
          }
        } else if (!profile?.public_key) {
          // Keys exist in IndexedDB but profile is missing the public key in DB
          const pubKeyB64 = await E2EE.exportPublicKey(keys.publicKey);
          if (!cancelled) {
            await supabase.from('profiles').update({ public_key: pubKeyB64 }).eq('id', profile!.id);
          }
        }
        // Identity is ready only when we successfully loaded/created the keypair
        if (!cancelled) {
          identityReadyRef.current = true;
          setIdentityReady(true);
        }
      } catch (err) {
        console.error('[E2EE] Identity init failed:', err);
        // DO NOT set identityReady=true on error — conversation key init must not run
        // The user will see a permanent "initializing" spinner, which is correct since
        // we cannot encrypt without identity keys.
      }
    }

    initIdentity();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // ─── Conversation Key Init ────────────────────────────────────────────────────
  useEffect(() => {
    // Hard guard: never run without all three prerequisites
    if (!profile?.id || !conversationId || !identityReady) return;

    const supabase = supabaseRef.current;

    // Transition to initializing
    convKeyRef.current = null;
    setE2eeState('initializing');
    setError(null);

    const rKey = regKey(profile.id, conversationId);

    // Fast path: key already in module-level registry
    if (keyRegistry.has(rKey)) {
      convKeyRef.current = keyRegistry.get(rKey)!;
      setE2eeState('ready');
      return;
    }

    // Deduplicate concurrent inits (React StrictMode runs effects twice in dev)
    if (!initPromises.has(rKey)) {
      const promise = (async (): Promise<CryptoKey> => {
        // 1. Load RSA identity keys (guaranteed to exist since identityReady=true)
        const identityKeys = await E2EE.loadKeyPair(profile!.id);
        if (!identityKeys) {
          throw new Error(
            '[E2EE] Identity keys not found in IndexedDB. ' +
            'This should not happen after identity init succeeded. ' +
            'Try refreshing or logging out and back in.'
          );
        }

        // 2. Fetch this user's member row for the conversation
        const { data: member, error: memberErr } = await supabase
          .from('conversation_members')
          .select('id, encrypted_key')
          .eq('conversation_id', conversationId)
          .eq('user_id', profile!.id)
          .single();

        if (memberErr && memberErr.code !== 'PGRST116') {
          throw new Error(`[E2EE] Could not fetch member row: ${memberErr.message}`);
        }

        if (!member) {
          throw new Error(
            `[E2EE] You are not a member of conversation ${conversationId}. ` +
            'Cannot load encryption key.'
          );
        }

        // ── CASE A: Member has an encrypted_key — try to decrypt it ─────────────
        if (member.encrypted_key) {
          try {
            const rawAesBase64 = await E2EE.decryptConversationKey(
              member.encrypted_key,
              identityKeys.privateKey
            );
            const aesKey = await E2EE.importConversationKey(rawAesBase64);
            return aesKey;
          } catch (decErr: any) {
            // RSA private key in IndexedDB does NOT match the public key used
            // to encrypt this conversation key. This means the user logged in
            // on a different device or cleared IndexedDB.
            // We MUST NOT generate a replacement key — that breaks other members.
            throw new Error(
              '[E2EE] Your device key cannot decrypt this conversation. ' +
              'The conversation key was encrypted for a different device session. ' +
              'Existing messages in this conversation cannot be recovered. ' +
              'Start a new conversation to chat securely.'
            );
          }
        }

        // ── CASE B: Member row has no encrypted_key ──────────────────────────────
        // Fetch all members to determine if this is a genuinely new conversation
        const { data: allMembers, error: allErr } = await supabase
          .from('conversation_members')
          .select('id, user_id, encrypted_key, profiles(public_key)')
          .eq('conversation_id', conversationId);

        if (allErr) throw new Error(`[E2EE] Failed to fetch all members: ${allErr.message}`);

        const otherMembersHaveKeys = allMembers?.some(
          m => m.user_id !== profile!.id && m.encrypted_key
        );

        if (otherMembersHaveKeys) {
          // Someone else has a key but we don't. Cannot generate a replacement.
          throw new Error(
            '[E2EE] Conversation already has an encryption key for other members, ' +
            'but your member row has no encrypted_key. ' +
            'Cannot generate a new key — that would break existing messages. ' +
            'Contact the other participant to re-establish the conversation.'
          );
        }

        // Genuinely new conversation — no member has a key yet.
        // Generate and distribute securely.
        const aesKey = await E2EE.generateConversationKey();
        const rawAesBase64 = await E2EE.exportConversationKey(aesKey);
        const myPubKeyB64 = await E2EE.exportPublicKey(identityKeys.publicKey);

        for (const m of allMembers || []) {
          const pubKey = (m.profiles as any)?.public_key
            || (m.user_id === profile!.id ? myPubKeyB64 : null);
          if (!pubKey) {
            console.warn(`[E2EE] No public key for member ${m.user_id} — skipping key distribution`);
            continue;
          }
          const encKey = await E2EE.encryptConversationKey(rawAesBase64, pubKey);
          const { error: rpcErr } = await supabase.rpc('update_member_key', {
            p_member_id: m.id,
            p_encrypted_key: encKey,
          });
          if (rpcErr) throw new Error(`[E2EE] update_member_key failed: ${rpcErr.message}`);
        }

        return aesKey;
      })();

      initPromises.set(rKey, promise);
      // Evict from dedup map after 60s so future navigations can re-init cleanly
      promise.finally(() => setTimeout(() => initPromises.delete(rKey), 60_000));
    }

    // Attach to the (possibly shared) promise
    let cancelled = false;
    initPromises.get(rKey)!
      .then(aesKey => {
        if (cancelled) return;
        // Store in registry and ref BEFORE updating React state
        keyRegistry.set(rKey, aesKey);
        convKeyRef.current = aesKey;
        setE2eeState('ready');
        setError(null);
      })
      .catch((err: any) => {
        if (cancelled) return;
        const msg = err?.message ?? String(err);
        console.error('[E2EE] Conversation key init failed:', {
          conversationId,
          userId: profile?.id,
          name: err?.name,
          message: msg,
        });
        convKeyRef.current = null; // Ensure key is not available
        setError(msg);
        setE2eeState('error');
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, conversationId, identityReady]);

  // ─── Public Interface ─────────────────────────────────────────────────────────

  const isReady = e2eeState === 'ready';

  const encrypt = useCallback(async (text: string): Promise<string> => {
    // Check BOTH the state machine and the actual key ref
    const key = convKeyRef.current;
    if (e2eeState !== 'ready' || !key) {
      throw new Error(`[E2EE] Cannot encrypt — state is "${e2eeState}", key is ${key ? 'present' : 'null'}`);
    }
    return E2EE.encryptText(text, key);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e2eeState]); // Re-memoize when state changes

  const decrypt = useCallback(async (ciphertext: string): Promise<string> => {
    const key = convKeyRef.current;
    if (!key) throw new Error('[E2EE] Cannot decrypt — key not available');
    return E2EE.decryptText(ciphertext, key);
  }, []);

  const encryptAttachment = useCallback(async (file: Blob): Promise<Blob> => {
    const key = convKeyRef.current;
    if (e2eeState !== 'ready' || !key) throw new Error('[E2EE] Cannot encrypt attachment — not ready');
    return E2EE.encryptFile(file, key);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e2eeState]);

  const decryptAttachment = useCallback(async (file: Blob, mimeType?: string): Promise<Blob> => {
    const key = convKeyRef.current;
    if (!key) throw new Error('[E2EE] Cannot decrypt attachment — key not available');
    return E2EE.decryptFile(file, key, mimeType);
  }, []);

  return {
    isReady,
    error,
    e2eeState, // Expose full state for UI
    encrypt,
    decrypt,
    encryptAttachment,
    decryptAttachment,
  };
}
