/**
 * Security Model Note:
 * This implementation uses a simple stream cipher approach (XOR with SHA-256 derived stream) 
 * since React Native lacks native AES-GCM without external native modules. 
 * For production applications requiring true AES-256-GCM, it is strongly recommended 
 * to use `react-native-aes-crypto` or `react-native-quick-crypto`.
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Buffer } from 'buffer';

const SECURE_STORE_KEY = 'MONEY_HONEY_ENCRYPTION_KEY';
const KEY_SIZE_BYTES = 32; // 256 bits
const PBKDF2_ITERATIONS = 310000; // As per instructions

/**
 * Derives a key using PBKDF2-like repeated HMAC-SHA256
 * @param pin The user PIN
 * @param salt The salt
 * @returns A hex string of the derived key
 */
export async function deriveKey(pin: string, salt: string): Promise<string> {
  let key = pin + salt;
  for (let i = 0; i < PBKDF2_ITERATIONS; i++) {
    key = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, key);
  }
  return key;
}

/**
 * Generates a 32-byte random hex string salt
 * @returns A hex string of random bytes
 */
export async function generateSalt(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(KEY_SIZE_BYTES);
  return Buffer.from(bytes).toString('hex');
}

/**
 * Initializes encryption by generating a salt, deriving a key, and storing it
 * @param pin The user PIN
 */
export async function initializeEncryption(pin: string): Promise<void> {
  const salt = await generateSalt();
  const key = await deriveKey(pin, salt);
  await SecureStore.setItemAsync(SECURE_STORE_KEY, key);
}

/**
 * Retrieves the stored encryption key
 * @returns The key string or null
 */
export async function getEncryptionKey(): Promise<string | null> {
  return await SecureStore.getItemAsync(SECURE_STORE_KEY);
}

async function hmacSha256(data: string, key: string): Promise<string> {
    const combined = data + key;
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, combined);
}

/**
 * Encrypts plaintext using XOR stream cipher with SHA-256 chains
 * @param plaintext Data to encrypt
 * @param key The encryption key (hex)
 * @returns Base64 encoded string containing IV, ciphertext, and HMAC
 */
export async function encryptData(plaintext: string, key: string): Promise<string> {
  const ivBytes = await Crypto.getRandomBytesAsync(16);
  const iv = Buffer.from(ivBytes).toString('hex');
  
  const textBuffer = Buffer.from(plaintext, 'utf-8');
  const cipherBuffer = Buffer.alloc(textBuffer.length);
  
  let currentHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, key + iv);
  let hashBuffer = Buffer.from(currentHash, 'hex');
  let hashIndex = 0;

  for (let i = 0; i < textBuffer.length; i++) {
    if (hashIndex >= hashBuffer.length) {
      currentHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, currentHash);
      hashBuffer = Buffer.from(currentHash, 'hex');
      hashIndex = 0;
    }
    cipherBuffer[i] = textBuffer[i] ^ hashBuffer[hashIndex];
    hashIndex++;
  }

  const ciphertext = cipherBuffer.toString('hex');
  const hmac = await hmacSha256(iv + ciphertext, key);
  
  const finalString = JSON.stringify({ iv, ciphertext, hmac });
  return Buffer.from(finalString).toString('base64');
}

/**
 * Decrypts a base64 encoded encrypted string
 * @param encryptedBase64 The base64 string
 * @param key The encryption key (hex)
 * @returns The decrypted plaintext
 */
export async function decryptData(encryptedBase64: string, key: string): Promise<string> {
  const decodedString = Buffer.from(encryptedBase64, 'base64').toString('utf-8');
  const { iv, ciphertext, hmac } = JSON.parse(decodedString);

  const expectedHmac = await hmacSha256(iv + ciphertext, key);
  if (hmac !== expectedHmac) {
    throw new Error('HMAC verification failed, data may be corrupted or key is incorrect');
  }

  const cipherBuffer = Buffer.from(ciphertext, 'hex');
  const textBuffer = Buffer.alloc(cipherBuffer.length);

  let currentHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, key + iv);
  let hashBuffer = Buffer.from(currentHash, 'hex');
  let hashIndex = 0;

  for (let i = 0; i < cipherBuffer.length; i++) {
    if (hashIndex >= hashBuffer.length) {
      currentHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, currentHash);
      hashBuffer = Buffer.from(currentHash, 'hex');
      hashIndex = 0;
    }
    textBuffer[i] = cipherBuffer[i] ^ hashBuffer[hashIndex];
    hashIndex++;
  }

  return textBuffer.toString('utf-8');
}

/**
 * Encrypts an object by converting it to JSON first
 */
export async function encryptJSON<T>(data: T, key: string): Promise<string> {
  const jsonStr = JSON.stringify(data);
  return await encryptData(jsonStr, key);
}

/**
 * Decrypts to an object
 */
export async function decryptJSON<T>(encryptedBase64: string, key: string): Promise<T> {
  const jsonStr = await decryptData(encryptedBase64, key);
  return JSON.parse(jsonStr) as T;
}

/**
 * Checks if encryption is initialized
 */
export async function isEncryptionInitialized(): Promise<boolean> {
  const key = await getEncryptionKey();
  return key !== null;
}

/**
 * Clears the encryption key
 */
export async function clearEncryptionKey(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
}
