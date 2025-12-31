/**
 * Phase 4.2: Row-Level Security Rules API
 * 
 * CRUD operations for RLS rules
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { UserRole, RuleAppliesTo } from '@prisma/client'

const createRLSRuleSchema = z.object({
  resource: z.string(),
  name: z.string(),
  description: z.string().optional(),
  userId: z.string().optional().nullable(),
  orgUnitId: z.string().optional().nullable(),
  role: z.nativeEnum(UserRole).optional().nullable(),
  ruleExpression: z.record(z.any()),
  priority: z.number().default(0),
  isActive: z.boolean().default(true),
  appliesTo: z.array(z.nativeEnum(RuleAppliesTo)),
  inheritance: z.boolean().default(true),
})

// GET /api/security/rls-rules - List RLS rules
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'permissions', action: 'READ' },
    async (req, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const resource = searchParams.get('resource')
        const userId = searchParams.get('userId')
        const orgUnitId = searchParams.get('orgUnitId')
        const role = searchParams.get('role') as UserRole | null

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (resource) where.resource = resource
        if (userId) where.userId = userId
        if (orgUnitId) where.orgUnitId = orgUnitId
        if (role) where.role = role

        const rules = await prisma.rowLevelSecurityRule.findMany({
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
          orderBy: [
            { priority: 'asc' },
            { createdAt: 'desc' },
          ],
        })

        return NextResponse.json({ rules })
      } catch (error: any) {
        console.error('Error fetching RLS rules:', error)
        return NextResponse.json(
          { error: 'Failed to fetch RLS rules', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/security/rls-rules - Create RLS rule
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'permissions', action: 'CREATE' },
    async (req, userInfo) => {
      try {
        const body = await request.json()
        const data = createRLSRuleSchema.parse(body)

        // Validate that only one of userId, orgUnitId, or role is set
        const targets = [data.userId, data.orgUnitId, data.role].filter(Boolean)
        if (targets.length > 1) {
          return NextResponse.json(
            { error: 'Must specify at most one of: userId, orgUnitId, or role' },
            { status: 400 }
          )
        }

        const rule = await prisma.rowLevelSecurityRule.create({
          data: {
            tenantId: userInfo.tenantId,
            resource: data.resource,
            name: data.name,
            description: data.description,
            userId: data.userId || null,
            orgUnitId: data.orgUnitId || null,
            role: data.role || null,
            ruleExpression: data.ruleExpression,
            priority: data.priority,
            isActive: data.isActive,
            appliesTo: data.appliesTo,
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
        console.error('Error creating RLS rule:', error)
        return NextResponse.json(
          { error: 'Failed to create RLS rule', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

