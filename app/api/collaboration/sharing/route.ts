/**
 * Phase 4.3: Resource Sharing API
 * 
 * Share resources with users, org units, roles, or via links
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { UserRole, SharePermission, ShareAccessType } from '@prisma/client'
import { createActivityFeed } from '@/lib/collaboration/activity-feed'
import { randomBytes } from 'crypto'

const createShareSchema = z.object({
  resourceType: z.string(),
  resourceId: z.string(),
  sharedWithId: z.string().optional().nullable(),
  orgUnitId: z.string().optional().nullable(),
  role: z.nativeEnum(UserRole).optional().nullable(),
  permission: z.nativeEnum(SharePermission).default(SharePermission.VIEW),
  accessType: z.nativeEnum(ShareAccessType),
  expiresAt: z.string().datetime().optional().nullable(),
})

// GET /api/collaboration/sharing - Get shares for a resource or user
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'collaboration', action: 'READ' },
    async (req, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const resourceType = searchParams.get('resourceType')
        const resourceId = searchParams.get('resourceId')
        const sharedWithMe = searchParams.get('sharedWithMe') === 'true'

        const where: any = {
          tenantId: userInfo.tenantId,
          isActive: true,
        }

        if (resourceType && resourceId) {
          where.resourceType = resourceType
          where.resourceId = resourceId
        }

        if (sharedWithMe) {
          // Get resources shared with current user
          where.OR = [
            { sharedWithId: userInfo.userId },
            { orgUnitId: userInfo.orgUnitId },
            { role: userInfo.role },
            { accessType: ShareAccessType.PUBLIC_LINK },
            { accessType: ShareAccessType.PRIVATE_LINK },
          ]
        }

        const shares = await prisma.resourceShare.findMany({
          where,
          include: {
            sharedBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            sharedWith: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            orgUnit: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        // Filter out expired shares
        const now = new Date()
        const activeShares = shares.filter(share => 
          !share.expiresAt || share.expiresAt > now
        )

        return NextResponse.json({ shares: activeShares })
      } catch (error: any) {
        console.error('Error fetching shares:', error)
        return NextResponse.json(
          { error: 'Failed to fetch shares', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/collaboration/sharing - Share a resource
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'collaboration', action: 'CREATE' },
    async (req, userInfo) => {
      try {
        const body = await request.json()
        const data = createShareSchema.parse(body)

        // Validate that access type matches the provided fields
        if (data.accessType === ShareAccessType.SPECIFIC_USER && !data.sharedWithId) {
          return NextResponse.json(
            { error: 'sharedWithId is required for SPECIFIC_USER access type' },
            { status: 400 }
          )
        }

        if (data.accessType === ShareAccessType.ORG_UNIT && !data.orgUnitId) {
          return NextResponse.json(
            { error: 'orgUnitId is required for ORG_UNIT access type' },
            { status: 400 }
          )
        }

        if (data.accessType === ShareAccessType.ROLE && !data.role) {
          return NextResponse.json(
            { error: 'role is required for ROLE access type' },
            { status: 400 }
          )
        }

        // Generate share token for link-based sharing
        let shareToken: string | null = null
        if (data.accessType === ShareAccessType.PUBLIC_LINK || data.accessType === ShareAccessType.PRIVATE_LINK) {
          shareToken = randomBytes(32).toString('hex')
        }

        // Check for existing share
        const existing = await prisma.resourceShare.findFirst({
          where: {
            tenantId: userInfo.tenantId,
            resourceType: data.resourceType,
            resourceId: data.resourceId,
            sharedWithId: data.sharedWithId || null,
            orgUnitId: data.orgUnitId || null,
            role: data.role || null,
          },
        })

        if (existing) {
          // Update existing share
          const share = await prisma.resourceShare.update({
            where: { id: existing.id },
            data: {
              permission: data.permission,
              accessType: data.accessType,
              shareToken: shareToken || existing.shareToken,
              expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
              isActive: true,
            },
            include: {
              sharedBy: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
              sharedWith: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          })

          return NextResponse.json({ share })
        }

        // Create new share
        const share = await prisma.resourceShare.create({
          data: {
            tenantId: userInfo.tenantId,
            resourceType: data.resourceType,
            resourceId: data.resourceId,
            sharedById: userInfo.userId,
            sharedWithId: data.sharedWithId || null,
            orgUnitId: data.orgUnitId || null,
            role: data.role || null,
            permission: data.permission,
            accessType: data.accessType,
            shareToken,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          },
          include: {
            sharedBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            sharedWith: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        })

        // Create activity feed entry
        await createActivityFeed({
          tenantId: userInfo.tenantId,
          userId: userInfo.userId,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          action: 'SHARED',
          description: `${userInfo.userId} shared ${data.resourceType} ${data.resourceId}`,
        })

        return NextResponse.json({ share }, { status: 201 })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating share:', error)
        return NextResponse.json(
          { error: 'Failed to create share', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

