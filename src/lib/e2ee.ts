'use client';

// A simple but robust E2EE implementation using Web Crypto API.
// Features: ECDH for key derivation, AES-GCM for encryption.
// Keys are stored in IndexedDB.

const DB_NAME = 'connectx_e2ee';
const STORE_NAME = 'keypair';

export const conversationKeyCache = new Map<string, CryptoKey>();

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

export async function storeKeyPair(userId: string, publicKey: CryptoKey, privateKey: CryptoKey): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(publicKey, `publicKey_${userId}`);
    store.put(privateKey, `privateKey_${userId}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadKeyPair(userId: string): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey } | null> {
  const db = await initDB();
  
  // Helper to get from IDB
  const getFromStore = (key: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  };

  try {
    const pub = await getFromStore(`publicKey_${userId}`);
    const priv = await getFromStore(`privateKey_${userId}`);
    
    if (pub && priv) {
      return { publicKey: pub, privateKey: priv };
    }
    
    // Fallback: Check for legacy un-scoped keys and migrate them if found
    const legacyPub = await getFromStore('publicKey');
    const legacyPriv = await getFromStore('privateKey');
    
    if (legacyPub && legacyPriv) {
      // Migrate to scoped keys
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(legacyPub, `publicKey_${userId}`);
        store.put(legacyPriv, `privateKey_${userId}`);
        store.delete('publicKey');
        store.delete('privateKey');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      return { publicKey: legacyPub, privateKey: legacyPriv };
    }
    
    return null;
  } catch (err) {
    console.error("Error loading keypair:", err);
    return null;
  }
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
  
  const payload = new Uint8Array(12 + ciphertext.byteLength);
  payload.set(iv, 0);
  payload.set(new Uint8Array(ciphertext), 12);
  
  const binString = Array.from(payload, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binString);
}

// Decrypt text message
export async function decryptText(payloadBase64: string, aesKey: CryptoKey): Promise<string> {
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
export async function decryptFile(blob: Blob, aesKey: CryptoKey, mimeType?: string): Promise<Blob> {
  const buffer = await blob.arrayBuffer();
  const iv = buffer.slice(0, 12);
  const ciphertext = buffer.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    aesKey,
    ciphertext
  );
  return new Blob([decrypted], { type: mimeType || blob.type });
}
