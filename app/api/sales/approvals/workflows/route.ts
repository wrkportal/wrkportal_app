import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createApprovalWorkflow } from '@/lib/sales/approval-workflows'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const isActive = searchParams.get('isActive')

    const where: any = {
      tenantId: session.user.tenantId,
    }

    if (entityType) {
      where.entityType = entityType
    }
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const workflows = await prisma.salesApprovalWorkflow.findMany({
      where,
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(workflows)
  } catch (error: any) {
    console.error('Error fetching approval workflows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch approval workflows' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, entityType, triggerConditions, approvalLevels } = body

    const workflowId = await createApprovalWorkflow(
      session.user.tenantId,
      {
        name,
        description,
        entityType,
        triggerConditions,
        approvalLevels,
      },
      session.user.id
    )

    return NextResponse.json({ id: workflowId, success: true }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating approval workflow:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create approval workflow' },
      { status: 500 }
    )
  }
}

