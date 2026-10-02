import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import * as E2EE from '@/lib/e2ee';

// Module-level maps survive component remounts and re-renders.
// Key format: `${userId}:${conversationId}`
const keyRegistry = new Map<string, CryptoKey>();
const initPromises = new Map<string, Promise<CryptoKey>>();

function registryKey(userId: string, conversationId: string) {
  return `${userId}:${conversationId}`;
}

export function useE2EE(conversationId?: string) {
  const profile = useAuthStore(s => s.profile);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable Supabase client — must NOT be recreated on every render.
  // Putting createClient() in the hook body and including `supabase` in
  // useEffect deps caused loadConvKey to fire on every render, constantly
  // racing against itself and leaving conversationKey=null.
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // The AES key lives in a ref so encrypt/decrypt always read the live value
  // without waiting for a React state re-render cycle.
  // This eliminates the stale-closure bug where encrypt() saw null even after
  // setConversationKey(aesKey) had been called.
  const convKeyRef = useRef<CryptoKey | null>(null);

  // ─── Identity Init ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;

    async function initIdentity() {
      try {
        let keys = await E2EE.loadKeyPair(profile!.id);
        if (!keys) {
          keys = await E2EE.generateRSAKeyPair();
          await E2EE.storeKeyPair(profile!.id, keys.publicKey, keys.privateKey);
          const pubKeyB64 = await E2EE.exportPublicKey(keys.publicKey);
          if (!cancelled) {
            await supabase.from('profiles').update({ public_key: pubKeyB64 }).eq('id', profile!.id);
            useAuthStore.getState().setProfile({ ...profile!, public_key: pubKeyB64 });
          }
        } else if (!profile?.public_key) {
          const pubKeyB64 = await E2EE.exportPublicKey(keys.publicKey);
          if (!cancelled) {
            await supabase.from('profiles').update({ public_key: pubKeyB64 }).eq('id', profile!.id);
          }
        }
      } catch (err) {
        console.error('[E2EE] Identity init failed:', err);
      }
    }

    initIdentity();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // ─── Conversation Key Init ────────────────────────────────────────────────────
  useEffect(() => {
    if (!profile?.id || !conversationId) return;

    // Reset state for this conversation
    setIsReady(false);
    setError(null);
    convKeyRef.current = null;

    const regKey = registryKey(profile.id, conversationId);

    // Already in the module-level registry — use immediately
    if (keyRegistry.has(regKey)) {
      convKeyRef.current = keyRegistry.get(regKey)!;
      setIsReady(true);
      return;
    }

    // Deduplicate concurrent initializations across concurrent renders
    if (!initPromises.has(regKey)) {
      const promise = (async (): Promise<CryptoKey> => {
        // 1. Load RSA identity keys from IndexedDB
        const identityKeys = await E2EE.loadKeyPair(profile!.id);
        if (!identityKeys) {
          throw new Error('[E2EE] Identity keys missing from IndexedDB. Try logging out and back in.');
        }

        // 2. Fetch our specific member row
        const { data: member, error: memberErr } = await supabase
          .from('conversation_members')
          .select('id, encrypted_key')
          .eq('conversation_id', conversationId)
          .eq('user_id', profile!.id)
          .single();

        if (memberErr && memberErr.code !== 'PGRST116') {
          throw new Error(`[E2EE] Member fetch failed: ${memberErr.message}`);
        }

        let aesKey: CryptoKey | null = null;

        if (member?.encrypted_key) {
          // ── PATH A: Decrypt the existing conversation key ──────────────────────
          const rawAesBase64 = await E2EE.decryptConversationKey(
            member.encrypted_key,
            identityKeys.privateKey
          );
          aesKey = await E2EE.importConversationKey(rawAesBase64);
        } else {
          // ── PATH B: Our member row has no key yet ──────────────────────────────
          const { data: allMembers, error: allErr } = await supabase
            .from('conversation_members')
            .select('id, user_id, encrypted_key, profiles(public_key)')
            .eq('conversation_id', conversationId);

          if (allErr) throw new Error(`[E2EE] Members fetch failed: ${allErr.message}`);

          const anyHasKey = allMembers?.some(m => m.encrypted_key);

          if (anyHasKey) {
            // Other members have the key but our row doesn't. We cannot generate
            // a replacement — that would break other participants' decryption.
            throw new Error(
              '[E2EE] Your encrypted_key is missing in conversation_members. ' +
              'The other participant must re-send or re-invite you.'
            );
          }

          // Genuinely new conversation — generate and distribute
          aesKey = await E2EE.generateConversationKey();
          const rawAesBase64 = await E2EE.exportConversationKey(aesKey);
          const myPubKeyB64 = await E2EE.exportPublicKey(identityKeys.publicKey);

          for (const m of allMembers || []) {
            const pubKey = (m.profiles as any)?.public_key
              || (m.user_id === profile!.id ? myPubKeyB64 : null);
            if (!pubKey) continue;

            const encKey = await E2EE.encryptConversationKey(rawAesBase64, pubKey);
            const { error: rpcErr } = await supabase.rpc('update_member_key', {
              p_member_id: m.id,
              p_encrypted_key: encKey,
            });
            if (rpcErr) throw new Error(`[E2EE] update_member_key RPC failed: ${rpcErr.message}`);
          }
        }

        if (!aesKey) throw new Error('[E2EE] aesKey is null after initialization — should never happen');
        return aesKey;
      })();

      initPromises.set(regKey, promise);
      // Evict after 60s so navigation to a new conversation and back re-inits cleanly
      promise.finally(() => setTimeout(() => initPromises.delete(regKey), 60_000));
    }

    // Attach to the (possibly shared) promise
    let cancelled = false;
    initPromises.get(regKey)!
      .then(aesKey => {
        if (cancelled) return;
        keyRegistry.set(regKey, aesKey);
        convKeyRef.current = aesKey;
        setIsReady(true);
        setError(null);
      })
      .catch((err: any) => {
        if (cancelled) return;
        const msg = err?.message ?? String(err);
        console.error('[E2EE] Conversation key init failed:', {
          conversationId,
          userId: profile?.id,
          errorName: err?.name,
          errorMessage: msg,
        });
        setError(msg);
        setIsReady(true); // Unblock UI — but error is set so Send will show error
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, conversationId]);

  // ─── Encrypt / Decrypt ────────────────────────────────────────────────────────
  // All functions read from convKeyRef directly.
  // This is the critical fix: using a ref means encrypt() NEVER sees a stale
  // null value from a previous render cycle.

  const encrypt = useCallback(async (text: string): Promise<string> => {
    const key = convKeyRef.current;
    if (!key) throw new Error('[E2EE] Conversation key not available — cannot encrypt');
    return E2EE.encryptText(text, key);
  }, []);

  const decrypt = useCallback(async (ciphertext: string): Promise<string> => {
    const key = convKeyRef.current;
    if (!key) throw new Error('[E2EE] Conversation key not available — cannot decrypt');
    return E2EE.decryptText(ciphertext, key);
  }, []);

  const encryptAttachment = useCallback(async (file: Blob): Promise<Blob> => {
    const key = convKeyRef.current;
    if (!key) throw new Error('[E2EE] Conversation key not available — cannot encrypt attachment');
    return E2EE.encryptFile(file, key);
  }, []);

  const decryptAttachment = useCallback(async (file: Blob, mimeType?: string): Promise<Blob> => {
    const key = convKeyRef.current;
    if (!key) throw new Error('[E2EE] Conversation key not available — cannot decrypt attachment');
    return E2EE.decryptFile(file, key, mimeType);
  }, []);

  return { isReady, error, encrypt, decrypt, encryptAttachment, decryptAttachment };
}
