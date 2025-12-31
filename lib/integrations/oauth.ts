/**
 * Phase 5: OAuth Flow Infrastructure
 * 
 * Handles OAuth 2.0 flows for SaaS integrations
 */

import { prisma } from '@/lib/prisma'
import { IntegrationType } from '@prisma/client'
import crypto from 'crypto'

export interface OAuthConfig {
  clientId: string
  clientSecret: string
  authUrl: string
  tokenUrl: string
  scope: string
  redirectUri: string
}

export interface OAuthTokenData {
  accessToken: string
  refreshToken?: string
  tokenType?: string
  expiresIn?: number
  scope?: string
}

// OAuth configurations for different integrations
const OAUTH_CONFIGS: Record<IntegrationType, Partial<OAuthConfig>> = {
  SALESFORCE: {
    authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    scope: 'api refresh_token offline_access',
  },
  HUBSPOT: {
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    scope: 'contacts deals companies',
  },
  QUICKBOOKS: {
    authUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    scope: 'com.intuit.quickbooks.accounting',
  },
  STRIPE: {
    authUrl: 'https://connect.stripe.com/oauth/authorize',
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    scope: 'read_write',
  },
  GOOGLE_ANALYTICS: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
  },
  ZENDESK: {
    authUrl: 'https://{subdomain}.zendesk.com/oauth/authorizations/new',
    tokenUrl: 'https://{subdomain}.zendesk.com/oauth/tokens',
    scope: 'read write',
  },
  JIRA: {
    authUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    scope: 'read:jira-work write:jira-work',
  },
  MAILCHIMP: {
    authUrl: 'https://login.mailchimp.com/oauth2/authorize',
    tokenUrl: 'https://login.mailchimp.com/oauth2/token',
    scope: 'audience_read audience_write',
  },
  SLACK: {
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scope: 'channels:read channels:write chat:write',
  },
  MICROSOFT_TEAMS: {
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scope: 'offline_access https://graph.microsoft.com/.default',
  },
  SHOPIFY: {
    authUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
    tokenUrl: 'https://{shop}.myshopify.com/admin/oauth/access_token',
    scope: 'read_orders read_products',
  },
  CUSTOM: {},
}

/**
 * Generate OAuth authorization URL
 */
export function generateAuthUrl(
  integrationType: IntegrationType,
  config: OAuthConfig,
  state?: string
): string {
  const baseConfig = OAUTH_CONFIGS[integrationType] || {}
  const authUrl = config.authUrl || baseConfig.authUrl || ''
  const scope = config.scope || baseConfig.scope || ''

  if (!authUrl) {
    throw new Error(`No OAuth configuration found for ${integrationType}`)
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: scope,
    state: state || generateState(),
  })

  // Handle special cases
  if (integrationType === IntegrationType.STRIPE) {
    params.append('response_type', 'code')
  }

  return `${authUrl}?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  integrationType: IntegrationType,
  config: OAuthConfig,
  code: string
): Promise<OAuthTokenData> {
  const baseConfig = OAUTH_CONFIGS[integrationType] || {}
  const tokenUrl = config.tokenUrl || baseConfig.tokenUrl || ''

  if (!tokenUrl) {
    throw new Error(`No token URL found for ${integrationType}`)
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  })

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }

  const data = await response.json()

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenType: data.token_type || 'Bearer',
    expiresIn: data.expires_in,
    scope: data.scope,
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  integrationType: IntegrationType,
  config: OAuthConfig,
  refreshToken: string
): Promise<OAuthTokenData> {
  const baseConfig = OAUTH_CONFIGS[integrationType] || {}
  const tokenUrl = config.tokenUrl || baseConfig.tokenUrl || ''

  if (!tokenUrl) {
    throw new Error(`No token URL found for ${integrationType}`)
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  })

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token refresh failed: ${error}`)
  }

  const data = await response.json()

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken, // Some services don't return new refresh token
    tokenType: data.token_type || 'Bearer',
    expiresIn: data.expires_in,
    scope: data.scope,
  }
}

/**
 * Store OAuth token in database
 */
export async function storeOAuthToken(
  integrationId: string,
  tenantId: string,
  tokenData: OAuthTokenData
): Promise<void> {
  const expiresAt = tokenData.expiresIn
    ? new Date(Date.now() + tokenData.expiresIn * 1000)
    : null

  // In production, encrypt tokens before storing
  await prisma.oAuthToken.upsert({
    where: {
      integrationId,
    },
    create: {
      integrationId,
      tenantId,
      accessToken: tokenData.accessToken, // Should be encrypted
      refreshToken: tokenData.refreshToken || null,
      tokenType: tokenData.tokenType || 'Bearer',
      expiresAt,
      scope: tokenData.scope || null,
    },
    update: {
      accessToken: tokenData.accessToken, // Should be encrypted
      refreshToken: tokenData.refreshToken || undefined,
      tokenType: tokenData.tokenType || 'Bearer',
      expiresAt,
      scope: tokenData.scope || null,
    },
  })
}

/**
 * Get valid OAuth token (refresh if needed)
 */
export async function getValidToken(
  integrationId: string
): Promise<string | null> {
  const token = await prisma.oAuthToken.findUnique({
    where: { integrationId },
    include: {
      integration: {
        select: {
          type: true,
          configuration: true,
        },
      },
    },
  })

  if (!token) {
    return null
  }

  // Check if token is expired or expiring soon (within 5 minutes)
  const now = new Date()
  const expiresAt = token.expiresAt
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

  if (expiresAt && expiresAt < fiveMinutesFromNow) {
    // Token expired or expiring soon, try to refresh
    if (token.refreshToken) {
      try {
        const config = token.integration.configuration as any
        const refreshed = await refreshAccessToken(
          token.integration.type,
          {
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            authUrl: '',
            tokenUrl: '',
            scope: '',
            redirectUri: config.redirectUri,
          },
          token.refreshToken
        )

        await storeOAuthToken(integrationId, token.tenantId, refreshed)
        return refreshed.accessToken
      } catch (error) {
        console.error('Failed to refresh token:', error)
        return null
      }
    }
    return null
  }

  return token.accessToken
}

/**
 * Generate random state for OAuth flow
 */
function generateState(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Verify OAuth state
 */
export function verifyState(state: string, storedState: string): boolean {
  return state === storedState
}

