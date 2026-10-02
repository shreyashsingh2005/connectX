import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import * as E2EE from '@/lib/e2ee';

const initPromises = new Map<string, Promise<void>>();

export function useE2EE(conversationId?: string) {
  const profile = useAuthStore(s => s.profile);
  const [isReady, setIsReady] = useState(false);
  const [conversationKey, setConversationKey] = useState<CryptoKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [identityReady, setIdentityReady] = useState(false);
  const supabase = createClient();

  // Initialize identity key
  useEffect(() => {
    if (!profile) return;
    async function initIdentity() {
      try {
        let keys = await E2EE.loadKeyPair(profile!.id);
        if (!keys) {
          keys = await E2EE.generateRSAKeyPair();
          await E2EE.storeKeyPair(profile!.id, keys.publicKey, keys.privateKey);
          
          const pubKeyB64 = await E2EE.exportPublicKey(keys.publicKey);
          await supabase.from('profiles').update({ public_key: pubKeyB64 }).eq('id', profile!.id);
            useAuthStore.getState().setProfile({ ...profile!, public_key: pubKeyB64 });
            useAuthStore.getState().setProfile({ ...profile!, public_key: pubKeyB64 });
        } else if (!profile?.public_key) {
          // Sync existing local key to profile if missing
          const pubKeyB64 = await E2EE.exportPublicKey(keys.publicKey);
          await supabase.from('profiles').update({ public_key: pubKeyB64 }).eq('id', profile!.id);
        }
        setIdentityReady(true);
      } catch (err) {
        console.error("E2EE Identity init failed:", err);
      }
    }
    initIdentity();
  }, [profile]);

  // Load or create conversation key
  useEffect(() => {
    if (!profile || !conversationId || !identityReady) return;

    async function loadConvKey() {
      if (initPromises.has(conversationId!)) {
        await initPromises.get(conversationId!);
        if (E2EE.conversationKeyCache.has(conversationId!)) {
          setConversationKey(E2EE.conversationKeyCache.get(conversationId!)!);
          setIsReady(true);
        }
        return;
      }

      const promise = (async () => {
        try {
          if (conversationId && E2EE.conversationKeyCache.has(conversationId!)) {
            setConversationKey(E2EE.conversationKeyCache.get(conversationId!)!);
            setIsReady(true);
            return;
          }

          // 1. Fetch our conversation_member row
          const { data: member, error: memberErr } = await supabase
            .from('conversation_members')
            .select('id, encrypted_key')
            .eq('conversation_id', conversationId)
            .eq('user_id', profile!.id)
            .single();

          if (memberErr && memberErr.code !== 'PGRST116') throw memberErr;

          let aesKey: CryptoKey | null = null;
          const keys = await E2EE.loadKeyPair(profile!.id);
          if (!keys) throw new Error("Identity keys missing");

          if (member?.encrypted_key) {
            // Decrypt existing conversation key
            try {
              const rawAesBase64 = await E2EE.decryptConversationKey(member.encrypted_key, keys.privateKey);
              aesKey = await E2EE.importConversationKey(rawAesBase64);
            } catch (decryptErr) {
              console.error("CRITICAL: Failed to decrypt existing conversation key! DO NOT generate a new one.", decryptErr);
              throw decryptErr;
            }
          } 
          
          if (!aesKey) {
            // We need to generate a new key and distribute it!
            aesKey = await E2EE.generateConversationKey();
            const rawAesBase64 = await E2EE.exportConversationKey(aesKey);
            const myPubKeyB64 = await E2EE.exportPublicKey(keys.publicKey);

            // Get all members and their public keys
            const { data: members, error: membersErr } = await supabase
              .from('conversation_members')
              .select('id, user_id, profiles(public_key)')
              .eq('conversation_id', conversationId);

            if (membersErr) throw membersErr;

            for (const m of members || []) {
              const pubKey = (m.profiles as any)?.public_key || (m.user_id === profile!.id ? myPubKeyB64 : null);
              if (pubKey) {
                const encKey = await E2EE.encryptConversationKey(rawAesBase64, pubKey);
                const { error: rpcErr } = await supabase.rpc('update_member_key', { p_member_id: m.id, p_encrypted_key: encKey });
                if (rpcErr) throw rpcErr;
              }
            }
          }
          
          setConversationKey(aesKey);
          if (conversationId) E2EE.conversationKeyCache.set(conversationId, aesKey);
          setIsReady(true);
        } catch (err: any) {
          console.error("E2EE Conv init failed:", err);
          setError(err.message);
        }
      })();
      
      initPromises.set(conversationId!, promise);
      await promise;
      setTimeout(() => initPromises.delete(conversationId!), 10000);
    }

    loadConvKey();
  }, [profile, conversationId, supabase, identityReady]);

  const encrypt = useCallback(async (text: string) => {
    if (!conversationKey) throw new Error("E2EE not ready");
    return await E2EE.encryptText(text, conversationKey);
  }, [conversationKey]);

  const decrypt = useCallback(async (ciphertext: string) => {
    if (!conversationKey) throw new Error("E2EE not ready");
    return await E2EE.decryptText(ciphertext, conversationKey);
  }, [conversationKey]);

  const encryptAttachment = useCallback(async (file: Blob) => {
    if (!conversationKey) throw new Error("E2EE not ready");
    return await E2EE.encryptFile(file, conversationKey);
  }, [conversationKey]);

  const decryptAttachment = useCallback(async (file: Blob, mimeType?: string) => {
    if (!conversationKey) throw new Error("E2EE not ready");
    return await E2EE.decryptFile(file, conversationKey, mimeType);
  }, [conversationKey]);

  return {
    isReady,
    error,
    encrypt,
    decrypt,
    encryptAttachment,
    decryptAttachment
  };
}
