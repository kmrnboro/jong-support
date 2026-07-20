const ARCHIVE_FORMAT = "mahjong-archive-encrypted";
const ARCHIVE_VERSION = 1;
const MAX_PBKDF2_ITERATIONS = 10_000_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH_BITS = 256;

export const DECRYPTION_ERROR_MESSAGE =
  "パスワードが違うか、アーカイブが破損しています。";

type KdfEnvelope = {
  name: "PBKDF2";
  hash: "SHA-256";
  iterations: number;
  salt: string;
};

type CipherEnvelope = {
  name: "AES-GCM";
  keyLength: 256;
  iv: string;
  ciphertext: string;
};

export type EncryptedArchiveEnvelope = {
  format: typeof ARCHIVE_FORMAT;
  version: typeof ARCHIVE_VERSION;
  kdf: KdfEnvelope;
  cipher: CipherEnvelope;
};

export class ArchiveDecryptionError extends Error {
  constructor() {
    super(DECRYPTION_ERROR_MESSAGE);
    this.name = "ArchiveDecryptionError";
  }
}

export class UnsupportedEncryptedArchiveError extends Error {
  constructor() {
    super("このアーカイブ形式には対応していません。");
    this.name = "UnsupportedEncryptedArchiveError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSupportedEnvelope(
  value: unknown,
): value is EncryptedArchiveEnvelope {
  if (!isRecord(value) || !isRecord(value.kdf) || !isRecord(value.cipher)) {
    return false;
  }

  return (
    value.format === ARCHIVE_FORMAT &&
    value.version === ARCHIVE_VERSION &&
    value.kdf.name === "PBKDF2" &&
    value.kdf.hash === "SHA-256" &&
    Number.isInteger(value.kdf.iterations) &&
    typeof value.kdf.iterations === "number" &&
    value.kdf.iterations > 0 &&
    value.kdf.iterations <= MAX_PBKDF2_ITERATIONS &&
    typeof value.kdf.salt === "string" &&
    value.cipher.name === "AES-GCM" &&
    value.cipher.keyLength === KEY_LENGTH_BITS &&
    typeof value.cipher.iv === "string" &&
    typeof value.cipher.ciphertext === "string"
  );
}

function decodeBase64(value: string): ArrayBuffer {
  if (value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new ArchiveDecryptionError();
  }

  let binary: string;
  try {
    binary = atob(value);
  } catch {
    throw new ArchiveDecryptionError();
  }

  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function requireSupportedEnvelope(
  value: unknown,
): EncryptedArchiveEnvelope {
  if (
    isRecord(value) &&
    (value.format !== ARCHIVE_FORMAT || value.version !== ARCHIVE_VERSION)
  ) {
    throw new UnsupportedEncryptedArchiveError();
  }

  if (!isSupportedEnvelope(value)) {
    throw new ArchiveDecryptionError();
  }

  return value;
}

export async function decryptArchive(
  value: unknown,
  password: string,
): Promise<Uint8Array> {
  const envelope = requireSupportedEnvelope(value);

  if (password.length === 0) {
    throw new ArchiveDecryptionError();
  }

  const salt = decodeBase64(envelope.kdf.salt);
  const iv = decodeBase64(envelope.cipher.iv);
  const ciphertext = decodeBase64(envelope.cipher.ciphertext);

  if (
    salt.byteLength !== SALT_LENGTH ||
    iv.byteLength !== IV_LENGTH ||
    ciphertext.byteLength < 16
  ) {
    throw new ArchiveDecryptionError();
  }

  try {
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"],
    );
    const archiveKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt,
        iterations: envelope.kdf.iterations,
      },
      passwordKey,
      { name: "AES-GCM", length: KEY_LENGTH_BITS },
      false,
      ["decrypt"],
    );
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      archiveKey,
      ciphertext,
    );

    return new Uint8Array(plaintext);
  } catch {
    throw new ArchiveDecryptionError();
  }
}

