const crypto = require('crypto');

async function testCrypto() {
  const rsaKeys = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const exportedPub = await crypto.subtle.exportKey('spki', rsaKeys.publicKey);
  const pubKeyB64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(exportedPub))));
  const pem = "-----BEGIN PUBLIC KEY-----\\n" + pubKeyB64.match(/.{1,64}/g).join('\\n') + "\\n-----END PUBLIC KEY-----";

  console.log('PEM:', pem.slice(0, 50));

  const pubKeyImported = await crypto.subtle.importKey(
    'spki',
    exportedPub,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );

  const aesKey = 'some-raw-aes-base64-string-here';
  
  const data = new TextEncoder().encode(aesKey);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    pubKeyImported,
    data
  );
  
  const encryptedB64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(ciphertext))));
  console.log('Encrypted B64 Length:', encryptedB64.length);

  const encStr = atob(encryptedB64);
  const enc = new Uint8Array(encStr.length);
  for (let i = 0; i < encStr.length; i++) {
    enc[i] = encStr.charCodeAt(i);
  }
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    rsaKeys.privateKey,
    enc
  );
  
  console.log('Decrypted:', new TextDecoder().decode(decrypted));
}

testCrypto();
