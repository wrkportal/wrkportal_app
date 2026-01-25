import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
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
      nextContactDate,
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

    // Build update data object
    const updateData: Prisma.SalesOpportunityUpdateInput = {}

    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (stage) updateData.stage = stage
    if (amount !== undefined) updateData.amount = amount
    if (probability !== undefined) updateData.probability = probability
    if (expectedCloseDate) updateData.expectedCloseDate = new Date(expectedCloseDate)
    if (actualCloseDate) updateData.actualCloseDate = new Date(actualCloseDate)
    if (type) updateData.type = type
    if (nextStep !== undefined) updateData.nextStep = nextStep
    if (competitorInfo !== undefined) updateData.competitorInfo = competitorInfo
    if (lossReason !== undefined) updateData.lossReason = lossReason
    if (status) updateData.status = status
    if (ownerId) updateData.owner = { connect: { id: ownerId } }

    // Handle nextContactDate separately
    if (nextContactDate !== undefined) {
      if (nextContactDate && nextContactDate !== '') {
        try {
          const date = new Date(nextContactDate)
          if (!isNaN(date.getTime())) {
            ;(updateData as any).nextContactDate = date
          } else {
            ;(updateData as any).nextContactDate = null
          }
        } catch {
          ;(updateData as any).nextContactDate = null
        }
      } else {
        ;(updateData as any).nextContactDate = null
      }
    }

    const updatedOpportunity = await prisma.salesOpportunity.update({
      where: { id: params.id },
      data: updateData,
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

    // Handle task creation/update when nextContactDate changes
    if (nextContactDate !== undefined) {
      try {
        console.log('Processing nextContactDate for opportunity:', params.id, 'nextContactDate:', nextContactDate, 'ownerId:', updatedOpportunity.ownerId)
        
        // Find existing task for this opportunity
        const existingTask = await prisma.task.findFirst({
          where: {
            tenantId: session.user.tenantId!,
            sourceType: 'sales-opportunity',
            sourceId: params.id,
            deletedAt: null,
          },
        })

        if (!updatedOpportunity.ownerId) {
          console.warn('No owner found for opportunity, skipping task creation. Opportunity ID:', params.id)
        } else if (nextContactDate) {
          console.log('Creating/updating task for opportunity - ownerId:', updatedOpportunity.ownerId, 'session.user.id:', session.user.id)
          if (existingTask) {
            // Update existing task
            const updatedTask = await prisma.task.update({
              where: { id: existingTask.id },
              data: {
                title: `Follow up: ${updatedOpportunity.name}`,
                description: `Follow up on opportunity: ${updatedOpportunity.name}${updatedOpportunity.account ? ` (${updatedOpportunity.account.name})` : ''}${updatedOpportunity.nextStep ? `\nNext Step: ${updatedOpportunity.nextStep}` : ''}`,
                assigneeId: updatedOpportunity.ownerId,
                priority: updatedOpportunity.probability && updatedOpportunity.probability > 50 ? 'HIGH' : updatedOpportunity.probability && updatedOpportunity.probability > 25 ? 'MEDIUM' : 'LOW',
                dueDate: new Date(nextContactDate),
                status: 'TODO', // Reset to TODO if it was done/cancelled
              },
            })
            console.log('Updated task for opportunity:', updatedTask.id, updatedTask.title, updatedTask.dueDate, updatedTask.assigneeId)
          } else {
            // Create new task
            const newTask = await prisma.task.create({
              data: {
                title: `Follow up: ${updatedOpportunity.name}`,
                description: `Follow up on opportunity: ${updatedOpportunity.name}${updatedOpportunity.account ? ` (${updatedOpportunity.account.name})` : ''}${updatedOpportunity.nextStep ? `\nNext Step: ${updatedOpportunity.nextStep}` : ''}`,
                assigneeId: updatedOpportunity.ownerId,
                priority: updatedOpportunity.probability && updatedOpportunity.probability > 50 ? 'HIGH' : updatedOpportunity.probability && updatedOpportunity.probability > 25 ? 'MEDIUM' : 'LOW',
                status: 'TODO',
                dueDate: new Date(nextContactDate),
                tenantId: session.user.tenantId!,
                createdById: session.user.id,
                sourceType: 'sales-opportunity',
                sourceId: params.id,
              },
            })
            console.log('Created task for opportunity:', newTask.id, newTask.title, newTask.dueDate, newTask.assigneeId, newTask.sourceType, newTask.sourceId)
          }
        }
        
        if (!nextContactDate && existingTask) {
          // If nextContactDate is cleared, mark task as done
          await prisma.task.update({
            where: { id: existingTask.id },
            data: {
              status: 'DONE',
            },
          })
        }
      } catch (error: any) {
        console.error('Error managing task for opportunity next contact date:', error)
        console.error('Error details:', error.message, error.stack)
        // Don't fail the request if task creation/update fails
      }
    }

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

