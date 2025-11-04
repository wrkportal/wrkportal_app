import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      console.log('[onboarded API] No session or user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[onboarded API] Session user:', {
      id: session.user.id,
      email: session.user.email,
      tenantId: session.user.tenantId
    })

    // Fetch all active and invited users from the same tenant
    const users = await prisma.user.findMany({
      where: {
        tenantId: session.user.tenantId,
        status: {
          in: ['ACTIVE', 'INVITED']
        },
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
      },
      orderBy: [
        { status: 'asc' }, // ACTIVE first, then INVITED
        { firstName: 'asc' },
      ],
    })

    console.log(`[onboarded API] Found ${users.length} users`)
    return NextResponse.json({ users })
  } catch (error) {
    console.error('[onboarded API] Error fetching onboarded users:', error)
    console.error('[onboarded API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
