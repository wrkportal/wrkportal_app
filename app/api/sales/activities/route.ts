import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const assignedToId = searchParams.get('assignedToId')
    const accountId = searchParams.get('accountId')
    const contactId = searchParams.get('contactId')
    const leadId = searchParams.get('leadId')
    const opportunityId = searchParams.get('opportunityId')

    const where: any = {
      tenantId: session.user.tenantId!,
    }

    if (type) {
      where.type = type
    }
    if (status) {
      where.status = status
    }
    if (assignedToId) {
      where.assignedToId = assignedToId
    }
    if (accountId) {
      where.accountId = accountId
    }
    if (contactId) {
      where.contactId = contactId
    }
    if (leadId) {
      where.leadId = leadId
    }
    if (opportunityId) {
      where.opportunityId = opportunityId
    }

    const activities = await prisma.salesActivity.findMany({
      where,
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
      orderBy: {
        dueDate: 'asc',
      },
    })

    return NextResponse.json(activities)
  } catch (error: any) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities', details: error.message },
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
    const {
      type,
      subject,
      description,
      status,
      priority,
      dueDate,
      duration,
      location,
      accountId,
      contactId,
      leadId,
      opportunityId,
      assignedToId,
    } = body

    const activity = await prisma.salesActivity.create({
      data: {
        tenantId: session.user.tenantId!,
        type,
        subject,
        description: description || null,
        status: status || 'PLANNED',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        duration: duration || null,
        location: location || null,
        accountId: accountId || null,
        contactId: contactId || null,
        leadId: leadId || null,
        opportunityId: opportunityId || null,
        assignedToId: assignedToId || session.user.id,
        createdById: session.user.id,
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

    return NextResponse.json(activity, { status: 201 })
  } catch (error: any) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity', details: error.message },
      { status: 500 }
    )
  }
}

