import "server-only";
import crypto from "node:crypto";

// Cifratura applicativa a livello di colonna per le credenziali OAuth dei
// gateway di pagamento (access_token/refresh_token PayPal Partner e
// GoCardless): a differenza del resto delle credenziali del progetto (Stripe
// Connect, API Key SDD), salvate in chiaro per scelta deliberata (vedi
// 20260825160000_integration_settings.sql), qui il requisito è esplicito.
// AES-256-GCM con IV casuale per ogni valore, chiave derivata da
// CREDENTIALS_ENCRYPTION_KEY tramite SHA-256 (così qualunque stringa,
// non necessariamente 32 byte esatti, è una chiave valida).
const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("CREDENTIALS_ENCRYPTION_KEY non configurato: impossibile cifrare/decifrare le credenziali.");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

/** Cifra un valore in chiaro in una stringa opaca `<iv>.<authTag>.<ciphertext>` (base64url), pronta per il salvataggio su Supabase. */
export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, ciphertext].map((buf) => buf.toString("base64url")).join(".");
}

/** Decifra un valore prodotto da `encryptSecret`. */
export function decryptSecret(payload: string): string {
  const [ivPart, authTagPart, ciphertextPart] = payload.split(".");
  if (!ivPart || !authTagPart || !ciphertextPart) {
    throw new Error("Formato del valore cifrato non valido.");
  }

  const iv = Buffer.from(ivPart, "base64url");
  const authTag = Buffer.from(authTagPart, "base64url");
  const ciphertext = Buffer.from(ciphertextPart, "base64url");

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
