import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/users - Fetch all active users for the current tenant
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
        avatar: true,
      },
      orderBy: [
        { status: 'asc' }, // ACTIVE first, then INVITED
        { firstName: 'asc' },
      ],
    })

    // Format users to match expected structure (id, name, email)
    const formattedUsers = users.map((user: { id: string; name: string | null; firstName: string | null; lastName: string | null; email: string; role: string; status: string; avatar: string | null }) => ({
      id: user.id,
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error('[users API] Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

