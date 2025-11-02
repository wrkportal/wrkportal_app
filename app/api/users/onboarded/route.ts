import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all active and invited users from the same tenant
    // Exclude SUPER_ADMIN users for security (they should remain hidden)
    const users = await prisma.user.findMany({
      where: {
        tenantId: session.user.tenantId,
        status: {
          in: ['ACTIVE', 'INVITED']
        },
        role: {
          not: 'SUPER_ADMIN' // Exclude super admins from user lists
        }
      },
      select: {
        id: true,
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

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching onboarded users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
