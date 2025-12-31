import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rule = await prisma.salesAutomationRule.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId!,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    return NextResponse.json(rule)
  } catch (error: any) {
    console.error('Error fetching automation rule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch automation rule', details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      triggerType,
      triggerConditions,
      actionType,
      actionConfig,
      isActive,
      priority,
    } = body

    const rule = await prisma.salesAutomationRule.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId!,
      },
    })

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    const updatedRule = await prisma.salesAutomationRule.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(triggerType && { triggerType: triggerType as any }),
        ...(triggerConditions !== undefined && { triggerConditions }),
        ...(actionType && { actionType: actionType as any }),
        ...(actionConfig !== undefined && { actionConfig }),
        ...(isActive !== undefined && { isActive }),
        ...(priority !== undefined && { priority }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(updatedRule)
  } catch (error: any) {
    console.error('Error updating automation rule:', error)
    return NextResponse.json(
      { error: 'Failed to update automation rule', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rule = await prisma.salesAutomationRule.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId!,
      },
    })

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    await prisma.salesAutomationRule.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting automation rule:', error)
    return NextResponse.json(
      { error: 'Failed to delete automation rule', details: error.message },
      { status: 500 }
    )
  }
}

