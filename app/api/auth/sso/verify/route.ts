import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const { identifier } = await request.json()

        if (!identifier) {
            return NextResponse.json(
                { error: 'Organization domain or ID is required' },
                { status: 400 }
            )
        }

        // Try to find the tenant by domain or by ID
        const tenant = await prisma.tenant.findFirst({
            where: {
                OR: [
                    { domain: identifier.toLowerCase() },
                    { id: identifier },
                    { name: { contains: identifier, mode: 'insensitive' } },
                ],
                // Only allow SSO if it's enabled for the tenant
                ssoEnabled: true,
            },
            select: {
                id: true,
                name: true,
                domain: true,
                ssoEnabled: true,
                ssoProvider: true,
                ssoConfig: true,
            },
        })

        if (!tenant) {
            return NextResponse.json(
                { error: 'Organization not found or SSO is not configured' },
                { status: 404 }
            )
        }

        if (!tenant.ssoEnabled || !tenant.ssoProvider) {
            return NextResponse.json(
                { error: 'SSO is not enabled for this organization' },
                { status: 403 }
            )
        }

        // Return the SSO configuration (without sensitive data)
        return NextResponse.json({
            tenantId: tenant.id,
            tenantName: tenant.name,
            domain: tenant.domain,
            ssoProvider: tenant.ssoProvider,
            // Don't send the full config to the client for security
        })
    } catch (error) {
        console.error('SSO verification error:', error)
        return NextResponse.json(
            { error: 'An error occurred during SSO verification' },
            { status: 500 }
        )
    }
}

