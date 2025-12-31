/**
 * Phase 4.2: RLS Rule Management (Individual)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { RuleAppliesTo } from '@prisma/client'

const updateRLSRuleSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  ruleExpression: z.record(z.any()).optional(),
  priority: z.number().optional(),
  isActive: z.boolean().optional(),
  appliesTo: z.array(z.nativeEnum(RuleAppliesTo)).optional(),
  inheritance: z.boolean().optional(),
})

// GET /api/security/rls-rules/[id] - Get RLS rule
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'permissions', action: 'READ' },
    async (req, userInfo) => {
      try {
        const rule = await prisma.rowLevelSecurityRule.findFirst({
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
            { error: 'RLS rule not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({ rule })
      } catch (error: any) {
        console.error('Error fetching RLS rule:', error)
        return NextResponse.json(
          { error: 'Failed to fetch RLS rule', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// PATCH /api/security/rls-rules/[id] - Update RLS rule
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
        const data = updateRLSRuleSchema.parse(body)

        const existing = await prisma.rowLevelSecurityRule.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!existing) {
          return NextResponse.json(
            { error: 'RLS rule not found' },
            { status: 404 }
          )
        }

        const updateData: any = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.description !== undefined) updateData.description = data.description
        if (data.ruleExpression !== undefined) updateData.ruleExpression = data.ruleExpression
        if (data.priority !== undefined) updateData.priority = data.priority
        if (data.isActive !== undefined) updateData.isActive = data.isActive
        if (data.appliesTo !== undefined) updateData.appliesTo = data.appliesTo
        if (data.inheritance !== undefined) updateData.inheritance = data.inheritance

        const rule = await prisma.rowLevelSecurityRule.update({
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
        console.error('Error updating RLS rule:', error)
        return NextResponse.json(
          { error: 'Failed to update RLS rule', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// DELETE /api/security/rls-rules/[id] - Delete RLS rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'permissions', action: 'DELETE' },
    async (req, userInfo) => {
      try {
        const existing = await prisma.rowLevelSecurityRule.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!existing) {
          return NextResponse.json(
            { error: 'RLS rule not found' },
            { status: 404 }
          )
        }

        await prisma.rowLevelSecurityRule.delete({
          where: { id: params.id },
        })

        return NextResponse.json({ success: true })
      } catch (error: any) {
        console.error('Error deleting RLS rule:', error)
        return NextResponse.json(
          { error: 'Failed to delete RLS rule', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

