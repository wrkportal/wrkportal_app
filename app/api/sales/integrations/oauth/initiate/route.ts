/**
 * OAuth Initiation API
 * 
 * Initiates OAuth flow for integrations
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { provider, integrationId } = body

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      )
    }

    // Generate state for OAuth security
    const state = crypto.randomBytes(32).toString('hex')
    
    // Store state in session or database (simplified - use Redis in production)
    // For now, we'll include tenantId in state
    const stateData = {
      state,
      provider,
      tenantId: session.user.tenantId,
      userId: session.user.id,
      integrationId,
      timestamp: Date.now(),
    }

    // Build OAuth URL based on provider
    const oauthUrl = buildOAuthUrl(provider, state, session.user.tenantId)

    // In production, store stateData in Redis or database with expiration
    // For now, we'll return it in the response (not secure, but functional)

    return NextResponse.json({
      authUrl: oauthUrl,
      state,
    })
  } catch (error: any) {
    console.error('Error initiating OAuth:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}

function buildOAuthUrl(provider: string, state: string, tenantId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUri = `${baseUrl}/api/sales/integrations/oauth/callback`

  const providerConfigs: Record<string, any> = {
    salesforce: {
      baseUrl: 'https://login.salesforce.com/services/oauth2/authorize',
      clientId: process.env.SALESFORCE_CLIENT_ID,
      scopes: 'api refresh_token offline_access',
    },
    hubspot: {
      baseUrl: 'https://app.hubspot.com/oauth/authorize',
      clientId: process.env.HUBSPOT_CLIENT_ID,
      scopes: 'contacts deals',
    },
    dynamics: {
      baseUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      clientId: process.env.DYNAMICS_CLIENT_ID,
      scopes: 'https://graph.microsoft.com/.default offline_access',
      responseType: 'code',
    },
    zoom: {
      baseUrl: 'https://zoom.us/oauth/authorize',
      clientId: process.env.ZOOM_CLIENT_ID,
      scopes: 'meeting:write meeting:read',
    },
    webex: {
      baseUrl: 'https://webexapis.com/v1/authorize',
      clientId: process.env.WEBEX_CLIENT_ID,
      scopes: 'spark:all',
    },
  }

  const config = providerConfigs[provider.toLowerCase()]
  if (!config) {
    throw new Error(`OAuth not supported for provider: ${provider}`)
  }

  if (!config.clientId) {
    throw new Error(`OAuth client ID not configured for ${provider}`)
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: config.responseType || 'code',
    scope: config.scopes,
    state: `${state}:${tenantId}`, // Include tenantId in state for verification
  })

  return `${config.baseUrl}?${params.toString()}`
}

