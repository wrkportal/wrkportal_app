import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { SalesAutomationEngine } from '@/lib/sales/automation-engine'
import { AutoActivityCapture } from '@/lib/sales/auto-activity-capture'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const opportunity = await prisma.salesOpportunity.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId!,
      },
      include: {
        account: true,
        owner: {
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
        contacts: {
          include: {
            contact: true,
          },
        },
        products: {
          include: {
            product: true,
          },
        },
        activities: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        quotes: {
          include: {
            lineItems: true,
          },
        },
      },
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    return NextResponse.json(opportunity)
  } catch (error: any) {
    console.error('Error fetching opportunity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch opportunity', details: error.message },
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
      stage,
      amount,
      probability,
      expectedCloseDate,
      actualCloseDate,
      type,
      nextStep,
      competitorInfo,
      lossReason,
      status,
      ownerId,
    } = body

    const opportunity = await prisma.salesOpportunity.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId!,
      },
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    const updatedOpportunity = await prisma.salesOpportunity.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(stage && { stage }),
        ...(amount !== undefined && { amount }),
        ...(probability !== undefined && { probability }),
        ...(expectedCloseDate && { expectedCloseDate: new Date(expectedCloseDate) }),
        ...(actualCloseDate && { actualCloseDate: new Date(actualCloseDate) }),
        ...(type && { type }),
        ...(nextStep !== undefined && { nextStep }),
        ...(competitorInfo !== undefined && { competitorInfo }),
        ...(lossReason !== undefined && { lossReason }),
        ...(status && { status }),
        ...(ownerId && { ownerId }),
      },
      include: {
        account: true,
        owner: {
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
        contacts: {
          include: {
            contact: true,
          },
        },
        products: {
          include: {
            product: true,
          },
        },
        activities: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        quotes: {
          include: {
            lineItems: true,
          },
        },
      },
    })

    // Trigger automation if stage changed
    if (stage && stage !== opportunity.stage) {
      // Automatically capture activity for stage change
      await AutoActivityCapture.capture({
        tenantId: session.user.tenantId!,
        userId: session.user.id,
        type: 'OPPORTUNITY_STAGE_CHANGED',
        data: {
          opportunityId: updatedOpportunity.id,
          oldStage: opportunity.stage,
          newStage: stage,
          opportunity: updatedOpportunity,
        },
      })

      await SalesAutomationEngine.trigger({
        tenantId: session.user.tenantId!,
        triggerType: 'OPPORTUNITY_STAGE_CHANGED',
        data: {
          opportunityId: updatedOpportunity.id,
          oldStage: opportunity.stage,
          newStage: stage,
          opportunity: updatedOpportunity,
        },
      })
    }

    return NextResponse.json(updatedOpportunity)
  } catch (error: any) {
    console.error('Error updating opportunity:', error)
    return NextResponse.json(
      { error: 'Failed to update opportunity', details: error.message },
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

    const opportunity = await prisma.salesOpportunity.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId!,
      },
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    await prisma.salesOpportunity.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting opportunity:', error)
    return NextResponse.json(
      { error: 'Failed to delete opportunity', details: error.message },
      { status: 500 }
    )
  }
}

