/**
 * OAuth Callback API
 * 
 * Handles OAuth callback from external providers
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { IntegrationManager } from '@/lib/integrations/integration-manager'
import { prisma } from '@/lib/prisma'

const getSalesIntegration = () => (prisma as any).salesIntegration

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      // OAuth error occurred
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sales-dashboard/integrations?error=${encodeURIComponent(error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sales-dashboard/integrations?error=missing_parameters`
      )
    }

    // Extract state and tenantId
    const [stateToken, tenantId] = state.split(':')
    
    // Exchange code for access token
    const provider = await getProviderFromState(stateToken)
    if (!provider) {
      throw new Error('Invalid OAuth state')
    }

    const tokenData = await exchangeCodeForToken(provider, code, tenantId)

    // Get or create integration
    const session = await auth()
    const userId = session?.user?.id || 'system'

    // Check if integration already exists
    const salesIntegration = getSalesIntegration()
    if (!salesIntegration) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sales-dashboard/integrations?error=integrations_unavailable`
      )
    }

    let integration = await (salesIntegration as any).findFirst({
      where: {
        tenantId,
        provider: provider.toLowerCase(),
        status: 'CONNECTED',
      },
    })

    const credentials = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      ...(tokenData.instance_url && { instanceUrl: tokenData.instance_url }),
      ...(tokenData.apiUrl && { apiUrl: tokenData.apiUrl }),
    }

    if (integration) {
      // Update existing integration
      const { encryptCredentials } = require('@/lib/integrations/credential-encryption')
      await (salesIntegration as any).update({
        where: { id: integration.id },
        data: {
          credentials: encryptCredentials(credentials) as any,
          status: 'CONNECTED',
          errorMessage: null,
        },
      })
    } else {
      // Create new integration
      integration = await (salesIntegration as any).create({
        data: {
          tenantId,
          provider: provider.toLowerCase(),
          type: getIntegrationType(provider),
          name: `${provider} Integration`,
          credentials: (await import('@/lib/integrations/credential-encryption')).encryptCredentials(credentials) as any,
          status: 'CONNECTED',
          settings: {},
          createdById: userId,
        },
      })
    }

    // Test connection
    const instance = IntegrationManager.createIntegrationInstance(integration as any)
    await instance.testConnection()

    // Redirect to integrations page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sales-dashboard/integrations?success=true&integrationId=${integration.id}`
    )
  } catch (error: any) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sales-dashboard/integrations?error=${encodeURIComponent(error.message)}`
    )
  }
}

async function getProviderFromState(state: string): Promise<string | null> {
  // In production, retrieve from Redis/database
  // For now, we'll extract from state (not secure, but functional)
  // This should be stored server-side
  return null // Placeholder - implement proper state storage
}

async function exchangeCodeForToken(
  provider: string,
  code: string,
  tenantId: string
): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUri = `${baseUrl}/api/sales/integrations/oauth/callback`

  const providerConfigs: Record<string, any> = {
    salesforce: {
      tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
      clientId: process.env.SALESFORCE_CLIENT_ID,
      clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
    },
    hubspot: {
      tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
      clientId: process.env.HUBSPOT_CLIENT_ID,
      clientSecret: process.env.HUBSPOT_CLIENT_SECRET,
    },
    dynamics: {
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      clientId: process.env.DYNAMICS_CLIENT_ID,
      clientSecret: process.env.DYNAMICS_CLIENT_SECRET,
    },
    zoom: {
      tokenUrl: 'https://zoom.us/oauth/token',
      clientId: process.env.ZOOM_CLIENT_ID,
      clientSecret: process.env.ZOOM_CLIENT_SECRET,
    },
    webex: {
      tokenUrl: 'https://webexapis.com/v1/access_token',
      clientId: process.env.WEBEX_CLIENT_ID,
      clientSecret: process.env.WEBEX_CLIENT_SECRET,
    },
  }

  const config = providerConfigs[provider.toLowerCase()]
  if (!config) {
    throw new Error(`OAuth not supported for provider: ${provider}`)
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: config.clientId!,
    client_secret: config.clientSecret!,
  })

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }

  return await response.json()
}

function getIntegrationType(provider: string): string {
  const typeMap: Record<string, string> = {
    salesforce: 'CRM',
    hubspot: 'CRM',
    dynamics: 'CRM',
    zoom: 'COMMUNICATION',
    webex: 'COMMUNICATION',
  }
  return typeMap[provider.toLowerCase()] || 'OTHER'
}

