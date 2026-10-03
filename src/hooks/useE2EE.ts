'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import * as E2EE from '@/lib/e2ee';

const keyRegistry = new Map<string, CryptoKey>();
const initPromises = new Map<string, Promise<CryptoKey>>();

function regKey(userId: string, conversationId: string) {
  return `${userId}:${conversationId}`;
}

export type E2EEState = 'idle' | 'initializing' | 'waiting_for_device_authorization' | 'key_provisioning' | 'ready' | 'error';

export function useE2EE(conversationId?: string) {
  const profile = useAuthStore(s => s.profile);
  const [e2eeState, setE2eeState] = useState<E2EEState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const supabaseRef = useRef(createClient());
  const convKeyRef = useRef<CryptoKey | null>(null);

  const [identityReady, setIdentityReady] = useState(false);
  const identityReadyRef = useRef(false);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    const supabase = supabaseRef.current;

    async function initIdentity() {
      try {
        let deviceId = localStorage.getItem('connectx_device_id');
        if (!deviceId) {
          deviceId = 'dev_' + crypto.randomUUID().replace(/-/g, '');
          localStorage.setItem('connectx_device_id', deviceId);
        }

        let keys = await E2EE.loadKeyPair(profile!.id);
        if (!keys) {
          keys = await E2EE.generateRSAKeyPair();
          await E2EE.storeKeyPair(profile!.id, keys.publicKey, keys.privateKey);
        }
        
        const pubKeyB64 = await E2EE.exportPublicKey(keys.publicKey);

        const { data: existingDevice } = await supabase
          .from('user_devices')
          .select('id, public_key')
          .eq('device_id', deviceId)
          .eq('user_id', profile!.id)
          .single();

        if (!existingDevice) {
          if (!cancelled) {
            await supabase.from('user_devices').insert({
              user_id: profile!.id,
              device_id: deviceId,
              public_key: pubKeyB64
            });
          }
        } else if (existingDevice.public_key !== pubKeyB64) {
          if (!cancelled) {
            await supabase.from('user_devices').update({ public_key: pubKeyB64 }).eq('id', existingDevice.id);
          }
        }

        if (!cancelled) {
          identityReadyRef.current = true;
          setIdentityReady(true);
        }
      } catch (err) {
        console.error('[E2EE] Identity init failed:', err);
      }
    }

    if (!identityReadyRef.current) {
      initIdentity();
    }
    return () => { cancelled = true; };
  }, [profile?.id, profile]);

  useEffect(() => {
    if (!profile?.id || !conversationId) {
      Promise.resolve().then(() => setE2eeState('idle'));
      return;
    }
    if (!identityReady) {
      Promise.resolve().then(() => setE2eeState('initializing'));
      return;
    }

    Promise.resolve().then(() => {
      setE2eeState('initializing');
      setError(null);
    });

    const rKey = regKey(profile.id, conversationId);
    const supabase = supabaseRef.current;

    // Listen for key rotation/updates from other devices
    const channelName = `e2ee_keys_${conversationId}`;
    supabase.getChannels().forEach(c => {
      if (c.topic === `realtime:${channelName}`) {
        supabase.removeChannel(c);
      }
    });

    const channel = supabase.channel(channelName)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversation_members',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        if (payload.new.user_id === profile.id && JSON.stringify(payload.new.encrypted_keys) !== JSON.stringify(payload.old?.encrypted_keys)) {
          initPromises.delete(rKey);
          keyRegistry.delete(rKey);
          setRefreshTrigger(prev => prev + 1);
        }
      })
      .subscribe();

    const autoProvisionMissingDevices = async (aesKey: CryptoKey) => {
      try {
        const { data: members } = await supabase
          .from('conversation_members')
          .select('id, user_id, encrypted_keys')
          .eq('conversation_id', conversationId);
        if (!members) return;

        const { data: allDevices } = await supabase
          .from('user_devices')
          .select('id, user_id, device_id, public_key')
          .in('user_id', members.map(m => m.user_id));
        if (!allDevices) return;

        const rawAesBase64 = await E2EE.exportConversationKey(aesKey);

        for (const m of members) {
          const mDevices = allDevices.filter(d => d.user_id === m.user_id);
          const currentKeys = m.encrypted_keys || {};
          let updated = false;

          for (const d of mDevices) {
            if (!currentKeys[d.device_id]) {
               const encKey = await E2EE.encryptConversationKey(rawAesBase64, d.public_key);
               currentKeys[d.device_id] = encKey;
               updated = true;
            }
          }

          if (updated) {
            await supabase.rpc('update_member_keys', { p_member_id: m.id, p_encrypted_keys: currentKeys });
          }
        }
      } catch (err) {
        console.error('[E2EE] Auto-provisioning failed:', err);
      }
    };

    if (keyRegistry.has(rKey)) {
      convKeyRef.current = keyRegistry.get(rKey)!;
      Promise.resolve().then(() => setE2eeState('ready'));
      autoProvisionMissingDevices(convKeyRef.current);
      return;
    }

    if (!initPromises.has(rKey)) {
      const promise = (async (): Promise<CryptoKey> => {
        const identityKeys = await E2EE.loadKeyPair(profile!.id);
        if (!identityKeys) throw new Error('[E2EE] Identity keys missing.');
        const myDeviceId = localStorage.getItem('connectx_device_id')!;

        const { data: member, error: memberErr } = await supabase
          .from('conversation_members')
          .select('id, encrypted_key, encrypted_keys')
          .eq('conversation_id', conversationId)
          .eq('user_id', profile!.id)
          .single();

        if (memberErr && memberErr.code !== 'PGRST116') throw new Error(`Fetch error: ${memberErr.message}`);
        if (!member) throw new Error(`You are not a member of conversation ${conversationId}.`);

        const keysObj = member.encrypted_keys || {};
        
        let recoveredAesKey: CryptoKey | null = null;
        let recoveredEncStr: string | null = null;

        // CASE A: Device explicitly authorized
        if (keysObj[myDeviceId]) {
          try {
            const rawAesBase64 = await E2EE.decryptConversationKey(keysObj[myDeviceId], identityKeys.privateKey);
            recoveredAesKey = await E2EE.importConversationKey(rawAesBase64);
            recoveredEncStr = keysObj[myDeviceId];
          } catch {
            // Failed to decrypt with current device id
          }
        }

        // CASE B: Recovery from other device IDs mapped to the same RSA key
        if (!recoveredAesKey) {
          for (const [devId, encStr] of Object.entries(keysObj)) {
            if (devId === myDeviceId) continue;
            try {
              const rawAesBase64 = await E2EE.decryptConversationKey(encStr as string, identityKeys.privateKey);
              recoveredAesKey = await E2EE.importConversationKey(rawAesBase64);
              recoveredEncStr = encStr as string;
              break;
            } catch {
              // ignore
            }
          }
        }

        // CASE C: Legacy key fallback (migration)
        if (!recoveredAesKey && member.encrypted_key) {
          try {
            const rawAesBase64 = await E2EE.decryptConversationKey(member.encrypted_key, identityKeys.privateKey);
            recoveredAesKey = await E2EE.importConversationKey(rawAesBase64);
            recoveredEncStr = member.encrypted_key;
          } catch {
            // ignore
          }
        }

        if (recoveredAesKey && recoveredEncStr) {
           if (!keysObj[myDeviceId]) {
              keysObj[myDeviceId] = recoveredEncStr;
              await supabase.rpc('update_member_keys', { p_member_id: member.id, p_encrypted_keys: keysObj });
           }
           return recoveredAesKey;
        }

        // CASE C: Check if ANY member has keys (Waiting for authorization)
        const { data: allMembers, error: allErr } = await supabase
          .from('conversation_members')
          .select('id, user_id, encrypted_key, encrypted_keys')
          .eq('conversation_id', conversationId);

        if (allErr) throw new Error(`Fetch members error: ${allErr.message}`);

        const othersHaveKeys = allMembers?.some(m => {
          if (m.encrypted_key) return true;
          if (m.encrypted_keys && Object.keys(m.encrypted_keys).length > 0) return true;
          return false;
        });

        if (othersHaveKeys) {
          const wErr = new Error('WAITING_FOR_DEVICE_AUTHORIZATION');
          wErr.name = 'WAITING_FOR_DEVICE_AUTHORIZATION';
          throw wErr;
        }

        // CASE D: Genuinely new conversation
        const aesKey = await E2EE.generateConversationKey();
        const rawAesBase64 = await E2EE.exportConversationKey(aesKey);
        const myPubKeyB64 = await E2EE.exportPublicKey(identityKeys.publicKey);

        for (const m of allMembers || []) {
          const newKeysObj = m.encrypted_keys || {};
          let legacyPubKey = myPubKeyB64;
          
          if (m.user_id !== profile!.id) {
             const { data: mDevices } = await supabase.from('user_devices').select('device_id, public_key').eq('user_id', m.user_id);
             if (mDevices && mDevices.length > 0) {
               for (const d of mDevices) {
                 newKeysObj[d.device_id] = await E2EE.encryptConversationKey(rawAesBase64, d.public_key);
               }
               legacyPubKey = mDevices[0].public_key;
             }
          } else {
             newKeysObj[myDeviceId] = await E2EE.encryptConversationKey(rawAesBase64, myPubKeyB64);
          }
          
          await supabase.rpc('update_member_keys', { p_member_id: m.id, p_encrypted_keys: newKeysObj });
          
          const legacyEncKey = await E2EE.encryptConversationKey(rawAesBase64, legacyPubKey);
          await supabase.rpc('update_member_key', { p_member_id: m.id, p_encrypted_key: legacyEncKey });
        }

        return aesKey;
      })();

      initPromises.set(rKey, promise);
      promise.finally(() => setTimeout(() => initPromises.delete(rKey), 60_000));
    }

    let cancelled = false;
    initPromises.get(rKey)!
      .then(aesKey => {
        if (cancelled) return;
        keyRegistry.set(rKey, aesKey);
        convKeyRef.current = aesKey;
        setE2eeState('ready');
        setError(null);
        autoProvisionMissingDevices(aesKey);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        convKeyRef.current = null;
        if (err.name === 'WAITING_FOR_DEVICE_AUTHORIZATION' || msg.includes('WAITING_FOR_DEVICE_AUTHORIZATION')) {
          setE2eeState('waiting_for_device_authorization');
          setError('This device needs access to the conversation key. Open this chat on your original device to automatically securely sync the keys.');
        } else {
          setE2eeState('error');
          setError(msg);
        }
      });

    return () => { 
      cancelled = true; 
      supabase.removeChannel(channel);
    };
  }, [profile, conversationId, identityReady, refreshTrigger]);

  const isReady = e2eeState === 'ready';

  const encrypt = useCallback(async (text: string): Promise<string> => {
    const key = convKeyRef.current;
    if (e2eeState !== 'ready' || !key) {
      throw new Error(`[E2EE] Cannot encrypt — state is "${e2eeState}", key is ${key ? 'present' : 'null'}`);
    }
    return E2EE.encryptText(text, key);
  }, [e2eeState]);

  const decrypt = useCallback(async (ciphertext: string): Promise<string> => {
    const key = convKeyRef.current;
    if (!key) throw new Error('[E2EE] Cannot decrypt — key not available');
    return E2EE.decryptText(ciphertext, key);
  }, []);

  const encryptAttachment = useCallback(async (file: Blob): Promise<Blob> => {
    const key = convKeyRef.current;
    if (e2eeState !== 'ready' || !key) throw new Error('[E2EE] Cannot encrypt attachment — not ready');
    return E2EE.encryptFile(file, key);
  }, [e2eeState]);

  const decryptAttachment = useCallback(async (file: Blob, mimeType?: string): Promise<Blob> => {
    const key = convKeyRef.current;
    if (!key) throw new Error('[E2EE] Cannot decrypt attachment — key not available');
    return E2EE.decryptFile(file, key, mimeType);
  }, []);

  return {
    isReady,
    error,
    e2eeState,
    encrypt,
    decrypt,
    encryptAttachment,
    decryptAttachment,
    reloadKey: () => {
      if (!conversationId || !profile?.id) return;
      const rKey = regKey(profile.id, conversationId);
      initPromises.delete(rKey);
      keyRegistry.delete(rKey);
      setRefreshTrigger(prev => prev + 1);
    },
    resetConversationKey: async () => {
      if (!conversationId) return;
      const { error } = await supabaseRef.current.rpc('reset_conversation_keys', { p_conversation_id: conversationId });
      if (error) {
        console.error('[E2EE] Reset failed:', error);
        alert('Failed to reset session: ' + error.message);
        return;
      }
      window.location.reload();
    },
  };
}
