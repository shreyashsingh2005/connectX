const crypto = require('crypto').webcrypto;

async function test() {
  const text = Buffer.from('f09f9882', 'hex').toString('utf8'); // 😂 safely
  const encoded = new TextEncoder().encode(text);
  console.log("Encoded length:", encoded.length);

  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encoded
  );
  
  const payload = new Uint8Array(12 + ciphertext.byteLength);
  payload.set(iv, 0);
  payload.set(new Uint8Array(ciphertext), 12);
  
  const payloadBase64 = btoa(String.fromCharCode.apply(null, Array.from(payload)));
  console.log("Encrypted base64:", payloadBase64, "length:", payloadBase64.length);
}

test();
