import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/deleted-items - Fetch all deleted items (tasks and projects)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch deleted tasks
    const deletedTasks = await prisma.task.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: { not: null },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
    })

    // Fetch deleted projects
    const deletedProjects = await prisma.project.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: { not: null },
      },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
    })

    return NextResponse.json(
      {
        tasks: deletedTasks,
        projects: deletedProjects,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching deleted items:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
