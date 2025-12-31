/**
 * Phase 4: Function Permission Management (Individual)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const updateFunctionPermissionSchema = z.object({
  allowed: z.boolean().optional(),
  conditions: z.record(z.any()).optional(),
  inheritance: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
})

// GET /api/permissions/functions/[id] - Get function permission
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'permissions', action: 'READ' },
    async (req, userInfo) => {
      try {
        const permission = await prisma.functionPermission.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
          include: {
            orgUnit: {
              select: {
                id: true,
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        })

        if (!permission) {
          return NextResponse.json(
            { error: 'Function permission not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({ permission })
      } catch (error: any) {
        console.error('Error fetching function permission:', error)
        return NextResponse.json(
          { error: 'Failed to fetch function permission', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// PATCH /api/permissions/functions/[id] - Update function permission
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'permissions', action: 'UPDATE' },
    async (req, userInfo) => {
      try {
        const body = await request.json()
        const data = updateFunctionPermissionSchema.parse(body)

        const existing = await prisma.functionPermission.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!existing) {
          return NextResponse.json(
            { error: 'Function permission not found' },
            { status: 404 }
          )
        }

        const updateData: any = {}
        if (data.allowed !== undefined) updateData.allowed = data.allowed
        if (data.conditions !== undefined) updateData.conditions = data.conditions
        if (data.inheritance !== undefined) updateData.inheritance = data.inheritance
        if (data.expiresAt !== undefined) {
          updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null
        }

        const permission = await prisma.functionPermission.update({
          where: { id: params.id },
          data: updateData,
          include: {
            orgUnit: {
              select: {
                id: true,
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        })

        return NextResponse.json({ permission })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error updating function permission:', error)
        return NextResponse.json(
          { error: 'Failed to update function permission', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// DELETE /api/permissions/functions/[id] - Delete function permission
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'permissions', action: 'DELETE' },
    async (req, userInfo) => {
      try {
        const existing = await prisma.functionPermission.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!existing) {
          return NextResponse.json(
            { error: 'Function permission not found' },
            { status: 404 }
          )
        }

        await prisma.functionPermission.delete({
          where: { id: params.id },
        })

        return NextResponse.json({ success: true })
      } catch (error: any) {
        console.error('Error deleting function permission:', error)
        return NextResponse.json(
          { error: 'Failed to delete function permission', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

