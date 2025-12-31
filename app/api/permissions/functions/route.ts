/**
 * Phase 4: Function-Level Permissions API
 * 
 * CRUD operations for function-level permissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { UserRole } from '@prisma/client'

const createFunctionPermissionSchema = z.object({
  orgUnitId: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  role: z.nativeEnum(UserRole).optional().nullable(),
  function: z.string(),
  allowed: z.boolean().default(true),
  conditions: z.record(z.any()).optional(),
  inheritance: z.boolean().default(true),
  expiresAt: z.string().datetime().optional().nullable(),
})

// GET /api/permissions/functions - List function permissions
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'permissions', action: 'READ' },
    async (req, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const orgUnitId = searchParams.get('orgUnitId')
        const userId = searchParams.get('userId')
        const role = searchParams.get('role') as UserRole | null
        const func = searchParams.get('function')

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (orgUnitId) where.orgUnitId = orgUnitId
        if (userId) where.userId = userId
        if (role) where.role = role
        if (func) where.function = func

        const permissions = await prisma.functionPermission.findMany({
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

        return NextResponse.json({ permissions })
      } catch (error: any) {
        console.error('Error fetching function permissions:', error)
        return NextResponse.json(
          { error: 'Failed to fetch function permissions', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/permissions/functions - Create function permission
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'permissions', action: 'CREATE' },
    async (req, userInfo) => {
      try {
        const body = await request.json()
        const data = createFunctionPermissionSchema.parse(body)

        // Validate that only one of orgUnitId, userId, or role is set
        const targets = [data.orgUnitId, data.userId, data.role].filter(Boolean)
        if (targets.length !== 1) {
          return NextResponse.json(
            { error: 'Must specify exactly one of: orgUnitId, userId, or role' },
            { status: 400 }
          )
        }

        // Check for existing permission
        const existing = await prisma.functionPermission.findFirst({
          where: {
            tenantId: userInfo.tenantId,
            orgUnitId: data.orgUnitId || null,
            userId: data.userId || null,
            role: data.role || null,
            function: data.function,
          },
        })

        if (existing) {
          return NextResponse.json(
            { error: 'Function permission already exists' },
            { status: 409 }
          )
        }

        const permission = await prisma.functionPermission.create({
          data: {
            tenantId: userInfo.tenantId,
            orgUnitId: data.orgUnitId || null,
            userId: data.userId || null,
            role: data.role || null,
            function: data.function,
            allowed: data.allowed,
            conditions: data.conditions || null,
            inheritance: data.inheritance,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
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

        return NextResponse.json({ permission }, { status: 201 })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating function permission:', error)
        return NextResponse.json(
          { error: 'Failed to create function permission', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

