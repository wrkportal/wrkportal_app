/**
 * Phase 5: Integration Management (Individual)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { IntegrationStatus } from '@prisma/client'

const updateIntegrationSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  configuration: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
  status: z.nativeEnum(IntegrationStatus).optional(),
})

// GET /api/integrations/[id] - Get integration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'integrations', action: 'READ' },
    async (req, userInfo) => {
      try {
        const integration = await prisma.integration.findFirst({
          where: {
            id: params.id,
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
                tokenType: true,
              },
            },
            syncJobs: {
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
            _count: {
              select: {
                syncJobs: true,
                syncLogs: true,
              },
            },
          },
        })

        if (!integration) {
          return NextResponse.json(
            { error: 'Integration not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({ integration })
      } catch (error: any) {
        console.error('Error fetching integration:', error)
        return NextResponse.json(
          { error: 'Failed to fetch integration', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// PATCH /api/integrations/[id] - Update integration
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'integrations', action: 'UPDATE' },
    async (req, userInfo) => {
      try {
        const body = await request.json()
        const data = updateIntegrationSchema.parse(body)

        const existing = await prisma.integration.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!existing) {
          return NextResponse.json(
            { error: 'Integration not found' },
            { status: 404 }
          )
        }

        const updateData: any = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.description !== undefined) updateData.description = data.description
        if (data.configuration !== undefined) updateData.configuration = data.configuration
        if (data.isActive !== undefined) updateData.isActive = data.isActive
        if (data.status !== undefined) updateData.status = data.status

        const integration = await prisma.integration.update({
          where: { id: params.id },
          data: updateData,
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        })

        return NextResponse.json({ integration })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error updating integration:', error)
        return NextResponse.json(
          { error: 'Failed to update integration', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// DELETE /api/integrations/[id] - Delete integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'integrations', action: 'DELETE' },
    async (req, userInfo) => {
      try {
        const existing = await prisma.integration.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!existing) {
          return NextResponse.json(
            { error: 'Integration not found' },
            { status: 404 }
          )
        }

        await prisma.integration.delete({
          where: { id: params.id },
        })

        return NextResponse.json({ success: true })
      } catch (error: any) {
        console.error('Error deleting integration:', error)
        return NextResponse.json(
          { error: 'Failed to delete integration', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

