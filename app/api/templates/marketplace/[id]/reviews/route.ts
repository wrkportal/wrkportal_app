/**
 * Phase 5.5: Template Marketplace API - Reviews
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

// POST /api/templates/marketplace/[id]/reviews - Create review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'templates', action: 'UPDATE' },
    async (req, userInfo) => {
      try {
        const resolvedParams = 'then' in params ? await params : params
        const body = await req.json()
        const data = createReviewSchema.parse(body)

        if (!prisma.templateReview) {
          return NextResponse.json(
            { error: 'TemplateReview model not available' },
            { status: 500 }
          )
        }

        // Check if template exists and is public
        const template = await prisma.reportingReportTemplate.findUnique({
          where: { id: resolvedParams.id },
        })

        if (!template || !template.isPublic) {
          return NextResponse.json(
            { error: 'Template not found' },
            { status: 404 }
          )
        }

        // Create or update review
        const review = await prisma.templateReview.upsert({
          where: {
            templateId_userId: {
              templateId: resolvedParams.id,
              userId: userInfo.userId,
            },
          },
          create: {
            templateId: resolvedParams.id,
            userId: userInfo.userId,
            rating: data.rating,
            comment: data.comment,
            isVerified: data.isVerified,
          },
          update: {
            rating: data.rating,
            comment: data.comment,
            isVerified: data.isVerified,
          },
          include: {
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

        // Recalculate template rating
        const reviews = await prisma.templateReview.findMany({
          where: { templateId: resolvedParams.id },
          select: { rating: true },
        })

        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

        await prisma.reportingReportTemplate.update({
          where: { id: resolvedParams.id },
          data: {
            rating: avgRating,
            reviewCount: reviews.length,
          },
        })

        return NextResponse.json({ review }, { status: 201 })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating review:', error)
        return NextResponse.json(
          { error: 'Failed to create review', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

