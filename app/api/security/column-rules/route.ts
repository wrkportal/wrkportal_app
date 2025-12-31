/**
 * Phase 4.2: Column-Level Security Rules API
 * 
 * CRUD operations for column security rules
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { UserRole, ColumnSecurityAction, MaskingType } from '@prisma/client'

const createColumnRuleSchema = z.object({
  resource: z.string(),
  column: z.string(),
  userId: z.string().optional().nullable(),
  orgUnitId: z.string().optional().nullable(),
  role: z.nativeEnum(UserRole).optional().nullable(),
  action: z.nativeEnum(ColumnSecurityAction),
  maskingType: z.nativeEnum(MaskingType).optional().nullable(),
  maskingConfig: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  inheritance: z.boolean().default(true),
})

// GET /api/security/column-rules - List column security rules
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'permissions', action: 'READ' },
    async (req, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const resource = searchParams.get('resource')
        const column = searchParams.get('column')
        const userId = searchParams.get('userId')
        const orgUnitId = searchParams.get('orgUnitId')
        const role = searchParams.get('role') as UserRole | null

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (resource) where.resource = resource
        if (column) where.column = column
        if (userId) where.userId = userId
        if (orgUnitId) where.orgUnitId = orgUnitId
        if (role) where.role = role

        const rules = await prisma.columnLevelSecurityRule.findMany({
          where,
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
          orderBy: {
            createdAt: 'desc',
          },
        })

        return NextResponse.json({ rules })
      } catch (error: any) {
        console.error('Error fetching column security rules:', error)
        return NextResponse.json(
          { error: 'Failed to fetch column security rules', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/security/column-rules - Create column security rule
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'permissions', action: 'CREATE' },
    async (req, userInfo) => {
      try {
        const body = await request.json()
        const data = createColumnRuleSchema.parse(body)

        // Validate that only one of userId, orgUnitId, or role is set
        const targets = [data.userId, data.orgUnitId, data.role].filter(Boolean)
        if (targets.length > 1) {
          return NextResponse.json(
            { error: 'Must specify at most one of: userId, orgUnitId, or role' },
            { status: 400 }
          )
        }

        // Check for existing rule
        const existing = await prisma.columnLevelSecurityRule.findFirst({
          where: {
            tenantId: userInfo.tenantId,
            resource: data.resource,
            column: data.column,
            userId: data.userId || null,
            orgUnitId: data.orgUnitId || null,
            role: data.role || null,
          },
        })

        if (existing) {
          return NextResponse.json(
            { error: 'Column security rule already exists' },
            { status: 409 }
          )
        }

        const rule = await prisma.columnLevelSecurityRule.create({
          data: {
            tenantId: userInfo.tenantId,
            resource: data.resource,
            column: data.column,
            userId: data.userId || null,
            orgUnitId: data.orgUnitId || null,
            role: data.role || null,
            action: data.action,
            maskingType: data.maskingType || null,
            maskingConfig: data.maskingConfig || null,
            isActive: data.isActive,
            inheritance: data.inheritance,
            createdById: userInfo.userId,
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
          },
        })

        return NextResponse.json({ rule }, { status: 201 })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating column security rule:', error)
        return NextResponse.json(
          { error: 'Failed to create column security rule', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

