import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET - Fetch comprehensive dashboard data for user's projects
 * Returns projects where user is member or lead with detailed statistics
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status')
    const ragStatusFilter = searchParams.get('ragStatus')
    const programFilter = searchParams.get('programId')
    const workflowFilter = searchParams.get('workflowType')

    // Base where clause for user's projects
    const baseWhere: any = {
      tenantId: session.user.tenantId,
      deletedAt: null,
      OR: [
        { managerId: userId },
        { teamMembers: { some: { userId } } },
      ],
    }

    // Apply filters
    if (statusFilter && statusFilter !== 'all') {
      baseWhere.status = statusFilter
    }

    if (ragStatusFilter && ragStatusFilter !== 'all') {
      baseWhere.ragStatus = ragStatusFilter
    }

    if (programFilter && programFilter !== 'all') {
      baseWhere.programId = programFilter
    }

    if (workflowFilter && workflowFilter !== 'all') {
      baseWhere.workflowType = workflowFilter
    }

    // Fetch projects with all related data
    const projects = await prisma.project.findMany({
      where: baseWhere,
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        tasks: {
          where: {
            deletedAt: null,
          },
        },
        risks: true,
        issues: true,
        changeRequests: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Calculate detailed statistics for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        // Get task statistics
        const tasks = project.tasks || []
        const tasksByStatus = {
          todo: tasks.filter(t => t.status === 'TODO').length,
          inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
          inReview: tasks.filter(t => t.status === 'IN_REVIEW').length,
          blocked: tasks.filter(t => t.status === 'BLOCKED').length,
          done: tasks.filter(t => t.status === 'DONE').length,
        }

        const totalTasks = tasks.length
        const completedTasks = tasksByStatus.done
        const taskCompletionRate = totalTasks > 0 
          ? Math.round((completedTasks / totalTasks) * 100) 
          : 0

        // Calculate overdue tasks
        const now = new Date()
        const overdueTasks = tasks.filter(task => {
          if (!task.dueDate || task.status === 'DONE') return false
          return new Date(task.dueDate) < now
        }).length

        // Calculate delays (tasks past due date)
        const delayedTasks = tasks.filter(task => {
          if (!task.dueDate || task.status === 'DONE') return false
          const dueDate = new Date(task.dueDate)
          const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          return daysOverdue > 0
        })

        // Risk statistics
        const risks = project.risks || []
        const criticalRisks = risks.filter(r => r.level === 'CRITICAL').length
        const highRisks = risks.filter(r => r.level === 'HIGH').length
        const activeRisks = risks.filter(r => r.status === 'IDENTIFIED' || r.status === 'ACTIVE').length

        // Issue statistics
        const issues = project.issues || []
        const openIssues = issues.filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length
        const criticalIssues = issues.filter(i => i.severity === 'CRITICAL').length

        // Budget information
        const budget = typeof project.budget === 'object' && project.budget !== null
          ? project.budget as any
          : { total: 0, spent: 0, committed: 0 }
        
        const budgetUtilization = budget.total > 0
          ? Math.round((budget.spent / budget.total) * 100)
          : 0

        // Calculate timeline/date information
        const startDate = new Date(project.startDate)
        const endDate = new Date(project.endDate)
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        const isOverdue = daysRemaining < 0
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const timelineProgress = totalDays > 0
          ? Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)))
          : 0

        // User's role in project
        const isManager = project.managerId === userId
        const isMember = project.teamMembers.some(tm => tm.userId === userId)
        const userRole = isManager ? 'manager' : isMember ? 'member' : 'viewer'

        return {
          id: project.id,
          name: project.name,
          code: project.code,
          description: project.description,
          status: project.status,
          ragStatus: project.ragStatus,
          progress: project.progress,
          startDate: project.startDate,
          endDate: project.endDate,
          budget,
          manager: project.manager,
          program: project.program,
          teamMembers: project.teamMembers.map(tm => tm.user),
          userRole,
          // Statistics
          stats: {
            tasks: {
              total: totalTasks,
              completed: completedTasks,
              inProgress: tasksByStatus.inProgress,
              blocked: tasksByStatus.blocked,
              overdue: overdueTasks,
              delayed: delayedTasks.length,
              completionRate: taskCompletionRate,
              byStatus: tasksByStatus,
            },
            risks: {
              total: risks.length,
              active: activeRisks,
              critical: criticalRisks,
              high: highRisks,
            },
            issues: {
              total: issues.length,
              open: openIssues,
              critical: criticalIssues,
            },
            budget: {
              total: budget.total,
              spent: budget.spent,
              committed: budget.committed,
              utilization: budgetUtilization,
            },
            timeline: {
              daysRemaining,
              isOverdue,
              timelineProgress,
              totalDays,
              daysElapsed,
            },
          },
          // Raw data for charts
          tasks: tasks.map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate,
            assigneeId: t.assigneeId,
            estimatedHours: t.estimatedHours,
            actualHours: t.actualHours,
          })),
          risks: risks.map(r => ({
            id: r.id,
            title: r.title,
            level: r.level,
            status: r.status,
            probability: r.probability,
            impact: r.impact,
          })),
          issues: issues.map(i => ({
            id: i.id,
            title: i.title,
            status: i.status,
            severity: i.severity,
            priority: i.priority,
          })),
          changeRequests: (project.changeRequests || []).map(cr => ({
            id: cr.id,
            title: cr.title,
            status: cr.status,
            priority: cr.priority,
            requestedDate: cr.requestedDate,
          })),
        }
      })
    )

    // Fetch approvals for all projects (for actions taken tracking)
    const allProjectIds = projectsWithStats.map(p => p.id)
    const approvals = await prisma.approval.findMany({
      where: {
        tenantId: session.user.tenantId,
        entityId: {
          in: allProjectIds,
        },
        entityType: 'project',
      },
      include: {
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approvers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate overall dashboard statistics
    const totalProjects = projectsWithStats.length
    const activeProjects = projectsWithStats.filter(p => p.status === 'IN_PROGRESS').length
    const totalTasks = projectsWithStats.reduce((sum, p) => sum + p.stats.tasks.total, 0)
    const overdueTasks = projectsWithStats.reduce((sum, p) => sum + p.stats.tasks.overdue, 0)
    const totalRisks = projectsWithStats.reduce((sum, p) => sum + p.stats.risks.total, 0)
    const criticalRisks = projectsWithStats.reduce((sum, p) => sum + p.stats.risks.critical, 0)
    const totalIssues = projectsWithStats.reduce((sum, p) => sum + p.stats.issues.total, 0)
    const openIssues = projectsWithStats.reduce((sum, p) => sum + p.stats.issues.open, 0)
    
    // Budget statistics
    const totalBudget = projectsWithStats.reduce((sum, p) => sum + (p.stats.budget.total || 0), 0)
    const totalSpent = projectsWithStats.reduce((sum, p) => sum + (p.stats.budget.spent || 0), 0)
    const totalCommitted = projectsWithStats.reduce((sum, p) => sum + (p.stats.budget.committed || 0), 0)
    
    // Change requests statistics (challenges/actions)
    const totalChangeRequests = projectsWithStats.reduce((sum, p) => sum + (p.changeRequests?.length || 0), 0)
    const pendingChanges = projectsWithStats.reduce((sum, p) => {
      return sum + (p.changeRequests?.filter((cr: any) => cr.status === 'SUBMITTED' || cr.status === 'UNDER_REVIEW').length || 0)
    }, 0)
    const approvedChanges = projectsWithStats.reduce((sum, p) => {
      return sum + (p.changeRequests?.filter((cr: any) => cr.status === 'APPROVED' || cr.status === 'IMPLEMENTED').length || 0)
    }, 0)
    
    // Actions taken (approved/rejected approvals)
    const totalApprovals = approvals.length
    const approvedActions = approvals.filter(a => a.status === 'APPROVED').length
    const rejectedActions = approvals.filter(a => a.status === 'REJECTED').length
    const pendingActions = approvals.filter(a => a.status === 'PENDING').length

    // Get available programs for filtering
    const programs = await prisma.program.findMany({
      where: {
        tenantId: session.user.tenantId,
        projects: {
          some: {
            OR: [
              { managerId: userId },
              { teamMembers: { some: { userId } } },
            ],
          },
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    })

    return NextResponse.json({
      projects: projectsWithStats,
      summary: {
        totalProjects,
        activeProjects,
        totalTasks,
        overdueTasks,
        totalRisks,
        criticalRisks,
        totalIssues,
        openIssues,
        budget: {
          total: totalBudget,
          spent: totalSpent,
          committed: totalCommitted,
          available: totalBudget - totalSpent - totalCommitted,
        },
        changeRequests: {
          total: totalChangeRequests,
          pending: pendingChanges,
          approved: approvedChanges,
        },
        approvals: {
          total: totalApprovals,
          approved: approvedActions,
          rejected: rejectedActions,
          pending: pendingActions,
        },
      },
      approvals,
      programs,
    })
  } catch (error) {
    console.error('Error fetching project dashboard data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

