/**
 * Phase 5: OAuth Flow for Integrations
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { generateAuthUrl, exchangeCodeForToken, storeOAuthToken, getValidToken } from '@/lib/integrations/oauth'
import { IntegrationType } from '@prisma/client'

// GET /api/integrations/[id]/oauth/auth-url - Get OAuth authorization URL
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'integrations', action: 'UPDATE' },
    async (req, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const action = searchParams.get('action') // 'auth-url' or 'callback'

        const integration = await prisma.integration.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!integration) {
          return NextResponse.json(
            { error: 'Integration not found' },
            { status: 404 }
          )
        }

        if (action === 'callback') {
          // Handle OAuth callback
          const code = searchParams.get('code')
          const state = searchParams.get('state')
          const error = searchParams.get('error')

          if (error) {
            return NextResponse.json(
              { error: `OAuth error: ${error}` },
              { status: 400 }
            )
          }

          if (!code) {
            return NextResponse.json(
              { error: 'Authorization code not provided' },
              { status: 400 }
            )
          }

          const config = integration.configuration as any
          const tokenData = await exchangeCodeForToken(
            integration.type,
            {
              clientId: config.clientId,
              clientSecret: config.clientSecret,
              authUrl: '',
              tokenUrl: '',
              scope: config.scope || '',
              redirectUri: config.redirectUri,
            },
            code
          )

          await storeOAuthToken(params.id, userInfo.tenantId, tokenData)

          // Update integration status
          await prisma.integration.update({
            where: { id: params.id },
            data: {
              status: 'ACTIVE',
              isActive: true,
            },
          })

          return NextResponse.json({ success: true, message: 'Integration connected successfully' })
        }

        // Generate auth URL
        const config = integration.configuration as any
        if (!config.clientId || !config.clientSecret || !config.redirectUri) {
          return NextResponse.json(
            { error: 'Integration configuration incomplete. Please configure OAuth settings.' },
            { status: 400 }
          )
        }

        const authUrl = generateAuthUrl(
          integration.type,
          {
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            authUrl: config.authUrl || '',
            tokenUrl: config.tokenUrl || '',
            scope: config.scope || '',
            redirectUri: config.redirectUri,
          }
        )

        return NextResponse.json({ authUrl })
      } catch (error: any) {
        console.error('Error in OAuth flow:', error)
        return NextResponse.json(
          { error: 'OAuth flow failed', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

