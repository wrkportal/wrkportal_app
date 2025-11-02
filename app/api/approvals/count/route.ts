import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET - Get count of pending approvals for current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const count = await prisma.approvalApprover.count({
      where: {
        userId: session.user.id,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error counting approvals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
