import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/reports - Fetch aggregated report data
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Base filters
    const dateFilter =
      startDate && endDate
        ? {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {}

    // Fetch all necessary data
    const [projects, goals, tasks, programs] = await Promise.all([
      prisma.project.findMany({
        where: {
          tenantId: user.tenantId,
          deletedAt: null,
          ...dateFilter,
        },
        include: {
          _count: {
            select: { tasks: true },
          },
        },
      }),
      prisma.goal.findMany({
        where: {
          tenantId: user.tenantId,
          ...dateFilter,
        },
        include: {
          keyResults: true,
        },
      }),
      prisma.task.findMany({
        where: {
          project: {
            tenantId: user.tenantId,
            deletedAt: null,
          },
          ...dateFilter,
        },
      }),
      prisma.program.findMany({
        where: {
          tenantId: user.tenantId,
          ...dateFilter,
        },
        include: {
          projects: {
            where: { deletedAt: null },
          },
        },
      }),
    ])

    // Calculate project metrics
    const projectMetrics = {
      total: projects.length,
      byStatus: projects.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byHealth: projects.reduce((acc, p) => {
        const status = p.ragStatus as string
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      avgProgress:
        projects.length > 0
          ? projects.reduce((sum, p) => sum + (p.progress || 0), 0) /
            projects.length
          : 0,
      totalBudget: projects.reduce(
        (sum, p) => sum + (Number((p.budget as any)?.total) || 0),
        0
      ),
      totalSpent: projects.reduce(
        (sum, p) => sum + (Number((p.budget as any)?.spent) || 0),
        0
      ),
    }

    // Calculate OKR metrics
    const okrMetrics = {
      totalGoals: goals.length,
      byStatus: goals.reduce((acc, g) => {
        acc[g.status] = (acc[g.status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byLevel: goals.reduce((acc, g) => {
        acc[g.level] = (acc[g.level] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      totalKeyResults: goals.reduce((sum, g) => sum + g.keyResults.length, 0),
      avgConfidence:
        goals.reduce((sum, g) => {
          const avgConf =
            g.keyResults.length > 0
              ? g.keyResults.reduce((s, kr) => s + kr.confidence, 0) /
                g.keyResults.length
              : 0
          return sum + avgConf
        }, 0) / (goals.length || 1),
    }

    // Calculate task metrics
    const taskMetrics = {
      total: tasks.length,
      byStatus: tasks.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byPriority: tasks.reduce((acc, t) => {
        acc[t.priority] = (acc[t.priority] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      completed: tasks.filter((t) => t.status === 'DONE').length,
      overdue: tasks.filter(
        (t) =>
          t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
      ).length,
    }

    // Calculate program metrics
    const programMetrics = {
      total: programs.length,
      totalProjects: programs.reduce((sum, p) => sum + p.projects.length, 0),
      avgProjectsPerProgram:
        programs.length > 0
          ? programs.reduce((sum, p) => sum + p.projects.length, 0) /
            programs.length
          : 0,
    }

    // Timeline data (last 6 months)
    const now = new Date()
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      // Create a date for each of the last 6 months
      const targetDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)

      return {
        month: targetDate.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        projectsCreated: projects.filter(
          (p) =>
            new Date(p.createdAt) >= monthStart &&
            new Date(p.createdAt) <= monthEnd
        ).length,
        projectsCompleted: projects.filter(
          (p) =>
            p.status === 'COMPLETED' &&
            p.updatedAt &&
            new Date(p.updatedAt) >= monthStart &&
            new Date(p.updatedAt) <= monthEnd
        ).length,
        tasksCompleted: tasks.filter(
          (t) =>
            t.status === 'DONE' &&
            t.updatedAt &&
            new Date(t.updatedAt) >= monthStart &&
            new Date(t.updatedAt) <= monthEnd
        ).length,
      }
    })

    // Return comprehensive report data
    return NextResponse.json(
      {
        reportType,
        generatedAt: new Date().toISOString(),
        dateRange: { startDate, endDate },
        summary: {
          projects: projectMetrics,
          okrs: okrMetrics,
          tasks: taskMetrics,
          programs: programMetrics,
        },
        timeline: monthlyData,
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          ragStatus: p.ragStatus,
          progress: p.progress,
          budget: Number((p.budget as any)?.total) || 0,
          spent: Number((p.budget as any)?.spent) || 0,
          startDate: p.startDate,
          endDate: p.endDate,
          taskCount: p._count.tasks,
        })),
        goals: goals.map((g) => ({
          id: g.id,
          title: g.title,
          status: g.status,
          level: g.level,
          quarter: g.quarter,
          year: g.year,
          keyResultCount: g.keyResults.length,
          avgProgress:
            g.keyResults.length > 0
              ? g.keyResults.reduce((sum, kr) => {
                  const progress =
                    ((Number(kr.currentValue) - Number(kr.startValue)) /
                      (Number(kr.targetValue) - Number(kr.startValue))) *
                    100
                  return sum + Math.max(0, Math.min(progress, 100))
                }, 0) / g.keyResults.length
              : 0,
        })),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
