/**
 * Client-side encryption utilities using Web Crypto API.
 * 
 * SECURITY PRINCIPLES:
 * 1. Master password NEVER leaves the client
 * 2. Encryption key derived from master password using PBKDF2
 * 3. Each password encrypted with AES-256-GCM
 * 4. Server stores encrypted data but cannot decrypt it
 */

export interface EncryptedData {
  ciphertext: string; // Base64
  iv: string; // Base64
  tag: string; // Base64
}

export interface KdfParams {
  salt: string; // Base64
  iterations: number;
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Derive encryption key from master password using PBKDF2
 */
export async function deriveKey(
  masterPassword: string,
  salt: BufferSource,                // FIXED
  iterations: number = 100000
): Promise<CryptoKey> {

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(masterPassword);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  // Normalize buffer source (FIX)
  const saltArray =
    salt instanceof Uint8Array ? salt : new Uint8Array(salt as ArrayBuffer);

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltArray,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return key;
}

/**
 * Encrypt data using AES-256-GCM
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: 128
    },
    key,
    data
  );

  const ciphertextArray = new Uint8Array(ciphertext);
  const actualCiphertext = ciphertextArray.slice(0, -16);
  const tag = ciphertextArray.slice(-16);

  return {
    ciphertext: arrayBufferToBase64(actualCiphertext),
    iv: arrayBufferToBase64(iv),
    tag: arrayBufferToBase64(tag)
  };
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decrypt(
  encryptedData: EncryptedData,
  key: CryptoKey
): Promise<string> {
  const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);
  const iv = base64ToArrayBuffer(encryptedData.iv);
  const tag = base64ToArrayBuffer(encryptedData.tag);

  const combined = new Uint8Array(ciphertext.byteLength + tag.byteLength);
  combined.set(new Uint8Array(ciphertext), 0);
  combined.set(new Uint8Array(tag), ciphertext.byteLength);

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv),
        tagLength: 128
      },
      key,
      combined
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);

  } catch {
    throw new Error("Decryption failed - invalid key or corrupted data");
  }
}

/**
 * Convert ArrayBuffer to Base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Hash master password for authentication (not encryption)
 */
export async function hashMasterPassword(
  masterPassword: string,
  salt: BufferSource   // FIXED: accept BufferSource
): Promise<string> {

  const encoder = new TextEncoder();
  const data = encoder.encode(masterPassword);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    data,
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const saltArray =
    salt instanceof Uint8Array ? salt : new Uint8Array(salt as ArrayBuffer);

  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltArray,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return arrayBufferToBase64(hash);
}

/**
 * Calculate password strength
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  else feedback.push("Use at least 16 characters");

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("Include lowercase letters");

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("Include uppercase letters");

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push("Include numbers");

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push("Include symbols");

  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push("Avoid repeated characters");
  }

  if (/^[0-9]+$/.test(password) || /^[a-zA-Z]+$/.test(password)) {
    score -= 1;
    feedback.push("Mix different character types");
  }

  score = Math.max(0, Math.min(5, score));

  return { score, feedback };
}

/**
 * Generate a random password
 */
export function generatePassword(options: {
  length?: number;
  useUppercase?: boolean;
  useLowercase?: boolean;
  useNumbers?: boolean;
  useSymbols?: boolean;
}): string {
  const {
    length = 16,
    useUppercase = true,
    useLowercase = true,
    useNumbers = true,
    useSymbols = true
  } = options;

  let charset = "";
  if (useLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
  if (useUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (useNumbers) charset += "0123456789";
  if (useSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

  if (!charset.length) throw new Error("At least one character type must be selected");

  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  return password;
}

/**
 * Secure in-memory key store
 */
class SecureKeyStore {
  private key: CryptoKey | null = null;
  private timeout: NodeJS.Timeout | null = null;

  setKey(key: CryptoKey, timeoutMinutes: number = 15) {
    this.key = key;

    if (this.timeout) clearTimeout(this.timeout);

    this.timeout = setTimeout(() => {
      this.clearKey();
    }, timeoutMinutes * 60 * 1000);
  }

  getKey(): CryptoKey | null {
    return this.key;
  }

  clearKey() {
    this.key = null;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  hasKey(): boolean {
    return this.key !== null;
  }
}

export const keyStore = new SecureKeyStore();
