/**
 * Field-Level Encryption Service
 * 
 * Encrypts sensitive fields (SSN, credit cards, etc.) at the application level
 * Uses AES-256-GCM encryption with tenant-specific keys
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits
const SALT_LENGTH = 64 // 512 bits
const TAG_LENGTH = 16 // 128 bits
const KEY_LENGTH = 32 // 256 bits
const ITERATIONS = 100000 // PBKDF2 iterations

// Get encryption key from environment or generate tenant-specific key
function getEncryptionKey(tenantId: string): Buffer {
  // In production, retrieve from secure key management service (AWS KMS, HashiCorp Vault, etc.)
  const masterKey = process.env.ENCRYPTION_MASTER_KEY || 'default-master-key-change-in-production'
  
  // Derive tenant-specific key from master key + tenant ID
  return crypto.pbkdf2Sync(
    masterKey,
    tenantId,
    ITERATIONS,
    KEY_LENGTH,
    'sha256'
  )
}

/**
 * Encrypt a sensitive field value
 */
export function encryptField(value: string, tenantId: string): string {
  if (!value || value.trim() === '') {
    return value
  }

  try {
    const key = getEncryptionKey(tenantId)
    const iv = crypto.randomBytes(IV_LENGTH)
    const salt = crypto.randomBytes(SALT_LENGTH)
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(value, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    // Combine salt + iv + tag + encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex')
    ])
    
    // Return base64 encoded string with prefix for identification
    return `enc:${combined.toString('base64')}`
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt field')
  }
}

/**
 * Decrypt a sensitive field value
 */
export function decryptField(encryptedValue: string, tenantId: string): string {
  if (!encryptedValue || !encryptedValue.startsWith('enc:')) {
    // Not encrypted, return as-is
    return encryptedValue
  }

  try {
    const key = getEncryptionKey(tenantId)
    const combined = Buffer.from(encryptedValue.substring(4), 'base64')
    
    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH)
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt field')
  }
}

/**
 * Check if a value is encrypted
 */
export function isEncrypted(value: string): boolean {
  return value?.startsWith('enc:') ?? false
}

/**
 * Encrypt multiple fields in an object
 */
export function encryptFields<T extends Record<string, any>>(
  data: T,
  fieldsToEncrypt: string[],
  tenantId: string
): T {
  // Create a mutable copy to allow property assignment
  const encrypted: Record<string, any> = Object.assign({}, data)
  
  for (const field of fieldsToEncrypt) {
    if (field in encrypted && typeof encrypted[field] === 'string' && encrypted[field]) {
      const encryptedValue = encryptField(encrypted[field], tenantId)
      encrypted[field] = encryptedValue
    }
  }
  
  return encrypted as T
}

/**
 * Decrypt multiple fields in an object
 */
export function decryptFields<T extends Record<string, any>>(
  data: T,
  fieldsToDecrypt: string[],
  tenantId: string
): T {
  // Create a mutable copy to allow property assignment
  const decrypted: Record<string, any> = Object.assign({}, data)
  
  for (const field of fieldsToDecrypt) {
    if (field in decrypted && typeof decrypted[field] === 'string' && decrypted[field]) {
      const decryptedValue = decryptField(decrypted[field], tenantId)
      decrypted[field] = decryptedValue
    }
  }
  
  return decrypted as T
}

/**
 * Sensitive field definitions for Sales module
 */
export const SALES_SENSITIVE_FIELDS = {
  contact: ['ssn', 'taxId', 'bankAccount', 'creditCard', 'passportNumber'],
  account: ['taxId', 'bankAccount', 'creditCard'],
  lead: ['ssn', 'taxId'], // If collected during lead capture
  custom: ['ssn', 'taxId', 'bankAccount', 'creditCard', 'passportNumber', 'driversLicense']
} as const

/**
 * Mask sensitive data for display (without decryption)
 */
export function maskSensitiveValue(value: string, maskType: 'full' | 'partial' = 'partial'): string {
  if (!value || value.startsWith('enc:')) {
    return '***'
  }
  
  if (maskType === 'full') {
    return '***'
  }
  
  // Partial mask: show first 2 and last 2 characters
  if (value.length <= 4) {
    return '****'
  }
  
  const first = value.substring(0, 2)
  const last = value.substring(value.length - 2)
  const middle = '*'.repeat(Math.max(0, value.length - 4))
  
  return `${first}${middle}${last}`
}

