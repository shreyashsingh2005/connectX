'use client';

// A simple but robust E2EE implementation using Web Crypto API.
// Features: ECDH for key derivation, AES-GCM for encryption.
// Keys are stored in IndexedDB.

const DB_NAME = 'connectx_e2ee';
const STORE_NAME = 'keypair';

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeKeyPair(publicKey: CryptoKey, privateKey: CryptoKey): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(publicKey, 'publicKey');
    store.put(privateKey, 'privateKey');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadKeyPair(): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey } | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const getPub = store.get('publicKey');
    const getPriv = store.get('privateKey');

    tx.oncomplete = () => {
      if (getPub.result && getPriv.result) {
        resolve({ publicKey: getPub.result, privateKey: getPriv.result });
      } else {
        resolve(null);
      }
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function generateRSAKeyPair(): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> {
  return await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('spki', key);
  const exportedAsString = String.fromCharCode.apply(null, Array.from(new Uint8Array(exported)));
  return btoa(exportedAsString);
}

export async function importPublicKey(pem: string): Promise<CryptoKey> {
  const binaryDerString = atob(pem);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }
  return await crypto.subtle.importKey(
    'spki',
    binaryDer.buffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );
}

export async function generateConversationKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportConversationKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(raw))));
}

export async function importConversationKey(rawBase64: string): Promise<CryptoKey> {
  const rawStr = atob(rawBase64);
  const raw = new Uint8Array(rawStr.length);
  for (let i = 0; i < rawStr.length; i++) {
    raw[i] = rawStr.charCodeAt(i);
  }
  return await crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt the AES key for a specific user using their RSA public key
export async function encryptConversationKey(aesKeyRawBase64: string, recipientPublicKeyPem: string): Promise<string> {
  const pubKey = await importPublicKey(recipientPublicKeyPem);
  const data = new TextEncoder().encode(aesKeyRawBase64);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    pubKey,
    data
  );
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(ciphertext))));
}

// Decrypt the AES key using our RSA private key
export async function decryptConversationKey(encryptedAesKeyBase64: string, privateKey: CryptoKey): Promise<string> {
  const encStr = atob(encryptedAesKeyBase64);
  const enc = new Uint8Array(encStr.length);
  for (let i = 0; i < encStr.length; i++) {
    enc[i] = encStr.charCodeAt(i);
  }
  const decrypted = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    enc
  );
  return new TextDecoder().decode(decrypted);
}

// Encrypt text message
export async function encryptText(text: string, aesKey: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encoded
  );
  
  // Pack IV + ciphertext
  const payload = new Uint8Array(12 + ciphertext.byteLength);
  payload.set(iv, 0);
  payload.set(new Uint8Array(ciphertext), 12);
  
  return btoa(String.fromCharCode.apply(null, Array.from(payload)));
}

// Decrypt text message
export async function decryptText(payloadBase64: string, aesKey: CryptoKey): Promise<string> {
  try {
    const payloadStr = atob(payloadBase64);
    const payload = new Uint8Array(payloadStr.length);
    for (let i = 0; i < payloadStr.length; i++) {
      payload[i] = payloadStr.charCodeAt(i);
    }
    
    const iv = payload.slice(0, 12);
    const ciphertext = payload.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error("E2EE Decrypt failed:", err);
    return "[Encrypted Message - Unable to decrypt]";
  }
}

// Encrypt file Blob
export async function encryptFile(file: Blob, aesKey: CryptoKey): Promise<Blob> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buffer = await file.arrayBuffer();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    buffer
  );
  return new Blob([iv, ciphertext], { type: file.type });
}

// Decrypt file Blob
export async function decryptFile(blob: Blob, aesKey: CryptoKey): Promise<Blob> {
  const buffer = await blob.arrayBuffer();
  const iv = buffer.slice(0, 12);
  const ciphertext = buffer.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    aesKey,
    ciphertext
  );
  return new Blob([decrypted], { type: blob.type });
}
