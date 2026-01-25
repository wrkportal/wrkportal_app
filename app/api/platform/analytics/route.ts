import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types'

// GET /api/platform/analytics - Get platform-wide analytics
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only PLATFORM_OWNER can access
    if (session.user.role !== UserRole.PLATFORM_OWNER) {
      return NextResponse.json({ error: 'Forbidden - Platform Owner access required' }, { status: 403 })
    }

    // Get all analytics across all tenants
    const [
      totalTenants,
      totalUsers,
      totalProjects,
      totalTasks,
      activeTenants,
      activeUsers,
      tenantsWithVerifiedDomain,
      tenantsByPlan,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.tenant.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.tenant.count({ where: { domainVerified: true } }),
      prisma.tenant.groupBy({
        by: ['plan'],
        _count: true,
      }),
    ])

    // Get recent tenants
    const recentTenants = await prisma.tenant.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        domain: true,
        domainVerified: true,
        plan: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            projects: true,
          },
        },
      },
    })

    // Get user role distribution
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    })

    // Get task status distribution
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      _count: true,
    })

    // Get project status distribution
    const projectsByStatus = await prisma.project.groupBy({
      by: ['status'],
      _count: true,
    })

    return NextResponse.json({
      overview: {
        totalTenants,
        totalUsers,
        totalProjects,
        totalTasks,
        activeTenants,
        activeUsers,
        tenantsWithVerifiedDomain,
      },
      tenantsByPlan: tenantsByPlan.reduce((acc: Record<string, number>, item: any) => {
        acc[item.plan] = item._count
        return acc
      }, {} as Record<string, number>),
      usersByRole: usersByRole.reduce((acc: Record<string, number>, item: any) => {
        acc[item.role] = item._count
        return acc
      }, {} as Record<string, number>),
      tasksByStatus: tasksByStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<string, number>),
      projectsByStatus: projectsByStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<string, number>),
      recentTenants,
    })
  } catch (error) {
    console.error('Error fetching platform analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

