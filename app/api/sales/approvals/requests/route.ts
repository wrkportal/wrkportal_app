import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { requestApproval, getEntityApprovalRequests, getPendingApprovalsForUser } from '@/lib/sales/approval-workflows'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const pending = searchParams.get('pending') === 'true'

    if (pending) {
      // Get pending approvals for current user
      const approvals = await getPendingApprovalsForUser(session.user.id, session.user.tenantId)
      return NextResponse.json({ approvals })
    } else if (entityType && entityId) {
      // Get approval requests for entity
      const requests = await getEntityApprovalRequests(
        session.user.tenantId,
        entityType as any,
        entityId
      )
      return NextResponse.json({ requests })
    } else {
      return NextResponse.json(
        { error: 'entityType and entityId required, or pending=true' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error fetching approval requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch approval requests' },
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
    const { workflowId, entityType, entityId, metadata, expiresInDays } = body

    if (!workflowId || !entityType || !entityId) {
      return NextResponse.json(
        { error: 'workflowId, entityType, and entityId are required' },
        { status: 400 }
      )
    }

    const requestId = await requestApproval(
      session.user.tenantId,
      workflowId,
      entityType,
      entityId,
      session.user.id,
      metadata,
      expiresInDays
    )

    return NextResponse.json({ id: requestId, success: true }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating approval request:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create approval request' },
      { status: 500 }
    )
  }
}

