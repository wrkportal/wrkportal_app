/**
 * Phase 5: Integrations API
 * 
 * CRUD operations for SaaS integrations
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { IntegrationType, IntegrationStatus } from '@prisma/client'

const createIntegrationSchema = z.object({
  type: z.nativeEnum(IntegrationType),
  name: z.string(),
  description: z.string().optional(),
  configuration: z.record(z.any()),
  isActive: z.boolean().default(false),
})

// GET /api/integrations - List integrations
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'integrations', action: 'READ' },
    async (req, userInfo) => {
      try {
        // Check if Integration model exists
        if (!prisma.integration) {
          return NextResponse.json({ integrations: [] })
        }

        console.log('Fetching integrations for tenantId:', userInfo.tenantId)

        const integrations = await prisma.integration.findMany({
          where: {
            tenantId: userInfo.tenantId,
          },
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            oauthTokens: {
              select: {
                id: true,
                expiresAt: true,
              },
            },
            _count: {
              select: {
                syncJobs: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        console.log(`Found ${integrations.length} integration(s) for tenant ${userInfo.tenantId}`)
        if (integrations.length > 0) {
          console.log('Integrations:', integrations.map(i => ({ id: i.id, name: i.name, type: i.type })))
        }

        return NextResponse.json({ integrations })
      } catch (error: any) {
        // Handle case where table doesn't exist
        if (error.code === 'P2001' || error.message?.includes('does not exist') || error.message?.includes('Unknown model')) {
          console.warn('Integration table not found, returning empty array')
          return NextResponse.json({ integrations: [] })
        }
        console.error('Error fetching integrations:', error)
        return NextResponse.json(
          { error: 'Failed to fetch integrations', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/integrations - Create integration
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'integrations', action: 'CREATE' },
    async (req, userInfo) => {
      try {
        const body = await request.json()
        const data = createIntegrationSchema.parse(body)

        // Check if integration of this type already exists
        const existing = await prisma.integration.findUnique({
          where: {
            tenantId_type: {
              tenantId: userInfo.tenantId,
              type: data.type,
            },
          },
        })

        if (existing) {
          return NextResponse.json(
            { error: `Integration of type ${data.type} already exists` },
            { status: 409 }
          )
        }

        const integration = await prisma.integration.create({
          data: {
            tenantId: userInfo.tenantId,
            type: data.type,
            name: data.name,
            description: data.description,
            configuration: data.configuration,
            isActive: data.isActive,
            status: data.isActive ? IntegrationStatus.INACTIVE : IntegrationStatus.INACTIVE,
            createdById: userInfo.userId,
          },
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        })

        return NextResponse.json({ integration }, { status: 201 })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating integration:', error)
        return NextResponse.json(
          { error: 'Failed to create integration', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

