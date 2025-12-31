// Encryption utilities for sensitive data (connection configs, etc.)

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

/**
 * Get encryption key from environment variable
 * In production, use a secure key management service (AWS KMS, HashiCorp Vault, etc.)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.REPORTING_STUDIO_ENCRYPTION_KEY

  if (!key) {
    throw new Error('REPORTING_STUDIO_ENCRYPTION_KEY environment variable is not set')
  }

  // Derive a consistent key from the environment variable
  // In production, use proper key derivation (PBKDF2, Argon2, etc.)
  return crypto.createHash('sha256').update(key).digest()
}

/**
 * Encrypt sensitive data (e.g., database connection passwords)
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const tag = cipher.getAuthTag()

    // Return IV + Tag + Encrypted data as a single string
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey()
    const parts = encryptedData.split(':')

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const tag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Encrypt a JSON object
 */
export function encryptJSON(data: Record<string, any>): string {
  return encrypt(JSON.stringify(data))
}

/**
 * Decrypt a JSON object
 */
export function decryptJSON(encryptedData: string): Record<string, any> {
  try {
    return JSON.parse(decrypt(encryptedData))
  } catch (error) {
    throw new Error('Failed to decrypt JSON data')
  }
}

/**
 * Hash a value (one-way, for things like API keys)
 */
export function hash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

/**
 * Generate a secure random string
 */
export function generateSecureRandom(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

