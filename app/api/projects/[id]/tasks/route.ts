import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Helper to map WBS status to Task status
const mapWBSStatus = (wbsStatus: string): string => {
  const mapping: Record<string, string> = {
    'Pending': 'TODO',
    'In Progress': 'IN_PROGRESS',
    'Completed': 'DONE',
    'On Hold': 'BLOCKED',
  }
  return mapping[wbsStatus] || 'TODO'
}

// Helper to flatten WBS tasks (including subtasks)
const flattenWBSTasks = (wbsTasks: any[], parentId: string | null = null): any[] => {
  let flattened: any[] = []
  
  for (const wbs of wbsTasks) {
    // Add the main task
    const taskTitle = [wbs.milestone, wbs.task, wbs.subtask].filter(Boolean).join(' - ')
    if (taskTitle) {
      flattened.push({
        id: wbs.id,
        title: taskTitle,
        status: mapWBSStatus(wbs.status),
        startDate: wbs.start ? new Date(wbs.start) : null,
        dueDate: wbs.end ? new Date(wbs.end) : null,
        parentId: parentId,
        tags: wbs.milestone ? ['MILESTONE'] : [],
        progress: wbs.status === 'Completed' ? 100 : wbs.status === 'In Progress' ? 50 : 0,
      })
    }
    
    // Add subtasks recursively
    if (wbs.subtasks && wbs.subtasks.length > 0) {
      flattened = [...flattened, ...flattenWBSTasks(wbs.subtasks, wbs.id)]
    }
  }
  
  return flattened
}

// GET - Fetch all tasks for a project (including subtasks and milestones)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        planningData: true, // Include planning data to get WBS tasks
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify user belongs to the same tenant
    if (project.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch all tasks from Task table
    const tasks = await prisma.task.findMany({
      where: {
        projectId: id,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        startDate: true,
        dueDate: true,
        parentId: true,
        tags: true,
        completedAt: true,
      },
      orderBy: [
        { startDate: 'asc' },
        { title: 'asc' },
      ],
    })

    // Calculate progress for database tasks
    const tasksWithProgress = tasks.map(task => ({
      ...task,
      progress: task.status === 'DONE' ? 100 : task.status === 'IN_PROGRESS' ? 50 : 0,
    }))

    // Extract WBS tasks from planningData JSON
    let wbsTasks: any[] = []
    try {
      const planningData = project.planningData as any
      if (planningData?.deliverableDetails) {
        // Find Work Breakdown Structure deliverable (id: '1')
        const wbsDetail = planningData.deliverableDetails['1']
        if (wbsDetail?.wbsTasks) {
          wbsTasks = flattenWBSTasks(wbsDetail.wbsTasks)
        }
      }
    } catch (error) {
      console.error('Error parsing WBS tasks from planningData:', error)
    }

    // Combine both sources
    const allTasks = [...tasksWithProgress, ...wbsTasks]

    return NextResponse.json({ tasks: allTasks })
  } catch (error) {
    console.error('Error fetching project tasks:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

