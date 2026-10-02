const fs = require('fs');
let code = fs.readFileSync('src/hooks/useE2EE.ts', 'utf8');

code = code.replace(
  'const rawAesBase64 = await E2EE.exportConversationKey(aesKey);',
  'const rawAesBase64 = await E2EE.exportConversationKey(aesKey);\n            const myPubKeyB64 = await E2EE.exportPublicKey(keys.publicKey);'
);

code = code.replace(
  'const pubKey = (m.profiles as any)?.public_key || (m.user_id === profile!.id ? profile!.public_key : null);',
  'const pubKey = (m.profiles as any)?.public_key || (m.user_id === profile!.id ? myPubKeyB64 : null);'
);

fs.writeFileSync('src/hooks/useE2EE.ts', code, 'utf8');
console.log('Fixed AES key distribution to use actual generated public key');
