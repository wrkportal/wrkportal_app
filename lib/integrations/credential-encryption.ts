/**
 * Credential Encryption Service
 * 
 * Encrypts and decrypts integration credentials using AES-256-GCM
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32
const ITERATIONS = 100000

/**
 * Get encryption key from environment variable or generate a default
 * In production, this should be stored securely (e.g., AWS KMS, HashiCorp Vault)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.INTEGRATION_ENCRYPTION_KEY
  
  if (!key) {
    // Fallback to a default key (NOT SECURE - should be set in production)
    console.warn('WARNING: INTEGRATION_ENCRYPTION_KEY not set. Using default key (NOT SECURE FOR PRODUCTION)')
    return crypto.scryptSync('default-key-change-in-production', 'salt', KEY_LENGTH)
  }
  
  // If key is a hex string, convert it
  if (key.length === 64) {
    return Buffer.from(key, 'hex')
  }
  
  // Otherwise, derive key from the string
  return crypto.scryptSync(key, 'integration-salt', KEY_LENGTH)
}

/**
 * Encrypt credentials
 */
export function encryptCredentials(credentials: Record<string, any>): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const salt = crypto.randomBytes(SALT_LENGTH)
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    const plaintext = JSON.stringify(credentials)
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    // Combine salt, iv, tag, and encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex'),
    ])
    
    return combined.toString('base64')
  } catch (error) {
    console.error('Error encrypting credentials:', error)
    throw new Error('Failed to encrypt credentials')
  }
}

/**
 * Decrypt credentials
 */
export function decryptCredentials(encryptedData: string): Record<string, any> {
  try {
    const key = getEncryptionKey()
    const combined = Buffer.from(encryptedData, 'base64')
    
    // Extract components
    const salt = combined.slice(0, SALT_LENGTH)
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')
    
    return JSON.parse(decrypted)
  } catch (error) {
    console.error('Error decrypting credentials:', error)
    throw new Error('Failed to decrypt credentials')
  }
}

