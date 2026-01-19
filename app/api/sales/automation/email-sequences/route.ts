import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createEmailSequence, startEmailSequence } from '@/lib/sales/email-sequences'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    if (action === 'create') {
      const sequenceId = await createEmailSequence({
        tenantId: session.user.tenantId,
        name: data.name,
        description: data.description,
        triggerType: data.triggerType,
        triggerConditions: data.triggerConditions,
        steps: data.steps,
        isActive: data.isActive !== false,
        createdById: session.user.id,
      })

      return NextResponse.json({ id: sequenceId, success: true })
    } else if (action === 'start') {
      await startEmailSequence(
        data.sequenceId,
        data.entityType,
        data.entityId,
        session.user.tenantId
      )

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error managing email sequence:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to manage email sequence' },
      { status: 500 }
    )
  }
}

