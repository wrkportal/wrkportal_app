import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST - Test SSO connection
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only TENANT_SUPER_ADMIN and ORG_ADMIN can test SSO
        if (session.user.role !== 'TENANT_SUPER_ADMIN' && session.user.role !== 'ORG_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Get tenant's SSO configuration
        const tenant = await prisma.tenant.findUnique({
            where: { id: session.user.tenantId },
            select: {
                ssoEnabled: true,
                ssoProvider: true,
                ssoConfig: true,
            },
        })

        if (!tenant || !tenant.ssoEnabled) {
            return NextResponse.json(
                { error: 'SSO is not enabled for this organization' },
                { status: 400 }
            )
        }

        if (!tenant.ssoProvider || !tenant.ssoConfig) {
            return NextResponse.json(
                { error: 'SSO configuration is incomplete' },
                { status: 400 }
            )
        }

        // Perform basic validation based on provider
        const config = tenant.ssoConfig as any

        if (tenant.ssoProvider === 'SAML') {
            // Validate SAML configuration
            if (!config.entryPoint || !config.issuer || !config.cert) {
                return NextResponse.json(
                    { error: 'SAML configuration is missing required fields' },
                    { status: 400 }
                )
            }

            // Validate certificate format
            if (!config.cert.includes('BEGIN CERTIFICATE') || !config.cert.includes('END CERTIFICATE')) {
                return NextResponse.json(
                    { error: 'Invalid X.509 certificate format' },
                    { status: 400 }
                )
            }

            // Validate URLs
            try {
                new URL(config.entryPoint)
                new URL(config.issuer)
            } catch (e) {
                return NextResponse.json(
                    { error: 'Invalid URL in SAML configuration' },
                    { status: 400 }
                )
            }

            return NextResponse.json({
                success: true,
                message: 'SAML configuration appears valid. To fully test, attempt a login via SSO.',
                provider: 'SAML',
                entryPoint: config.entryPoint,
            })
        } else if (tenant.ssoProvider === 'OIDC') {
            // Validate OIDC configuration
            if (!config.issuer || !config.authorizationURL || !config.tokenURL || !config.clientId || !config.clientSecret) {
                return NextResponse.json(
                    { error: 'OIDC configuration is missing required fields' },
                    { status: 400 }
                )
            }

            // Validate URLs
            try {
                new URL(config.issuer)
                new URL(config.authorizationURL)
                new URL(config.tokenURL)
            } catch (e) {
                return NextResponse.json(
                    { error: 'Invalid URL in OIDC configuration' },
                    { status: 400 }
                )
            }

            // Optional: Try to fetch OIDC discovery document
            try {
                const discoveryUrl = config.issuer.endsWith('/') 
                    ? `${config.issuer}.well-known/openid-configuration`
                    : `${config.issuer}/.well-known/openid-configuration`
                
                const response = await fetch(discoveryUrl, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                })

                if (response.ok) {
                    return NextResponse.json({
                        success: true,
                        message: 'OIDC configuration is valid and discovery document was retrieved successfully.',
                        provider: 'OIDC',
                        issuer: config.issuer,
                    })
                } else {
                    return NextResponse.json({
                        success: true,
                        message: 'OIDC configuration appears valid, but discovery document could not be retrieved. This may be normal for some providers.',
                        provider: 'OIDC',
                        issuer: config.issuer,
                    })
                }
            } catch (e) {
                return NextResponse.json({
                    success: true,
                    message: 'OIDC configuration appears valid. To fully test, attempt a login via SSO.',
                    provider: 'OIDC',
                    issuer: config.issuer,
                })
            }
        } else if (tenant.ssoProvider === 'AZURE_AD') {
            // Validate Azure AD configuration
            if (!config.tenantId || !config.clientId || !config.clientSecret) {
                return NextResponse.json(
                    { error: 'Azure AD configuration is missing required fields' },
                    { status: 400 }
                )
            }

            // Validate tenant ID format (UUID)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            if (!uuidRegex.test(config.tenantId)) {
                return NextResponse.json(
                    { error: 'Invalid Azure AD Tenant ID format' },
                    { status: 400 }
                )
            }

            // Optional: Try to validate Azure AD tenant exists
            try {
                const metadataUrl = `https://login.microsoftonline.com/${config.tenantId}/v2.0/.well-known/openid-configuration`
                const response = await fetch(metadataUrl)

                if (response.ok) {
                    return NextResponse.json({
                        success: true,
                        message: 'Azure AD configuration is valid and tenant was verified.',
                        provider: 'AZURE_AD',
                        tenantId: config.tenantId,
                    })
                } else {
                    return NextResponse.json(
                        { error: 'Azure AD tenant could not be verified. Please check your Tenant ID.' },
                        { status: 400 }
                    )
                }
            } catch (e) {
                return NextResponse.json(
                    { error: 'Failed to verify Azure AD tenant. Please check your configuration.' },
                    { status: 400 }
                )
            }
        } else {
            return NextResponse.json(
                { error: `SSO provider ${tenant.ssoProvider} is not yet supported for testing` },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('Error testing SSO configuration:', error)
        return NextResponse.json(
            { error: 'Failed to test SSO configuration' },
            { status: 500 }
        )
    }
}

