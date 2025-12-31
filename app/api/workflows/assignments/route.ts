import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { WorkflowType } from '@/types/index'

const assignWorkflowSchema = z.object({
  userId: z.string(),
  workflowType: z.nativeEnum(WorkflowType),
  assignedBy: z.string().optional(),
})

// POST - Assign workflow to user
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can assign workflows
    const isAdmin = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN', 'PMO_LEAD'].includes(session.user.role)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = assignWorkflowSchema.parse(body)

    // Check if user exists and belongs to same tenant
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      select: { tenantId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create or update workflow assignment
    const assignment = await prisma.userWorkflowAssignment.upsert({
      where: {
        userId_workflowType: {
          userId: validatedData.userId,
          workflowType: validatedData.workflowType,
        },
      },
      update: {
        isActive: true,
        assignedBy: validatedData.assignedBy || session.user.id,
        assignedAt: new Date(),
      },
      create: {
        userId: validatedData.userId,
        workflowType: validatedData.workflowType,
        assignedBy: validatedData.assignedBy || session.user.id,
        isActive: true,
      },
    })

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error assigning workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get user's workflow assignments
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId') || session.user.id

    // Users can only see their own assignments unless they're admin
    const isAdmin = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN', 'PMO_LEAD'].includes(session.user.role)
    if (userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const assignments = await prisma.userWorkflowAssignment.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        assignedAt: 'desc',
      },
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Error fetching workflow assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove workflow assignment
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const workflowType = searchParams.get('workflowType')

    if (!userId || !workflowType) {
      return NextResponse.json(
        { error: 'userId and workflowType are required' },
        { status: 400 }
      )
    }

    // Only admins can remove assignments
    const isAdmin = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN', 'PMO_LEAD'].includes(session.user.role)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.userWorkflowAssignment.updateMany({
      where: {
        userId,
        workflowType: workflowType as WorkflowType,
      },
      data: {
        isActive: false,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing workflow assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

