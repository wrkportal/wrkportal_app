import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types'
import { getVerificationTxtRecord } from '@/lib/domain-utils'
import { resolveTxt } from 'dns/promises'

// POST /api/tenant/verify/check - Verify DNS records and complete verification
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
        { 
          success: true,
          message: 'Domain is already verified',
          alreadyVerified: true,
        }
      )
    }

    if (!tenant.domain || !tenant.verificationCode) {
      return NextResponse.json(
        { error: 'No verification in progress' },
        { status: 400 }
      )
    }

    // Check if verification code has expired
    if (tenant.codeExpiresAt && tenant.codeExpiresAt < new Date()) {
      return NextResponse.json(
        { 
          error: 'Verification code has expired. Please request a new one.',
          expired: true,
        },
        { status: 400 }
      )
    }

    const expectedTxtRecord = getVerificationTxtRecord(tenant.verificationCode)

    try {
      // Query DNS TXT records
      console.log(`Checking DNS TXT records for domain: ${tenant.domain}`)
      const txtRecords = await resolveTxt(tenant.domain)
      
      // Flatten the array (DNS returns array of arrays)
      const allRecords = txtRecords.flat()
      console.log('Found TXT records:', allRecords)

      // Check if our verification code exists
      const verified = allRecords.some(record => 
        record === expectedTxtRecord || record.includes(expectedTxtRecord)
      )

      if (verified) {
        // SUCCESS! Mark tenant as verified
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            domainVerified: true,
            verifiedAt: new Date(),
            verifiedById: session.user.id,
            verificationMethod: 'DNS',
            autoJoinEnabled: true, // Enable auto-join by default after verification
          },
        })

        // Upgrade user to TENANT_SUPER_ADMIN if not already
        if (session.user.role !== UserRole.TENANT_SUPER_ADMIN) {
          await prisma.user.update({
            where: { id: session.user.id },
            data: { role: UserRole.TENANT_SUPER_ADMIN },
          })
        }

        return NextResponse.json({
          success: true,
          message: 'Domain verified successfully!',
          domain: tenant.domain,
          verifiedAt: new Date(),
        })
      } else {
        return NextResponse.json(
          { 
            success: false,
            error: 'Verification code not found in DNS records. Please wait 5-15 minutes for DNS propagation and try again.',
            expectedRecord: expectedTxtRecord,
            foundRecords: allRecords,
          },
          { status: 400 }
        )
      }
    } catch (dnsError: any) {
      console.error('DNS lookup error:', dnsError)
      
      // Handle specific DNS errors
      if (dnsError.code === 'ENOTFOUND') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Domain not found. Please check that the domain is correctly configured.',
          },
          { status: 400 }
        )
      } else if (dnsError.code === 'ENODATA') {
        return NextResponse.json(
          { 
            success: false,
            error: 'No TXT records found for this domain. Please add the verification record and wait for DNS propagation (5-15 minutes).',
          },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { 
            success: false,
            error: `DNS lookup failed: ${dnsError.message}. Please try again later.`,
          },
          { status: 400 }
        )
      }
    }
  } catch (error) {
    console.error('Error verifying domain:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

