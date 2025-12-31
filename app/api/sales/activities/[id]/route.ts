import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

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
      type,
      subject,
      description,
      status,
      priority,
      dueDate,
      completedDate,
      duration,
      location,
      accountId,
      contactId,
      leadId,
      opportunityId,
      assignedToId,
    } = body

    const activity = await prisma.salesActivity.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId!,
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    const updatedActivity = await prisma.salesActivity.update({
      where: { id: params.id },
      data: {
        ...(type && { type }),
        ...(subject && { subject }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(completedDate && { completedDate: new Date(completedDate) }),
        ...(duration !== undefined && { duration }),
        ...(location !== undefined && { location }),
        ...(accountId !== undefined && { accountId }),
        ...(contactId !== undefined && { contactId }),
        ...(leadId !== undefined && { leadId }),
        ...(opportunityId !== undefined && { opportunityId }),
        ...(assignedToId && { assignedToId }),
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            name: true,
            amount: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(updatedActivity)
  } catch (error: any) {
    console.error('Error updating activity:', error)
    return NextResponse.json(
      { error: 'Failed to update activity', details: error.message },
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

    const activity = await prisma.salesActivity.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId!,
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    await prisma.salesActivity.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting activity:', error)
    return NextResponse.json(
      { error: 'Failed to delete activity', details: error.message },
      { status: 500 }
    )
  }
}

