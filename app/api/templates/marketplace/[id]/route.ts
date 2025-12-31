/**
 * Phase 5.5: Template Marketplace API - Template Details
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { z } from 'zod'

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  isVerified: z.boolean().default(false),
})

// GET /api/templates/marketplace/[id] - Get template details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'templates', action: 'READ' },
    async (req, userInfo) => {
      try {
        const resolvedParams = 'then' in params ? await params : params
        
        if (!prisma.reportingReportTemplate) {
          return NextResponse.json(
            { error: 'Template model not available' },
            { status: 500 }
          )
        }

        const template = await prisma.reportingReportTemplate.findUnique({
          where: { id: resolvedParams.id },
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            reviews: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
                _count: {
                  select: {
                    helpfulVotes: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 50,
            },
            _count: {
              select: {
                reviews: true,
                installations: true,
              },
            },
          },
        })

        if (!template || (!template.isPublic && template.tenantId !== userInfo.tenantId)) {
          return NextResponse.json(
            { error: 'Template not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({ template })
      } catch (error: any) {
        console.error('Error fetching template:', error)
        return NextResponse.json(
          { error: 'Failed to fetch template', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/templates/marketplace/[id]/install - Install template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'templates', action: 'CREATE' },
    async (req, userInfo) => {
      try {
        const resolvedParams = 'then' in params ? await params : params
        
        if (!prisma.reportingReportTemplate || !prisma.templateInstall) {
          return NextResponse.json(
            { error: 'Template model not available' },
            { status: 500 }
          )
        }

        // Get template
        const template = await prisma.reportingReportTemplate.findUnique({
          where: { id: resolvedParams.id },
        })

        if (!template || !template.isPublic) {
          return NextResponse.json(
            { error: 'Template not found or not available' },
            { status: 404 }
          )
        }

        // Check if already installed
        const existing = await prisma.templateInstall.findFirst({
          where: {
            templateId: resolvedParams.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (existing) {
          return NextResponse.json(
            { error: 'Template already installed', install: existing },
            { status: 400 }
          )
        }

        // Create installation record
        const install = await prisma.templateInstall.create({
          data: {
            templateId: resolvedParams.id,
            tenantId: userInfo.tenantId,
            installedById: userInfo.userId,
          },
        })

        // Update usage count
        await prisma.reportingReportTemplate.update({
          where: { id: resolvedParams.id },
          data: {
            usageCount: { increment: 1 },
          },
        })

        return NextResponse.json({ install }, { status: 201 })
      } catch (error: any) {
        console.error('Error installing template:', error)
        return NextResponse.json(
          { error: 'Failed to install template', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

