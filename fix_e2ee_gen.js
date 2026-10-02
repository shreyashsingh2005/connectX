const fs = require('fs');
let code = fs.readFileSync('src/hooks/useE2EE.ts', 'utf8');

// Replace the generation block to check for existing keys
const newBlock = `if (!aesKey) {
              // Get all members and their public keys
              const { data: members, error: membersErr } = await supabase
                .from('conversation_members')
                .select('id, user_id, encrypted_key, profiles(public_key)')
                .eq('conversation_id', conversationId);
  
              if (membersErr) throw membersErr;

              const anyMemberHasKey = members?.some(m => m.encrypted_key);
              if (anyMemberHasKey) {
                 console.error("CRITICAL: Conversation key already exists for other members, but is missing or undecryptable for current user. DO NOT regenerate.");
                 throw new Error("Conversation key exists but is unavailable for this device/session.");
              }

              // We need to generate a new key and distribute it!
              aesKey = await E2EE.generateConversationKey();
              const rawAesBase64 = await E2EE.exportConversationKey(aesKey);
              const myPubKeyB64 = await E2EE.exportPublicKey(keys.publicKey);
  
              for (const m of members || []) {
                const pubKey = (m.profiles as any)?.public_key || (m.user_id === profile!.id ? myPubKeyB64 : null);
                if (pubKey) {
                  const encKey = await E2EE.encryptConversationKey(rawAesBase64, pubKey);
                  const { error: rpcErr } = await supabase.rpc('update_member_key', { p_member_id: m.id, p_encrypted_key: encKey });
                  if (rpcErr) throw rpcErr;
                }
              }
            }`;

const regex = /if \(\!aesKey\) \{[\s\S]*?(?=setConversationKey\(aesKey\);)/;
code = code.replace(regex, newBlock + '\n            ');

fs.writeFileSync('src/hooks/useE2EE.ts', code, 'utf8');
console.log('Fixed useE2EE key generation protection');
