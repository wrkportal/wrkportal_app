/**
 * Phase 4: Organization-Level Permissions API
 * 
 * CRUD operations for organization-level permissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck, getUserForPermissionCheck } from '@/lib/permissions/permission-middleware'
import { UserRole } from '@prisma/client'

const createPermissionSchema = z.object({
  orgUnitId: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  role: z.nativeEnum(UserRole).optional().nullable(),
  resource: z.string(),
  actions: z.array(z.string()),
  conditions: z.record(z.any()).optional(),
  inheritance: z.boolean().default(true),
  expiresAt: z.string().datetime().optional().nullable(),
})

// GET /api/permissions/organization - List permissions
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
        const resource = searchParams.get('resource')

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (orgUnitId) where.orgUnitId = orgUnitId
        if (userId) where.userId = userId
        if (role) where.role = role
        if (resource) where.resource = resource

        const permissions = await prisma.organizationPermission.findMany({
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
        console.error('Error fetching permissions:', error)
        return NextResponse.json(
          { error: 'Failed to fetch permissions', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/permissions/organization - Create permission
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'permissions', action: 'CREATE' },
    async (req, userInfo) => {
      try {
        const body = await request.json()
        const data = createPermissionSchema.parse(body)

        // Validate that only one of orgUnitId, userId, or role is set (not multiple)
        const targets = [data.orgUnitId, data.userId, data.role].filter(Boolean)
        if (targets.length !== 1) {
          return NextResponse.json(
            { error: 'Must specify exactly one of: orgUnitId, userId, or role' },
            { status: 400 }
          )
        }

        // Check for existing permission
        const existing = await prisma.organizationPermission.findFirst({
          where: {
            tenantId: userInfo.tenantId,
            orgUnitId: data.orgUnitId || null,
            userId: data.userId || null,
            role: data.role || null,
            resource: data.resource,
          },
        })

        if (existing) {
          return NextResponse.json(
            { error: 'Permission already exists' },
            { status: 409 }
          )
        }

        const permission = await prisma.organizationPermission.create({
          data: {
            tenantId: userInfo.tenantId,
            orgUnitId: data.orgUnitId || null,
            userId: data.userId || null,
            role: data.role || null,
            resource: data.resource,
            actions: data.actions,
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
        console.error('Error creating permission:', error)
        return NextResponse.json(
          { error: 'Failed to create permission', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

