/**
 * Phase 5.2: Integration Template Details API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserForPermissionCheck } from '@/lib/permissions/permission-middleware'
import { getTemplate, addTemplateReview } from '@/lib/integrations/templates'
import { z } from 'zod'

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
})

// GET /api/integrations/marketplace/[templateId] - Get template details
export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  const userInfo = await getUserForPermissionCheck()
  
  if (!userInfo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = userInfo.role === 'ORG_ADMIN' || 
                  userInfo.role === 'TENANT_SUPER_ADMIN' || 
                  userInfo.role === 'PLATFORM_OWNER' ||
                  userInfo.role === 'INTEGRATION_ADMIN'

  if (!isAdmin) {
    return NextResponse.json({ error: 'Permission denied. Admin access required.' }, { status: 403 })
  }

  try {
    const template = await getTemplate(params.templateId)

    if (!template) {
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

// POST /api/integrations/marketplace/[templateId]/review - Add template review
export async function POST(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  const userInfo = await getUserForPermissionCheck()
  
  if (!userInfo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = userInfo.role === 'ORG_ADMIN' || 
                  userInfo.role === 'TENANT_SUPER_ADMIN' || 
                  userInfo.role === 'PLATFORM_OWNER' ||
                  userInfo.role === 'INTEGRATION_ADMIN'

  if (!isAdmin) {
    return NextResponse.json({ error: 'Permission denied. Admin access required.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const data = reviewSchema.parse(body)

    const review = await addTemplateReview(
      params.templateId,
      userInfo.userId,
      userInfo.tenantId,
      data.rating,
      data.comment
    )

    return NextResponse.json({ review }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error adding review:', error)
    return NextResponse.json(
      { error: 'Failed to add review', details: error.message },
      { status: 500 }
    )
  }
}

