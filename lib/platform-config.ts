/**
 * Platform Configuration
 * Contains platform-level settings and constants
 */

/**
 * Platform Owner Email
 * This user has god-mode access to all tenants and platform settings
 */
export const PLATFORM_OWNER_EMAIL = 'sandeep200680@gmail.com'

/**
 * Check if an email belongs to the platform owner
 */
export function isPlatformOwner(email: string | undefined | null): boolean {
  if (!email) return false
  return email.toLowerCase() === PLATFORM_OWNER_EMAIL.toLowerCase()
}

/**
 * Platform Owner Configuration
 */
export const PLATFORM_CONFIG = {
  ownerEmail: PLATFORM_OWNER_EMAIL,
  platformName: 'ManagerBook',
  supportEmail: 'support@managerbook.com',
  maxTenantsPerPlatform: -1, // -1 = unlimited
  defaultTenantPlan: 'free',
}

