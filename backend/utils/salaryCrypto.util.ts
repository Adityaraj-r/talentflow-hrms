import crypto from "crypto"

const ALGO = "aes-256-gcm"
const IV_LEN = 16
const AUTH_TAG_LEN = 16

function getKey(): Buffer | null {
  const raw = process.env.SALARY_ENCRYPTION_KEY
  if (!raw) return null
  const buf = Buffer.from(raw, raw.length === 64 ? "hex" : "utf8")
  if (buf.length !== 32) return null
  return buf
}

/** Encrypt salary JSON blob when SALARY_ENCRYPTION_KEY (32-byte hex or utf8) is configured. */
export function encryptSalaryPayload(obj: Record<string, unknown>): string | null {
  const key = getKey()
  if (!key) return null
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const json = JSON.stringify(obj)
  const enc = Buffer.concat([cipher.update(json, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString("base64")
}

export function decryptSalaryPayload(b64: string): Record<string, unknown> | null {
  const key = getKey()
  if (!key) return null
  const buf = Buffer.from(b64, "base64")
  const iv = buf.subarray(0, IV_LEN)
  const tag = buf.subarray(IV_LEN, IV_LEN + AUTH_TAG_LEN)
  const data = buf.subarray(IV_LEN + AUTH_TAG_LEN)
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8")
  try {
    return JSON.parse(dec) as Record<string, unknown>
  } catch {
    return null
  }
}
