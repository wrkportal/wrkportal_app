import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types'
import { generateVerificationCode, getVerificationTxtRecord, isPublicDomain } from '@/lib/domain-utils'
import { resolveTxt } from 'dns/promises'

// POST /api/tenant/verify/initiate - Start domain verification process
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only TENANT_SUPER_ADMIN can initiate verification
    if (session.user.role !== UserRole.TENANT_SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Only tenant super admins can verify domains' },
        { status: 403 }
      )
    }

    // Get user's tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    if (tenant.domainVerified) {
      return NextResponse.json(
        { error: 'Domain is already verified' },
        { status: 400 }
      )
    }

    if (!tenant.domain) {
      return NextResponse.json(
        { error: 'No domain associated with this tenant' },
        { status: 400 }
      )
    }

    // Check if domain is public
    const testEmail = `test@${tenant.domain}`
    if (isPublicDomain(testEmail)) {
      return NextResponse.json(
        { error: 'Cannot verify public email domains (Gmail, Yahoo, etc.)' },
        { status: 400 }
      )
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update tenant with new verification code
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        verificationCode,
        codeExpiresAt: expiresAt,
      },
    })

    const txtRecord = getVerificationTxtRecord(verificationCode)

    return NextResponse.json({
      domain: tenant.domain,
      verificationCode,
      txtRecord,
      expiresAt,
      instructions: {
        type: 'TXT',
        host: '@',
        value: txtRecord,
        ttl: '3600',
      },
    })
  } catch (error) {
    console.error('Error initiating domain verification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

