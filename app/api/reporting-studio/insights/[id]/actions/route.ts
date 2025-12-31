import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

/**
 * POST /api/reporting-studio/insights/[id]/actions
 * Create or update an insight action (dismiss, favorite, etc.)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { actionType } = body

    if (!actionType || !['DISMISSED', 'FAVORITED', 'VIEWED'].includes(actionType)) {
      return NextResponse.json(
        { error: 'Invalid action type. Must be DISMISSED, FAVORITED, or VIEWED' },
        { status: 400 }
      )
    }

    // Check if insight exists
    const insight = await prisma.reportingInsight.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!insight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 })
    }

    // Create or update action (upsert)
    const action = await prisma.reportingUserInsightAction.upsert({
      where: {
        insightId_userId_actionType: {
          insightId: params.id,
          userId: user.id,
          actionType: actionType as any,
        },
      },
      create: {
        tenantId: user.tenantId,
        insightId: params.id,
        userId: user.id,
        actionType: actionType as any,
      },
      update: {
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      action: {
        id: action.id,
        actionType: action.actionType,
        createdAt: action.createdAt.toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Error creating insight action:', error)
    return NextResponse.json(
      { error: 'Failed to create insight action', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reporting-studio/insights/[id]/actions
 * Remove an insight action (e.g., undismiss, unfavorite)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const actionType = searchParams.get('actionType')

    if (!actionType || !['DISMISSED', 'FAVORITED', 'VIEWED'].includes(actionType)) {
      return NextResponse.json(
        { error: 'Invalid action type. Must be DISMISSED, FAVORITED, or VIEWED' },
        { status: 400 }
      )
    }

    // Delete the action
    await prisma.reportingUserInsightAction.deleteMany({
      where: {
        insightId: params.id,
        userId: user.id,
        actionType: actionType as any,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting insight action:', error)
    return NextResponse.json(
      { error: 'Failed to delete insight action', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reporting-studio/insights/[id]/actions
 * Get all actions for an insight (for the current user)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all actions for this insight by this user
    const actions = await prisma.reportingUserInsightAction.findMany({
      where: {
        insightId: params.id,
        userId: user.id,
      },
    })

    return NextResponse.json({
      actions: actions.map(a => ({
        id: a.id,
        actionType: a.actionType,
        createdAt: a.createdAt.toISOString(),
      })),
    })
  } catch (error: any) {
    console.error('Error fetching insight actions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insight actions', details: error.message },
      { status: 500 }
    )
  }
}

