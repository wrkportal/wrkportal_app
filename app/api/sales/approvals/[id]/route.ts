import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { processApproval } from '@/lib/sales/approval-workflows'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { decision, comments } = body

    if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
      return NextResponse.json(
        { error: 'decision must be APPROVED or REJECTED' },
        { status: 400 }
      )
    }

    await processApproval(params.id, session.user.id, decision, comments)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error processing approval:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process approval' },
      { status: 500 }
    )
  }
}

