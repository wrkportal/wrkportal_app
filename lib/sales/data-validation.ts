/**
 * Data Validation Service
 * 
 * Validates and cleans sales data in real-time
 */

export interface ValidationRule {
  field: string
  type: 'required' | 'email' | 'phone' | 'url' | 'number' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
  value?: any
  message: string
  customValidator?: (value: any) => boolean
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  cleanedData?: Record<string, any>
}

export interface ValidationError {
  field: string
  message: string
  value?: any
}

export interface ValidationWarning {
  field: string
  message: string
  value?: any
}

/**
 * Validate lead data
 */
export function validateLead(data: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const cleanedData: Record<string, any> = { ...data }

  // Required fields
  if (!data.email) {
    errors.push({
      field: 'email',
      message: 'Email is required',
    })
  }

  if (!data.firstName) {
    errors.push({
      field: 'firstName',
      message: 'First name is required',
    })
  }

  if (!data.lastName) {
    errors.push({
      field: 'lastName',
      message: 'Last name is required',
    })
  }

  // Email validation
  if (data.email && !isValidEmail(data.email)) {
    errors.push({
      field: 'email',
      message: 'Invalid email format',
      value: data.email,
    })
  } else if (data.email) {
    // Clean email (trim, lowercase)
    cleanedData.email = data.email.trim().toLowerCase()
  }

  // Phone validation
  if (data.phone && !isValidPhone(data.phone)) {
    warnings.push({
      field: 'phone',
      message: 'Phone number format may be invalid',
      value: data.phone,
    })
  } else if (data.phone) {
    // Clean phone (remove non-digit characters except +)
    cleanedData.phone = cleanPhoneNumber(data.phone)
  }

  if (data.mobile && !isValidPhone(data.mobile)) {
    warnings.push({
      field: 'mobile',
      message: 'Mobile number format may be invalid',
      value: data.mobile,
    })
  } else if (data.mobile) {
    cleanedData.mobile = cleanPhoneNumber(data.mobile)
  }

  // Name validation
  if (data.firstName) {
    cleanedData.firstName = cleanName(data.firstName)
  }

  if (data.lastName) {
    cleanedData.lastName = cleanName(data.lastName)
  }

  // Company validation
  if (data.company) {
    cleanedData.company = data.company.trim()
    if (cleanedData.company.length < 2) {
      warnings.push({
        field: 'company',
        message: 'Company name seems too short',
        value: data.company,
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    cleanedData: errors.length === 0 ? cleanedData : undefined,
  }
}

/**
 * Validate contact data
 */
export function validateContact(data: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const cleanedData: Record<string, any> = { ...data }

  // Email validation (at least one email required)
  if (!data.email && !data.personalEmail) {
    errors.push({
      field: 'email',
      message: 'At least one email (work or personal) is required',
    })
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.push({
      field: 'email',
      message: 'Invalid work email format',
      value: data.email,
    })
  } else if (data.email) {
    cleanedData.email = data.email.trim().toLowerCase()
  }

  if (data.personalEmail && !isValidEmail(data.personalEmail)) {
    errors.push({
      field: 'personalEmail',
      message: 'Invalid personal email format',
      value: data.personalEmail,
    })
  } else if (data.personalEmail) {
    cleanedData.personalEmail = data.personalEmail.trim().toLowerCase()
  }

  // Name validation
  if (data.firstName) {
    cleanedData.firstName = cleanName(data.firstName)
  } else {
    errors.push({
      field: 'firstName',
      message: 'First name is required',
    })
  }

  if (data.lastName) {
    cleanedData.lastName = cleanName(data.lastName)
  } else {
    errors.push({
      field: 'lastName',
      message: 'Last name is required',
    })
  }

  // Phone validation
  if (data.phone) {
    cleanedData.phone = cleanPhoneNumber(data.phone)
    if (!isValidPhone(cleanedData.phone)) {
      warnings.push({
        field: 'phone',
        message: 'Phone number format may be invalid',
        value: data.phone,
      })
    }
  }

  // LinkedIn URL validation
  if (data.linkedInUrl && !isValidUrl(data.linkedInUrl)) {
    warnings.push({
      field: 'linkedInUrl',
      message: 'LinkedIn URL format may be invalid',
      value: data.linkedInUrl,
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    cleanedData: errors.length === 0 ? cleanedData : undefined,
  }
}

/**
 * Validate account data
 */
export function validateAccount(data: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const cleanedData: Record<string, any> = { ...data }

  // Name required
  if (!data.name) {
    errors.push({
      field: 'name',
      message: 'Account name is required',
    })
  } else {
    cleanedData.name = data.name.trim()
    if (cleanedData.name.length < 2) {
      errors.push({
        field: 'name',
        message: 'Account name is too short',
        value: data.name,
      })
    }
  }

  // Website validation
  if (data.website && !isValidUrl(data.website)) {
    warnings.push({
      field: 'website',
      message: 'Website URL format may be invalid',
      value: data.website,
    })
  } else if (data.website) {
    // Normalize website URL
    cleanedData.website = normalizeUrl(data.website)
  }

  // Industry validation
  if (data.industry && data.industry.trim().length < 2) {
    warnings.push({
      field: 'industry',
      message: 'Industry name seems too short',
      value: data.industry,
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    cleanedData: errors.length === 0 ? cleanedData : undefined,
  }
}

/**
 * Email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Phone validation (basic)
 */
function isValidPhone(phone: string): boolean {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  // Should have 10-15 digits (allowing country codes)
  return /^\+?[\d]{10,15}$/.test(cleaned)
}

/**
 * URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    // Add protocol if missing
    const urlWithProtocol = url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `https://${url}`
    new URL(urlWithProtocol)
    return true
  } catch {
    return false
  }
}

/**
 * Clean phone number
 */
function cleanPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  return cleaned
}

/**
 * Clean name (trim, capitalize first letter)
 */
function cleanName(name: string): string {
  return name.trim().split(' ').map(word => {
    if (word.length === 0) return ''
    return word[0].toUpperCase() + word.slice(1).toLowerCase()
  }).join(' ')
}

/**
 * Normalize URL
 */
function normalizeUrl(url: string): string {
  let normalized = url.trim().toLowerCase()
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`
  }
  return normalized
}

