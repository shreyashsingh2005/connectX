const crypto = require('crypto').webcrypto;

async function run() {
  const text = "😀 ❤️ 🔥 🙏 🚀 👍🏽 🇮🇳";
  console.log("Original:", text);
  
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
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
  
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(payload)));
  
  const payloadStr = atob(base64);
  const payload2 = new Uint8Array(payloadStr.length);
  for (let i = 0; i < payloadStr.length; i++) {
    payload2[i] = payloadStr.charCodeAt(i);
  }
  const iv2 = payload2.slice(0, 12);
  const ciphertext2 = payload2.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv2 },
    aesKey,
    ciphertext2
  );
  console.log("Decrypted:", new TextDecoder().decode(decrypted));
}
run();
