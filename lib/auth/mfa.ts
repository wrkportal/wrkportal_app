/**
 * Multi-Factor Authentication (MFA) Service
 * 
 * TOTP-based 2FA implementation
 */

import { prisma } from '@/lib/prisma'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

// Configure authenticator
authenticator.options = {
  step: 30, // 30-second time steps
  window: 1, // Allow 1 time step tolerance
}

/**
 * Generate a secret for a user
 */
export async function generateMFASecret(userId: string): Promise<{
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Generate secret
  const secret = authenticator.generateSecret()
  
  // Create service name and account name for QR code
  const serviceName = 'WorkPortal'
  const accountName = user.email

  // Generate QR code URL
  const otpAuthUrl = authenticator.keyuri(accountName, serviceName, secret)
  const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl)

  // Generate backup codes (8 codes, 8 characters each)
  const backupCodes = generateBackupCodes(8)

  // Store secret temporarily (not enabled yet)
  const settings = (user.workflowSettings as any) || {}
  await prisma.user.update({
    where: { id: userId },
    data: {
      workflowSettings: {
        ...settings,
        mfa: {
          secret,
          backupCodes: backupCodes.map(code => hashBackupCode(code)),
          enabled: false,
        },
      },
    },
  })

  return {
    secret,
    qrCodeUrl,
    backupCodes,
  }
}

/**
 * Verify TOTP token
 */
export async function verifyMFAToken(
  userId: string,
  token: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { workflowSettings: true },
  })

  if (!user) {
    return false
  }

  const settings = (user.workflowSettings as any) || {}
  const mfa = settings.mfa

  if (!mfa || !mfa.enabled || !mfa.secret) {
    return false
  }

  // Verify TOTP token
  const isValid = authenticator.verify({
    token,
    secret: mfa.secret,
  })

  // If TOTP fails, check backup codes
  if (!isValid && mfa.backupCodes && Array.isArray(mfa.backupCodes)) {
    const hashedToken = hashBackupCode(token)
    const backupCodeIndex = mfa.backupCodes.findIndex(
      (hashed: string) => hashed === hashedToken
    )

    if (backupCodeIndex !== -1) {
      // Remove used backup code
      mfa.backupCodes.splice(backupCodeIndex, 1)
      await prisma.user.update({
        where: { id: userId },
        data: {
          workflowSettings: {
            ...settings,
            mfa: {
              ...mfa,
              backupCodes: mfa.backupCodes,
            },
          },
        },
      })
      return true
    }
  }

  return isValid
}

/**
 * Enable MFA for a user
 */
export async function enableMFA(userId: string, token: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { workflowSettings: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const settings = (user.workflowSettings as any) || {}
  const mfa = settings.mfa

  if (!mfa || !mfa.secret) {
    throw new Error('MFA secret not found. Please generate a new secret first.')
  }

  // Verify token before enabling
  const isValid = authenticator.verify({
    token,
    secret: mfa.secret,
  })

  if (!isValid) {
    return false
  }

  // Enable MFA
  await prisma.user.update({
    where: { id: userId },
    data: {
      workflowSettings: {
        ...settings,
        mfa: {
          ...mfa,
          enabled: true,
        },
      },
    },
  })

  return true
}

/**
 * Disable MFA for a user
 */
export async function disableMFA(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { workflowSettings: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const settings = (user.workflowSettings as any) || {}
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      workflowSettings: {
        ...settings,
        mfa: {
          enabled: false,
        },
      },
    },
  })
}

/**
 * Check if MFA is enabled for a user
 */
export async function isMFAEnabled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { workflowSettings: true },
  })

  if (!user) {
    return false
  }

  const settings = (user.workflowSettings as any) || {}
  return settings.mfa?.enabled === true
}

/**
 * Get MFA status
 */
export async function getMFAStatus(userId: string): Promise<{
  enabled: boolean
  hasSecret: boolean
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { workflowSettings: true },
  })

  if (!user) {
    return { enabled: false, hasSecret: false }
  }

  const settings = (user.workflowSettings as any) || {}
  const mfa = settings.mfa || {}

  return {
    enabled: mfa.enabled === true,
    hasSecret: !!mfa.secret,
  }
}

/**
 * Generate backup codes
 */
function generateBackupCodes(count: number): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    codes.push(code)
  }
  return codes
}

/**
 * Hash backup code for storage
 */
function hashBackupCode(code: string): string {
  // Simple hash for backup codes (in production, use proper hashing)
  // For now, we'll use a simple approach
  return Buffer.from(code).toString('base64')
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { workflowSettings: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const settings = (user.workflowSettings as any) || {}
  const mfa = settings.mfa

  if (!mfa || !mfa.enabled) {
    throw new Error('MFA must be enabled to regenerate backup codes')
  }

  const backupCodes = generateBackupCodes(8)

  await prisma.user.update({
    where: { id: userId },
    data: {
      workflowSettings: {
        ...settings,
        mfa: {
          ...mfa,
          backupCodes: backupCodes.map(code => hashBackupCode(code)),
        },
      },
    },
  })

  return backupCodes
}

