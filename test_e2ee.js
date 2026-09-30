const crypto = require('crypto').webcrypto;

async function test() {
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const text = '??';
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
  
  const payloadBase64 = btoa(String.fromCharCode.apply(null, Array.from(payload)));
  console.log("Encrypted base64:", payloadBase64, "length:", payloadBase64.length);

  // Decrypt
  const payloadStr = atob(payloadBase64);
  const payloadDec = new Uint8Array(payloadStr.length);
  for (let i = 0; i < payloadStr.length; i++) {
    payloadDec[i] = payloadStr.charCodeAt(i);
  }
  
  const ivDec = payloadDec.slice(0, 12);
  const ciphertextDec = payloadDec.slice(12);
  
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivDec },
      aesKey,
      ciphertextDec
    );
    console.log("Decrypted text:", new TextDecoder().decode(decrypted));
  } catch (err) {
    console.error("Decrypt failed:", err);
  }
}

test();
