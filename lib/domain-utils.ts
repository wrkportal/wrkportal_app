// Utility functions for domain verification and tenant isolation

/**
 * List of public email domains that should NOT be used for domain-based tenant matching
 * Each user with a public domain email gets their own separate tenant
 */
export const PUBLIC_EMAIL_DOMAINS = [
  // Major providers
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.co.in',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  
  // Other popular providers
  'aol.com',
  'protonmail.com',
  'proton.me',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'gmx.com',
  'gmx.net',
  'inbox.com',
  'fastmail.com',
  
  // Temporary/disposable
  'tempmail.com',
  'guerrillamail.com',
  'mailinator.com',
  '10minutemail.com',
  
  // Regional providers
  'rediffmail.com',
  'mail.ru',
  'qq.com',
  '163.com',
  '126.com',
]

/**
 * Check if an email domain is a public domain
 */
export function isPublicDomain(email: string): boolean {
  const domain = extractDomain(email)
  if (!domain) return true // Treat invalid emails as public
  
  return PUBLIC_EMAIL_DOMAINS.includes(domain.toLowerCase())
}

/**
 * Extract domain from email address
 */
export function extractDomain(email: string): string | null {
  const parts = email.split('@')
  if (parts.length !== 2) return null
  return parts[1].toLowerCase()
}

/**
 * Generate a random verification code
 */
export function generateVerificationCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 32; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Get the verification TXT record value
 */
export function getVerificationTxtRecord(code: string): string {
  return `managerbook-verify=${code}`
}

/**
 * Format domain for display
 */
export function formatDomain(domain: string): string {
  return domain.toLowerCase().replace(/^www\./, '')
}

/**
 * Validate domain format
 */
export function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/
  return domainRegex.test(domain)
}

/**
 * Get common admin email addresses for a domain
 */
export function getAdminEmails(domain: string): string[] {
  return [
    `admin@${domain}`,
    `administrator@${domain}`,
    `postmaster@${domain}`,
    `hostmaster@${domain}`,
    `webmaster@${domain}`,
  ]
}

