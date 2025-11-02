import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET - Load current SSO configuration
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only TENANT_SUPER_ADMIN and ORG_ADMIN can access SSO settings
        if (session.user.role !== 'TENANT_SUPER_ADMIN' && session.user.role !== 'ORG_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Get tenant's SSO configuration
        const tenant = await prisma.tenant.findUnique({
            where: { id: session.user.tenantId },
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
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        return NextResponse.json({
            tenantId: tenant.id,
            tenantName: tenant.name,
            domain: tenant.domain,
            ssoEnabled: tenant.ssoEnabled,
            ssoProvider: tenant.ssoProvider,
            ssoConfig: tenant.ssoConfig,
        })
    } catch (error) {
        console.error('Error loading SSO configuration:', error)
        return NextResponse.json(
            { error: 'Failed to load SSO configuration' },
            { status: 500 }
        )
    }
}

// PUT - Update SSO configuration
export async function PUT(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only TENANT_SUPER_ADMIN and ORG_ADMIN can update SSO settings
        if (session.user.role !== 'TENANT_SUPER_ADMIN' && session.user.role !== 'ORG_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { ssoEnabled, ssoProvider, domain, ssoConfig } = body

        // Validation
        if (ssoEnabled && !ssoProvider) {
            return NextResponse.json(
                { error: 'SSO provider is required when SSO is enabled' },
                { status: 400 }
            )
        }

        if (ssoEnabled && !domain) {
            return NextResponse.json(
                { error: 'Organization domain is required when SSO is enabled' },
                { status: 400 }
            )
        }

        // Validate provider-specific configuration
        if (ssoEnabled && ssoConfig) {
            if (ssoProvider === 'SAML') {
                if (!ssoConfig.entryPoint || !ssoConfig.issuer || !ssoConfig.cert) {
                    return NextResponse.json(
                        { error: 'SAML configuration is incomplete' },
                        { status: 400 }
                    )
                }
            } else if (ssoProvider === 'OIDC') {
                if (!ssoConfig.issuer || !ssoConfig.authorizationURL || !ssoConfig.tokenURL || !ssoConfig.clientId || !ssoConfig.clientSecret) {
                    return NextResponse.json(
                        { error: 'OIDC configuration is incomplete' },
                        { status: 400 }
                    )
                }
            } else if (ssoProvider === 'AZURE_AD') {
                if (!ssoConfig.tenantId || !ssoConfig.clientId || !ssoConfig.clientSecret) {
                    return NextResponse.json(
                        { error: 'Azure AD configuration is incomplete' },
                        { status: 400 }
                    )
                }
            }
        }

        // Update tenant SSO configuration
        const updatedTenant = await prisma.tenant.update({
            where: { id: session.user.tenantId },
            data: {
                ssoEnabled,
                ssoProvider: ssoEnabled ? ssoProvider : null,
                domain,
                ssoConfig: ssoEnabled ? ssoConfig : null,
            },
            select: {
                id: true,
                name: true,
                domain: true,
                ssoEnabled: true,
                ssoProvider: true,
            },
        })

        // Log the configuration change
        console.log(`SSO configuration updated for tenant ${updatedTenant.id} by user ${session.user.id}`)

        return NextResponse.json({
            success: true,
            message: 'SSO configuration updated successfully',
            tenant: updatedTenant,
        })
    } catch (error) {
        console.error('Error updating SSO configuration:', error)
        return NextResponse.json(
            { error: 'Failed to update SSO configuration' },
            { status: 500 }
        )
    }
}

