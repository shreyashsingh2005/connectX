const fs = require('fs');
let code = fs.readFileSync('src/lib/e2ee.ts', 'utf8');

// Replace encryptText
code = code.replace(
  /export async function encryptText[\s\S]*?return btoa\(String\.fromCharCode\.apply\(null, Array\.from\(payload\)\)\);\n\}/,
  `export async function encryptText(text: string, aesKey: CryptoKey): Promise<string> {
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
  return btoa(binString);
}`
);

// Replace decryptText
code = code.replace(
  /export async function decryptText[\s\S]*?return "\[E2EE_TRACE_FAIL: err=" \+ err\?\.name \+ ":" \+ \(err\?\.message \|\| 'none'\) \+ ", payloadLen=" \+ payloadBase64\?\.length \+ ", keyAlgo=" \+ aesKey\?\.algorithm\?\.name \+ "\]";\n    \}\n\}/,
  `export async function decryptText(payloadBase64: string, aesKey: CryptoKey): Promise<string> {
  try {
    const binString = atob(payloadBase64);
    const payload = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
    
    if (payload.length < 12) {
      throw new Error("Invalid payload length");
    }
    
    const iv = payload.slice(0, 12);
    const ciphertext = payload.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch (err: any) {
    throw new Error("DECRYPTION_FAILED");
  }
}`
);

fs.writeFileSync('src/lib/e2ee.ts', code, 'utf8');
console.log("Updated e2ee.ts");
