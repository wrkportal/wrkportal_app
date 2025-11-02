import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = query.trim().toLowerCase()

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true },
    })

    if (!user || !user.tenantId) {
      return NextResponse.json({ results: [] })
    }

    // Search across multiple entities in parallel
    const [projects, tasks, users, programs] = await Promise.all([
      // Search Projects
      prisma.project.findMany({
        where: {
          tenantId: user.tenantId,
          deletedAt: null,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          ragStatus: true,
          manager: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          endDate: true,
        },
        take: 20,
      }),

      // Search Tasks
      prisma.task.findMany({
        where: {
          tenantId: user.tenantId,
          deletedAt: null,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          projectId: true,
          assignee: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          dueDate: true,
        },
        take: 20,
      }),

      // Search Users
      prisma.user.findMany({
        where: {
          tenantId: user.tenantId,
          OR: [
            { firstName: { contains: searchTerm, mode: 'insensitive' } },
            { lastName: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
        take: 20,
      }),

      // Search Programs
      prisma.program.findMany({
        where: {
          tenantId: user.tenantId,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          owner: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        take: 20,
      }),
    ])

    // Transform results into a unified format
    const results = [
      // Projects
      ...projects.map((p) => ({
        id: p.id,
        type: 'project',
        title: p.name,
        description: p.description || 'No description',
        status: p.status,
        priority: p.ragStatus,
        url: `/projects/${p.id}`,
        metadata: {
          owner: p.manager
            ? `${p.manager.firstName} ${p.manager.lastName}`
            : null,
          dueDate: p.endDate ? new Date(p.endDate).toLocaleDateString() : null,
        },
      })),

      // Tasks
      ...tasks.map((t) => ({
        id: t.id,
        type: 'task',
        title: t.title,
        description: t.description || 'No description',
        status: t.status,
        priority: t.priority,
        url: `/projects/${t.projectId}?taskId=${t.id}`,
        metadata: {
          owner: t.assignee
            ? `${t.assignee.firstName} ${t.assignee.lastName}`
            : null,
          dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : null,
        },
      })),

      // Users
      ...users.map((u) => ({
        id: u.id,
        type: 'user',
        title: `${u.firstName} ${u.lastName}`,
        description: u.email,
        status: u.role.replace(/_/g, ' '),
        url: `/admin/users?userId=${u.id}`,
        metadata: {
          role: u.role.replace(/_/g, ' '),
        },
      })),

      // Programs
      ...programs.map((p) => ({
        id: p.id,
        type: 'program',
        title: p.name,
        description: p.description || 'No description',
        status: p.status,
        url: `/programs/${p.id}`,
        metadata: {
          owner: p.owner ? `${p.owner.firstName} ${p.owner.lastName}` : null,
        },
      })),
    ]

    return NextResponse.json({
      results,
      total: results.length,
      query: query,
    })
  } catch (error) {
    console.error('Error performing search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
