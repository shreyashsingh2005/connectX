const crypto = require('crypto');

async function testCrypto() {
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const text = 'hello-e2ee-001';
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encoded
  );
  
  const payload = new Uint8Array(12 + ciphertext.byteLength);
  payload.set(iv, 0);
  payload.set(new Uint8Array(ciphertext), 12);
  
  const binString = Array.from(payload, (byte) => String.fromCharCode(byte)).join('');
  const base64 = btoa(binString);
  console.log('Encrypted:', base64);
  
  const decBinString = atob(base64);
  const decPayload = Uint8Array.from(decBinString, (m) => m.codePointAt(0));
  const decIv = decPayload.slice(0, 12);
  const decCipher = decPayload.slice(12);
  
  const dec = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: decIv },
    aesKey,
    decCipher
  );
  console.log('Decrypted:', new TextDecoder().decode(dec));
}

testCrypto();
