import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// POST - Reject an approval request
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { comments } = body

    if (!comments || comments.trim() === '') {
      return NextResponse.json(
        { error: 'Comments are required when rejecting' },
        { status: 400 }
      )
    }

    // Find the approval and check if user is an approver
    type ApprovalWithApprovers = Prisma.ApprovalGetPayload<{
      include: {
        approvers: true
      }
    }>

    type ApprovalApprover = ApprovalWithApprovers['approvers'][0]

    const approval = (await prisma.approval.findUnique({
      where: { id: params.id },
      include: {
        approvers: true,
      },
    })) as ApprovalWithApprovers | null

    if (!approval) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
    }

    const approverRecord = approval.approvers.find(
      (a: ApprovalApprover) => a.userId === session.user.id
    )

    if (!approverRecord) {
      return NextResponse.json(
        { error: 'You are not an approver for this request' },
        { status: 403 }
      )
    }

    if (approverRecord.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'You have already responded to this approval' },
        { status: 400 }
      )
    }

    // Update the approver record
    await prisma.approvalApprover.update({
      where: { id: approverRecord.id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        comments,
      },
    })

    // Update the overall approval status to REJECTED
    // (one rejection rejects the entire approval)
    await prisma.approval.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedById: session.user.id,
      },
    })

    // Fetch the updated approval
    const finalApproval = await prisma.approval.findUnique({
      where: { id: params.id },
      include: {
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ approval: finalApproval })
  } catch (error) {
    console.error('Error rejecting request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
