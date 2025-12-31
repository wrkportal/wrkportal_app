/**
 * Phase 4.2: Column Security Rule Management (Individual)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { ColumnSecurityAction, MaskingType } from '@prisma/client'

const updateColumnRuleSchema = z.object({
  action: z.nativeEnum(ColumnSecurityAction).optional(),
  maskingType: z.nativeEnum(MaskingType).optional().nullable(),
  maskingConfig: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
  inheritance: z.boolean().optional(),
})

// GET /api/security/column-rules/[id] - Get column security rule
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'permissions', action: 'READ' },
    async (req, userInfo) => {
      try {
        const rule = await prisma.columnLevelSecurityRule.findFirst({
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

        if (!rule) {
          return NextResponse.json(
            { error: 'Column security rule not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({ rule })
      } catch (error: any) {
        console.error('Error fetching column security rule:', error)
        return NextResponse.json(
          { error: 'Failed to fetch column security rule', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// PATCH /api/security/column-rules/[id] - Update column security rule
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
        const data = updateColumnRuleSchema.parse(body)

        const existing = await prisma.columnLevelSecurityRule.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!existing) {
          return NextResponse.json(
            { error: 'Column security rule not found' },
            { status: 404 }
          )
        }

        const updateData: any = {}
        if (data.action !== undefined) updateData.action = data.action
        if (data.maskingType !== undefined) updateData.maskingType = data.maskingType
        if (data.maskingConfig !== undefined) updateData.maskingConfig = data.maskingConfig
        if (data.isActive !== undefined) updateData.isActive = data.isActive
        if (data.inheritance !== undefined) updateData.inheritance = data.inheritance

        const rule = await prisma.columnLevelSecurityRule.update({
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

        return NextResponse.json({ rule })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error updating column security rule:', error)
        return NextResponse.json(
          { error: 'Failed to update column security rule', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// DELETE /api/security/column-rules/[id] - Delete column security rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'permissions', action: 'DELETE' },
    async (req, userInfo) => {
      try {
        const existing = await prisma.columnLevelSecurityRule.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!existing) {
          return NextResponse.json(
            { error: 'Column security rule not found' },
            { status: 404 }
          )
        }

        await prisma.columnLevelSecurityRule.delete({
          where: { id: params.id },
        })

        return NextResponse.json({ success: true })
      } catch (error: any) {
        console.error('Error deleting column security rule:', error)
        return NextResponse.json(
          { error: 'Failed to delete column security rule', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

