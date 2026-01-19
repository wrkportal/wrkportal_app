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

    const lead = await prisma.salesLead.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId!,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
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
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error: any) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead', details: error.message },
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
      firstName,
      lastName,
      email,
      company,
      phone,
      mobile,
      title,
      industry,
      leadSource,
      status,
      rating,
      score,
      description,
      assignedToId,
      nextContactDate,
      customFields,
    } = body

    const lead = await prisma.salesLead.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId!,
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Build update data object
    const updateData: {
      firstName?: string
      lastName?: string
      email?: string
      company?: string | null
      phone?: string | null
      mobile?: string | null
      title?: string | null
      industry?: string | null
      leadSource?: any
      status?: any
      rating?: any
      score?: number
      description?: string | null
      assignedToId?: string | null
      nextContactDate?: Date | null
      customFields?: any
    } = {}

    if (firstName) updateData.firstName = firstName
    if (lastName) updateData.lastName = lastName
    if (email) updateData.email = email
    if (company !== undefined) updateData.company = company
    if (phone !== undefined) updateData.phone = phone
    if (mobile !== undefined) updateData.mobile = mobile
    if (title !== undefined) updateData.title = title
    if (industry !== undefined) updateData.industry = industry
    if (leadSource) updateData.leadSource = leadSource
    if (status) updateData.status = status
    if (rating) updateData.rating = rating
    if (score !== undefined) updateData.score = score
    if (description !== undefined) updateData.description = description
    if (assignedToId) updateData.assignedToId = assignedToId
    if (customFields !== undefined) updateData.customFields = customFields

    // Handle nextContactDate separately
    if (nextContactDate !== undefined) {
      if (nextContactDate && nextContactDate !== '') {
        try {
          const date = new Date(nextContactDate)
          if (!isNaN(date.getTime())) {
            updateData.nextContactDate = date
          } else {
            updateData.nextContactDate = null
          }
        } catch {
          updateData.nextContactDate = null
        }
      } else {
        updateData.nextContactDate = null
      }
    }

    const updatedLead = await prisma.salesLead.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Handle task creation/update when nextContactDate changes
    if (nextContactDate !== undefined) {
      try {
        // Fetch the lead again to get ownerId if needed
        const leadWithOwner = await prisma.salesLead.findUnique({
          where: { id: params.id },
          select: {
            assignedToId: true,
            ownerId: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
          },
        })

        if (!leadWithOwner) {
          console.error('Lead not found after update')
          // Continue without creating task, but still return the updated lead
        } else {
          // Use assignedToId from lead, or fallback to ownerId if no assignedTo
          const taskAssigneeId = leadWithOwner.assignedToId || leadWithOwner.ownerId

          console.log('Processing nextContactDate for lead:', params.id, 'nextContactDate:', nextContactDate, 'assignedToId:', leadWithOwner.assignedToId, 'ownerId:', leadWithOwner.ownerId, 'taskAssigneeId:', taskAssigneeId)
          
          if (!taskAssigneeId) {
            console.warn('No assignee found for lead, skipping task creation. Lead ID:', params.id)
            // Continue without creating task
          } else {
            // Find existing task for this lead
            const existingTask = await prisma.task.findFirst({
              where: {
                tenantId: session.user.tenantId!,
                sourceType: 'sales-lead',
                sourceId: params.id,
                deletedAt: null,
              },
            })

            if (nextContactDate) {
              console.log('Creating/updating task for lead - taskAssigneeId:', taskAssigneeId, 'session.user.id:', session.user.id)
              const leadName = `${leadWithOwner.firstName} ${leadWithOwner.lastName}`.trim() || leadWithOwner.email || 'Lead'
              
              if (existingTask) {
                // Update existing task
                const updatedTask = await prisma.task.update({
                  where: { id: existingTask.id },
                  data: {
                    title: `Contact ${leadName}`,
                    description: `Follow up with lead: ${leadName}${leadWithOwner.company ? ` (${leadWithOwner.company})` : ''}`,
                    assigneeId: taskAssigneeId,
                    dueDate: new Date(nextContactDate),
                    status: 'TODO', // Reset to TODO if it was done/cancelled
                  },
                })
                console.log('Updated task for lead:', updatedTask.id, updatedTask.title, updatedTask.dueDate, updatedTask.assigneeId, updatedTask.sourceType, updatedTask.sourceId)
              } else {
                // Create new task
                const newTask = await prisma.task.create({
                  data: {
                    title: `Contact ${leadName}`,
                    description: `Follow up with lead: ${leadName}${leadWithOwner.company ? ` (${leadWithOwner.company})` : ''}`,
                    assigneeId: taskAssigneeId,
                    priority: 'MEDIUM',
                    status: 'TODO',
                    dueDate: new Date(nextContactDate),
                    tenantId: session.user.tenantId!,
                    createdById: session.user.id,
                    sourceType: 'sales-lead',
                    sourceId: params.id,
                  },
                })
                console.log('Created task for lead:', newTask.id, newTask.title, newTask.dueDate, newTask.assigneeId, newTask.sourceType, newTask.sourceId)
              }
            } else if (!nextContactDate && existingTask) {
              // If nextContactDate is cleared, mark task as done
              await prisma.task.update({
                where: { id: existingTask.id },
                data: {
                  status: 'DONE',
                },
              })
            }
          }
        }
      } catch (error: any) {
        console.error('Error managing task for lead next contact date:', error)
        console.error('Error details:', error.message, error.stack)
        // Don't fail the request if task creation/update fails
      }
    }

    return NextResponse.json(updatedLead)
  } catch (error: any) {
    console.error('Error updating lead:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Failed to update lead', details: error.message },
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

    const lead = await prisma.salesLead.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId!,
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    await prisma.salesLead.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { error: 'Failed to delete lead', details: error.message },
      { status: 500 }
    )
  }
}

