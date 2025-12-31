/**
 * Feedback API
 * Collects user feedback for beta testing and improvement
 */

import { NextRequest, NextResponse } from 'next/server'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { submitFeedback } from '@/lib/feedback/feedback-collector'
import { z } from 'zod'

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'question', 'other']),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  category: z.string().optional(),
  pageUrl: z.string().optional(),
  screenshotUrl: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

// POST /api/feedback - Submit feedback
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: '*', action: 'READ' }, // Allow all authenticated users
    async (req, userInfo) => {
      try {
        const body = await req.json()
        const data = feedbackSchema.parse(body)

        const result = await submitFeedback(
          userInfo.userId,
          userInfo.tenantId,
          {
            type: data.type,
            title: data.title,
            description: data.description,
            priority: data.priority || 'medium',
            category: data.category,
            pageUrl: data.pageUrl,
            screenshotUrl: data.screenshotUrl,
            metadata: data.metadata,
          }
        )

        if (result.success) {
          return NextResponse.json(
            {
              success: true,
              feedbackId: result.feedbackId,
              message: 'Feedback submitted successfully',
            },
            { status: 201 }
          )
        } else {
          return NextResponse.json(
            { error: result.error || 'Failed to submit feedback' },
            { status: 500 }
          )
        }
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error submitting feedback:', error)
        return NextResponse.json(
          { error: 'Failed to submit feedback', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// GET /api/feedback - Get feedback (admin only)
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'admin', action: 'READ' },
    async (req, userInfo) => {
      try {
        // TODO: Fetch feedback from database when Feedback model is created
        return NextResponse.json({
          feedback: [],
          stats: {
            total: 0,
            byType: {},
            byPriority: {},
          },
        })
      } catch (error: any) {
        console.error('Error fetching feedback:', error)
        return NextResponse.json(
          { error: 'Failed to fetch feedback', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}


