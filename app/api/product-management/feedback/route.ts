import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { z } from 'zod'

const createFeedbackSchema = z.object({
  type: z.enum(['FEATURE_REQUEST', 'BUG_REPORT', 'IMPROVEMENT', 'GENERAL']),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  projectId: z.string().optional(),
  releaseId: z.string().optional(),
  category: z.string().optional(),
  userEmail: z.string().email().optional(),
  satisfaction: z.number().int().min(1).max(10).optional(),
})

// GET - List feedback and feature requests
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'projects', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const type = searchParams.get('type')
        const status = searchParams.get('status')
        const priority = searchParams.get('priority')

        // TODO: Create Feedback model in database
        // For now, return placeholder structure that can be extended
        // This would integrate with:
        // - Feedback collection forms
        // - User satisfaction surveys
        // - Feature request tracking
        // - Bug reports

        const feedback: any[] = []

        // Calculate statistics
        const stats = {
          total: feedback.length,
          featureRequests: feedback.filter((f) => f.type === 'FEATURE_REQUEST').length,
          bugReports: feedback.filter((f) => f.type === 'BUG_REPORT').length,
          improvements: feedback.filter((f) => f.type === 'IMPROVEMENT').length,
          highPriority: feedback.filter((f) => f.priority === 'HIGH' || f.priority === 'CRITICAL').length,
          avgSatisfaction:
            feedback.length > 0
              ? Math.round(
                  feedback.reduce((sum, f) => sum + (f.satisfaction || 5), 0) / feedback.length
                )
              : 0,
        }

        return NextResponse.json({
          feedback,
          stats,
        })
      } catch (error) {
        console.error('Error fetching feedback:', error)
        return NextResponse.json(
          { error: 'Failed to fetch feedback' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Create feedback or feature request
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'projects', action: 'READ' },
    async (request, userInfo) => {
      try {
        const body = await req.json()
        const validatedData = createFeedbackSchema.parse(body)

        // TODO: Save to Feedback model when created
        // For now, return success with placeholder structure

        const feedback = {
          id: `feedback-${Date.now()}`,
          ...validatedData,
          status: 'NEW',
          createdAt: new Date().toISOString(),
          tenantId: userInfo.tenantId,
        }

        return NextResponse.json(
          {
            feedback,
            message: 'Feedback submitted successfully',
          },
          { status: 201 }
        )
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid request data', details: error.errors },
            { status: 400 }
          )
        }

        console.error('Error creating feedback:', error)
        return NextResponse.json(
          { error: 'Failed to create feedback' },
          { status: 500 }
        )
      }
    }
  )
}

