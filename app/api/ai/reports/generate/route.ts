import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getProjectHistoryForReport } from '@/lib/ai/data-access'
import { generateStatusReport } from '@/lib/ai/services/status-report-generator'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      projectId, 
      projectName, 
      reportingPeriod, 
      accomplishments, 
      challenges, 
      upcomingWork, 
      teamMembers 
    } = body

    let report

    // If projectId provided, fetch real data
    if (projectId) {
      // Calculate period dates (e.g., last 7 days, last month)
      const periodEnd = new Date()
      const periodStart = new Date()
      periodStart.setDate(periodStart.getDate() - 30) // Default to last 30 days

      type ProjectWithHistory = Prisma.ProjectGetPayload<{
        include: {
          manager: {
            select: {
              name: true
              firstName: true
              lastName: true
            }
          }
          tasks: {
            select: {
              id: true
              title: true
              status: true
              priority: true
              completedAt: true
              assignee: {
                select: {
                  name: true
                  firstName: true
                  lastName: true
                }
              }
            }
          }
          risks: true
          issues: true
          timesheets: true
        }
      }>
      
      type TaskWithAssignee = ProjectWithHistory['tasks'][0]
      type Risk = ProjectWithHistory['risks'][0]
      type Issue = ProjectWithHistory['issues'][0]

      const projectData = (await getProjectHistoryForReport(
        projectId,
        session.user.tenantId,
        periodStart,
        periodEnd
      )) as ProjectWithHistory | null

      if (!projectData) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      // Compile accomplishments from completed tasks

      const completedTasks = projectData.tasks.filter((t: TaskWithAssignee) => t.status === 'DONE')
      const accomplishmentsList = completedTasks.map((t: TaskWithAssignee) => 
        `Completed: ${t.title}${t.assignee ? ` (${t.assignee.name || t.assignee.firstName + ' ' + t.assignee.lastName})` : ''}`
      )

      // Identify challenges from issues and risks
      const challengesList = [
        ...projectData.issues.map((i: Issue) => `Issue: ${i.title}`),
        ...projectData.risks.filter((r: Risk) => r.status === 'ACTIVE').map((r: Risk) => `Risk: ${r.title}`),
      ]

      // Transform data to match StatusReportData interface
      // Create Project object
      const project = {
        id: projectData.id,
        tenantId: projectData.tenantId,
        name: projectData.name,
        description: projectData.description || '',
        code: projectData.code || '',
        status: projectData.status as any,
        ragStatus: projectData.ragStatus as any,
        ownerId: projectData.ownerId || '',
        managerId: projectData.managerId || '',
        teamMembers: [],
        startDate: projectData.startDate || new Date(),
        endDate: projectData.endDate || new Date(),
        plannedStartDate: projectData.plannedStartDate || new Date(),
        plannedEndDate: projectData.plannedEndDate || new Date(),
        budget: {} as any,
        progress: projectData.progress || 0,
        tags: [],
        metadata: {},
        createdAt: projectData.createdAt || new Date(),
        updatedAt: projectData.updatedAt || new Date(),
      }

      // Transform tasks to Task[] format
      const tasks = projectData.tasks.map((t: TaskWithAssignee) => ({
        id: t.id,
        projectId: projectData.id,
        title: t.title,
        status: t.status as any,
        priority: (t.priority || 'MEDIUM') as any,
        assigneeId: undefined,
        reporterId: '',
        completedAt: t.completedAt || undefined,
        dueDate: undefined,
        tags: [],
        checklist: [],
        dependencies: [],
        attachments: [],
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      // Transform risks to Risk[] format
      const risks = projectData.risks.map((r: Risk) => ({
        id: r.id,
        projectId: projectData.id,
        title: r.title,
        description: r.description || '',
        category: (r.category || 'TECHNICAL') as any,
        probability: r.probability || 3,
        impact: r.impact || 3,
        score: (r.probability || 3) * (r.impact || 3),
        level: (r.level || 'MEDIUM') as any,
        status: (r.status || 'IDENTIFIED') as any,
        mitigation: r.mitigation || '',
        ownerId: r.ownerId || '',
        identifiedDate: r.identifiedDate || new Date(),
        targetDate: r.targetDate || undefined,
        resolvedDate: r.resolvedDate || undefined,
        createdAt: r.createdAt || new Date(),
        updatedAt: r.updatedAt || new Date(),
      }))

      // Transform issues to Issue[] format
      const issues = projectData.issues.map((i: Issue) => ({
        id: i.id,
        projectId: projectData.id,
        title: i.title,
        description: i.description || '',
        severity: (i.severity || 'MEDIUM') as any,
        status: (i.status || 'OPEN') as any,
        ownerId: i.ownerId || '',
        reporterId: i.reporterId || '',
        escalationLevel: i.escalationLevel || 0,
        identifiedDate: i.identifiedDate || new Date(),
        resolvedDate: i.resolvedDate || undefined,
        createdAt: i.createdAt || new Date(),
        updatedAt: i.updatedAt || new Date(),
      }))

      // Extract budget data if available
      const budgetData = projectData.budget ? {
        totalBudget: (projectData.budget as any)?.totalBudget || (projectData.budget as any)?.total || 0,
        spentToDate: (projectData.budget as any)?.spentToDate || (projectData.budget as any)?.spent || 0,
        variance: ((projectData.budget as any)?.totalBudget || (projectData.budget as any)?.total || 0) - 
                  ((projectData.budget as any)?.spentToDate || (projectData.budget as any)?.spent || 0),
      } : undefined

      report = await generateStatusReport({
        project: project as any,
        tasks: tasks as any,
        risks: risks as any,
        issues: issues as any,
        periodStart,
        periodEnd,
        budgetData,
      })
    } else {
      // Use manually provided data
      if (!projectName) {
        return NextResponse.json(
          { error: 'Project name is required' },
          { status: 400 }
        )
      }

      // Create minimal placeholder objects for manual data
      const manualPeriodStart = new Date()
      const manualPeriodEnd = new Date()
      manualPeriodStart.setDate(manualPeriodStart.getDate() - 30)

      const manualProject = {
        id: 'manual-project',
        tenantId: session.user.tenantId,
        name: projectName,
        description: '',
        code: '',
        status: 'IN_PROGRESS' as any,
        ragStatus: 'GREEN' as any,
        ownerId: '',
        managerId: '',
        teamMembers: [],
        startDate: new Date(),
        endDate: new Date(),
        plannedStartDate: new Date(),
        plannedEndDate: new Date(),
        budget: {} as any,
        progress: 0,
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      report = await generateStatusReport({
        project: manualProject as any,
        tasks: [],
        risks: [],
        issues: [],
        periodStart: manualPeriodStart,
        periodEnd: manualPeriodEnd,
      })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Status report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate status report' },
      { status: 500 }
    )
  }
}
