import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch approvals for current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'pending' // pending, approved, rejected, all, requested

    // Build where clause based on filter
    let whereClause: any = {}

    if (filter === 'pending') {
      // Get approvals where current user is an approver and status is pending
      whereClause = {
        approvers: {
          some: {
            userId: session.user.id,
            status: 'PENDING',
          },
        },
      }
    } else if (filter === 'approved') {
      whereClause = {
        approvers: {
          some: {
            userId: session.user.id,
            status: 'APPROVED',
          },
        },
      }
    } else if (filter === 'rejected') {
      whereClause = {
        approvers: {
          some: {
            userId: session.user.id,
            status: 'REJECTED',
          },
        },
      }
    } else if (filter === 'requested') {
      // Approvals requested by current user
      whereClause = {
        requestedById: session.user.id,
        tenantId: session.user.tenantId,
      }
    } else if (filter === 'all') {
      // All approvals where user is involved (as approver or requester)
      whereClause = {
        OR: [
          {
            approvers: {
              some: {
                userId: session.user.id,
              },
            },
          },
          {
            requestedById: session.user.id,
          },
        ],
        tenantId: session.user.tenantId,
      }
    }

    const approvals = await prisma.approval.findMany({
      where: whereClause,
      include: {
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        approvers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        rejectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ approvals })
  } catch (error) {
    console.error('Error fetching approvals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new approval request
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      type,
      title,
      description,
      entityId,
      entityType,
      documentData,
      approvers,
      ccList,
      message,
    } = body

    // Validate required fields
    if (!type || !title || !approvers || approvers.length === 0) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: type, title, and at least one approver are required',
        },
        { status: 400 }
      )
    }

    // Create approval with approvers
    const approval = await prisma.approval.create({
      data: {
        type,
        title,
        description,
        entityId,
        entityType,
        documentData,
        message,
        ccList: ccList || [],
        tenantId: session.user.tenantId,
        requestedById: session.user.id,
        approvers: {
          create: approvers.map((userId: string) => ({
            userId,
            status: 'PENDING',
          })),
        },
      },
      include: {
        approvers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ approval }, { status: 201 })
  } catch (error) {
    console.error('Error creating approval:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
