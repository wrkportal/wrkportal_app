/**
 * Data Access Layer for AI Tools
 * Fetches real data from PostgreSQL database for AI analysis
 */

import { prisma } from '@/lib/prisma'

/**
 * Fetch comprehensive project data for AI analysis
 */
export async function getProjectDataForAI(projectId: string, tenantId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      tenantId,
      deletedAt: null,
    },
    include: {
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
        },
      },
      teamMembers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              skills: {
                include: {
                  skill: true,
                },
              },
            },
          },
        },
      },
      tasks: {
        where: { deletedAt: null },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      risks: true,
      issues: true,
      changeRequests: true,
      timesheets: {
        where: {
          status: 'APPROVED',
        },
      },
    },
  })

  return project
}

/**
 * Get all projects for a tenant with summary data
 */
export async function getAllProjectsForAI(tenantId: string) {
  const projects = await prisma.project.findMany({
    where: {
      tenantId,
      deletedAt: null,
    },
    include: {
      manager: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
        },
      },
      tasks: {
        where: { deletedAt: null },
        select: {
          id: true,
          status: true,
          priority: true,
          dueDate: true,
        },
      },
      risks: {
        select: {
          id: true,
          level: true,
          status: true,
        },
      },
      issues: {
        select: {
          id: true,
          severity: true,
          status: true,
        },
      },
    },
  })

  return projects
}

/**
 * Get tasks with all details for AI analysis
 */
export async function getTasksForAI(tenantId: string, filters?: {
  projectId?: string
  assigneeId?: string
  status?: string
}) {
  const tasks = await prisma.task.findMany({
    where: {
      tenantId,
      deletedAt: null,
      ...(filters?.projectId && { projectId: filters.projectId }),
      ...(filters?.assigneeId && { assigneeId: filters.assigneeId }),
      ...(filters?.status && { status: filters.status as any }),
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          skills: {
            include: {
              skill: true,
            },
          },
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
        },
      },
      comments: {
        include: {
          user: {
            select: {
              name: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      timeTrackings: true,
    },
  })

  return tasks
}

/**
 * Get team members with skills for task assignment
 */
export async function getTeamMembersForAI(tenantId: string, projectId?: string) {
  const where: any = {
    tenantId,
    status: 'ACTIVE',
  }

  if (projectId) {
    // Get team members assigned to this project
    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId },
      select: { userId: true },
    })
    where.id = { in: projectMembers.map((pm: any) => pm.userId) }
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      skills: {
        include: {
          skill: {
            select: {
              name: true,
              category: true,
            },
          },
        },
      },
      assignedTasks: {
        where: {
          status: { in: ['TODO', 'IN_PROGRESS'] },
          deletedAt: null,
        },
        select: {
          id: true,
          priority: true,
          estimatedHours: true,
        },
      },
      teamMemberships: {
        where: {
          leftAt: null,
        },
        select: {
          projectId: true,
          allocation: true,
        },
      },
    },
  })

  return users
}

/**
 * Get OKRs (Goals and Key Results) for AI analysis
 */
export async function getOKRsForAI(tenantId: string, goalId?: string) {
  const goals = await prisma.goal.findMany({
    where: {
      tenantId,
      ...(goalId && { id: goalId }),
      status: { in: ['ACTIVE', 'DRAFT'] },
    },
    include: {
      keyResults: {
        include: {
          checkIns: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      },
    },
  })

  return goals
}

/**
 * Get budget and spending data for forecasting
 */
export async function getBudgetDataForAI(projectId: string, tenantId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      code: true,
      budget: true,
      startDate: true,
      endDate: true,
      progress: true,
      status: true,
      timesheets: {
        where: { status: 'APPROVED' },
        select: {
          date: true,
          hours: true,
          billable: true,
        },
        orderBy: { date: 'asc' },
      },
      changeRequests: {
        where: { status: 'APPROVED' },
        select: {
          impact: true,
          approvedDate: true,
        },
      },
    },
  })

  return project
}

/**
 * Get project risks for risk prediction analysis
 */
export async function getRisksForAI(projectId: string, tenantId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      description: true,
      startDate: true,
      endDate: true,
      budget: true,
      progress: true,
      status: true,
      ragStatus: true,
      risks: {
        orderBy: { createdAt: 'desc' },
      },
      issues: {
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      },
      tasks: {
        where: { deletedAt: null },
        select: {
          status: true,
          priority: true,
          dueDate: true,
        },
      },
      teamMembers: {
        where: { leftAt: null },
        select: {
          allocation: true,
        },
      },
    },
  })

  return project
}

/**
 * Search across all project data (for semantic search)
 */
export async function searchProjectDataForAI(tenantId: string, query: string) {
  // Search in projects
  const projects = await prisma.project.findMany({
    where: {
      tenantId,
      deletedAt: null,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { code: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      description: true,
      code: true,
      status: true,
      manager: {
        select: { name: true, firstName: true, lastName: true },
      },
    },
    take: 10,
  })

  // Search in tasks
  const tasks = await prisma.task.findMany({
    where: {
      tenantId,
      deletedAt: null,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      project: {
        select: { name: true },
      },
      assignee: {
        select: { name: true, firstName: true, lastName: true },
      },
    },
    take: 10,
  })

  // Search in comments
  const comments = await prisma.taskComment.findMany({
    where: {
      content: { contains: query, mode: 'insensitive' },
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      task: {
        select: {
          title: true,
          project: {
            select: { name: true },
          },
        },
      },
      user: {
        select: { name: true, firstName: true, lastName: true },
      },
    },
    take: 10,
  })

  return { projects, tasks, comments }
}

/**
 * Get project activity for anomaly detection
 */
export async function getProjectActivityForAI(
  projectId: string,
  tenantId: string,
  daysBack: number = 30
) {
  const sinceDate = new Date()
  sinceDate.setDate(sinceDate.getDate() - daysBack)

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      tenantId,
      deletedAt: null,
    },
    include: {
      tasks: {
        where: {
          deletedAt: null,
          updatedAt: { gte: sinceDate },
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      timesheets: {
        where: {
          date: { gte: sinceDate },
        },
        select: {
          date: true,
          hours: true,
          userId: true,
        },
      },
      risks: {
        where: {
          updatedAt: { gte: sinceDate },
        },
      },
      issues: {
        where: {
          reportedDate: { gte: sinceDate },
        },
      },
      changeRequests: {
        where: {
          requestedDate: { gte: sinceDate },
        },
      },
    },
  })

  return project
}

/**
 * Get historical data for status report generation
 */
export async function getProjectHistoryForReport(
  projectId: string,
  tenantId: string,
  periodStart: Date,
  periodEnd: Date
) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      tenantId,
      deletedAt: null,
    },
    include: {
      manager: {
        select: { name: true, firstName: true, lastName: true },
      },
      tasks: {
        where: {
          deletedAt: null,
          OR: [
            { completedAt: { gte: periodStart, lte: periodEnd } },
            { createdAt: { gte: periodStart, lte: periodEnd } },
          ],
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          completedAt: true,
          assignee: {
            select: { name: true, firstName: true, lastName: true },
          },
        },
      },
      risks: {
        where: {
          identifiedDate: { gte: periodStart, lte: periodEnd },
        },
      },
      issues: {
        where: {
          reportedDate: { gte: periodStart, lte: periodEnd },
        },
      },
      timesheets: {
        where: {
          date: { gte: periodStart, lte: periodEnd },
        },
      },
    },
  })

  return project
}

