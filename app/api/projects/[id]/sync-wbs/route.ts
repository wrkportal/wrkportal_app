import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { logTaskCreated, getIpAddress, getUserAgent } from '@/lib/audit/logger'

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

// Recursively sync WBS tasks to database
async function syncWBSTasksRecursive(
  wbsTasks: any[],
  projectId: string,
  tenantId: string,
  createdById: string,
  request: NextRequest,
  parentTaskId: string | null = null
): Promise<{ created: number; updated: number; errors: string[] }> {
  let created = 0
  let updated = 0
  const errors: string[] = []

  for (const wbsTask of wbsTasks) {
    try {
      // Build task title from WBS fields
      const titleParts = [wbsTask.milestone, wbsTask.task, wbsTask.subtask].filter(Boolean)
      if (titleParts.length === 0) {
        continue // Skip tasks without any title
      }
      const title = titleParts.join(' - ')

      // Determine if this is a milestone
      const isMilestone = Boolean(wbsTask.milestone)
      const tags = isMilestone ? ['MILESTONE'] : []

      // Check if task already exists (by sourceId)
      const existingTask = await prisma.task.findFirst({
        where: {
          sourceType: 'WBS',
          sourceId: wbsTask.id,
          projectId: projectId,
        },
      })

      // Validate assigneeId exists in database before using it
      let validAssigneeId = null
      if (wbsTask.assignedTo) {
        const assigneeExists = await prisma.user.findUnique({
          where: { id: wbsTask.assignedTo },
          select: { id: true },
        })
        if (assigneeExists) {
          validAssigneeId = wbsTask.assignedTo
        }
      }

      const taskData = {
        title,
        description: wbsTask.dependency || null,
        status: mapWBSStatus(wbsTask.status) as any,
        startDate: wbsTask.start ? new Date(wbsTask.start) : null,
        dueDate: wbsTask.end ? new Date(wbsTask.end) : null,
        assigneeId: validAssigneeId,
        tags,
        parentId: parentTaskId,
      }

      if (existingTask) {
        // Update existing task
        await prisma.task.update({
          where: { id: existingTask.id },
          data: taskData,
        })
        updated++
      } else {
        // Create new task
        const newTask = await prisma.task.create({
          data: {
            ...taskData,
            tenantId,
            projectId,
            createdById,
            sourceType: 'WBS',
            sourceId: wbsTask.id,
            priority: 'MEDIUM',
          },
        })

        created++

        // Log task creation to audit log
        await logTaskCreated({
          tenantId,
          userId: createdById,
          taskId: newTask.id,
          taskTitle: title,
          ipAddress: getIpAddress(request),
          userAgent: getUserAgent(request),
        })

        // Recursively sync subtasks
        if (wbsTask.subtasks && wbsTask.subtasks.length > 0) {
          const subtaskResult = await syncWBSTasksRecursive(
            wbsTask.subtasks,
            projectId,
            tenantId,
            createdById,
            request,
            newTask.id // This task becomes the parent
          )
          created += subtaskResult.created
          updated += subtaskResult.updated
          errors.push(...subtaskResult.errors)
        }
      }
    } catch (error) {
      const errorMsg = `Failed to sync task ${wbsTask.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      errors.push(errorMsg)
      console.error(errorMsg)
    }
  }

  return { created, updated, errors }
}

// POST - Sync WBS tasks from planningData to Task table
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        tenantId: true,
        planningData: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify user belongs to the same tenant
    if (project.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Extract WBS tasks from planningData
    const planningData = project.planningData as any
    if (!planningData?.deliverableDetails) {
      return NextResponse.json(
        { error: 'No planning data found' },
        { status: 400 }
      )
    }

    const wbsDetail = planningData.deliverableDetails['1']
    if (!wbsDetail?.wbsTasks || wbsDetail.wbsTasks.length === 0) {
      return NextResponse.json(
        { message: 'No WBS tasks to sync', created: 0, updated: 0 },
        { status: 200 }
      )
    }

    // Sync all WBS tasks
    const result = await syncWBSTasksRecursive(
      wbsDetail.wbsTasks,
      projectId,
      project.tenantId,
      session.user.id,
      req
    )

    console.log('✅ WBS Sync complete:', result)

    return NextResponse.json({
      success: true,
      message: `Synced ${result.created + result.updated} tasks`,
      created: result.created,
      updated: result.updated,
      errors: result.errors,
    })
  } catch (error) {
    console.error('❌ Error syncing WBS tasks:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

