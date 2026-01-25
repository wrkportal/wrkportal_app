/**
 * Input Validation and Sanitization Utilities
 * Prevents XSS, SQL injection, and other injection attacks
 */

import { z } from 'zod'

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  // Remove HTML tags
  const withoutTags = input.replace(/<[^>]*>/g, '')

  // Escape special characters
  return withoutTags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize object by sanitizing all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = { ...obj }

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key])
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key])
    }
  }

  return sanitized as T
}

/**
 * Validate and sanitize email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate URL
 */
export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Sanitize SQL string to prevent SQL injection
 * Note: Always use parameterized queries instead, but this provides extra safety
 */
export function sanitizeSqlString(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  // Remove SQL injection patterns
  return input
    .replace(/['";]/g, '') // Remove quotes and semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comments
    .replace(/\*\//g, '') // Remove block comments
    .replace(/xp_/gi, '') // Remove xp_ (extended procedures)
    .replace(/sp_/gi, '') // Remove sp_ (stored procedures)
    .replace(/exec/gi, '') // Remove exec
    .replace(/execute/gi, '') // Remove execute
    .replace(/union/gi, '') // Remove union
    .replace(/select/gi, '') // Remove select
    .replace(/insert/gi, '') // Remove insert
    .replace(/update/gi, '') // Remove update
    .replace(/delete/gi, '') // Remove delete
    .replace(/drop/gi, '') // Remove drop
    .replace(/create/gi, '') // Remove create
    .replace(/alter/gi, '') // Remove alter
    .trim()
}

/**
 * Validate file name to prevent path traversal
 */
export function validateFileName(fileName: string): boolean {
  // Reject path traversal attempts
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return false
  }

  // Reject control characters
  if (/[\x00-\x1F\x7F]/.test(fileName)) {
    return false
  }

  // Validate length
  if (fileName.length > 255) {
    return false
  }

  return true
}

/**
 * Common validation schemas
 */
export const validationSchemas = {
  email: z.string().email('Invalid email address'),
  url: z.string().url('Invalid URL'),
  uuid: z.string().uuid('Invalid UUID'),
  date: z.string().datetime('Invalid date format'),
  positiveInteger: z.number().int().positive('Must be a positive integer'),
  nonEmptyString: z.string().min(1, 'String cannot be empty'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
}

/**
 * Validate input against schema
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = schema.parse(input)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(', '),
      }
    }
    return { success: false, error: 'Validation failed' }
  }
}

