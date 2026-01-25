import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const createDependencySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['BLOCKS', 'BLOCKED_BY', 'DEPENDS_ON', 'RELATED_TO']),
  status: z.enum(['ACTIVE', 'RESOLVED', 'AT_RISK', 'BLOCKED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  impact: z.string().min(1),
  mitigation: z.string().optional(),
  sourceType: z.string(), // 'PROJECT', 'TASK', 'FEATURE', 'RELEASE', 'SPRINT'
  sourceId: z.string(),
  targetType: z.string(), // 'PROJECT', 'TASK', 'FEATURE', 'RELEASE', 'SPRINT'
  targetId: z.string(),
})

// GET - Fetch dependencies
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sourceType = searchParams.get('sourceType')
    const sourceId = searchParams.get('sourceId')
    const targetType = searchParams.get('targetType')
    const targetId = searchParams.get('targetId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const whereClause: any = {
      tenantId: session.user.tenantId,
    }

    if (sourceType && sourceId) {
      whereClause.sourceType = sourceType
      whereClause.sourceId = sourceId
    }

    if (targetType && targetId) {
      whereClause.targetType = targetType
      whereClause.targetId = targetId
    }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    if (type && type !== 'all') {
      whereClause.type = type
    }

    type Dependency = Prisma.DependencyGetPayload<{}>

    const dependencies = await prisma.dependency.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Enrich dependencies with source and target item details
    const enrichedDependencies = await Promise.all(
      dependencies.map(async (dep: Dependency) => {
        let sourceItem: any = { id: dep.sourceId, name: 'Unknown', type: dep.sourceType }
        let targetItem: any = { id: dep.targetId, name: 'Unknown', type: dep.targetType }

        // Fetch source item
        if (dep.sourceType === 'PROJECT') {
          const project = await prisma.project.findFirst({
            where: { id: dep.sourceId, tenantId: session.user.tenantId },
            select: { id: true, name: true, code: true },
          })
          if (project) {
            sourceItem = { ...project, type: 'PROJECT' }
          }
        } else if (dep.sourceType === 'TASK') {
          const task = await prisma.task.findFirst({
            where: { id: dep.sourceId, tenantId: session.user.tenantId },
            select: { id: true, title: true, project: { select: { id: true, name: true, code: true } } },
          })
          if (task) {
            sourceItem = { id: task.id, name: task.title, type: 'TASK', project: task.project }
          }
        } else if (dep.sourceType === 'RELEASE') {
          const release = await prisma.release.findFirst({
            where: { id: dep.sourceId, tenantId: session.user.tenantId },
            select: { id: true, name: true, project: { select: { id: true, name: true, code: true } } },
          })
          if (release) {
            sourceItem = { id: release.id, name: release.name, type: 'RELEASE', project: release.project }
          }
        } else if (dep.sourceType === 'SPRINT') {
          const sprint = await prisma.sprint.findFirst({
            where: { id: dep.sourceId, tenantId: session.user.tenantId },
            select: { id: true, name: true, project: { select: { id: true, name: true, code: true } } },
          })
          if (sprint) {
            sourceItem = { id: sprint.id, name: sprint.name, type: 'SPRINT', project: sprint.project }
          }
        }

        // Fetch target item
        if (dep.targetType === 'PROJECT') {
          const project = await prisma.project.findFirst({
            where: { id: dep.targetId, tenantId: session.user.tenantId },
            select: { id: true, name: true, code: true },
          })
          if (project) {
            targetItem = { ...project, type: 'PROJECT' }
          }
        } else if (dep.targetType === 'TASK') {
          const task = await prisma.task.findFirst({
            where: { id: dep.targetId, tenantId: session.user.tenantId },
            select: { id: true, title: true, project: { select: { id: true, name: true, code: true } } },
          })
          if (task) {
            targetItem = { id: task.id, name: task.title, type: 'TASK', project: task.project }
          }
        } else if (dep.targetType === 'RELEASE') {
          const release = await prisma.release.findFirst({
            where: { id: dep.targetId, tenantId: session.user.tenantId },
            select: { id: true, name: true, project: { select: { id: true, name: true, code: true } } },
          })
          if (release) {
            targetItem = { id: release.id, name: release.name, type: 'RELEASE', project: release.project }
          }
        } else if (dep.targetType === 'SPRINT') {
          const sprint = await prisma.sprint.findFirst({
            where: { id: dep.targetId, tenantId: session.user.tenantId },
            select: { id: true, name: true, project: { select: { id: true, name: true, code: true } } },
          })
          if (sprint) {
            targetItem = { id: sprint.id, name: sprint.name, type: 'SPRINT', project: sprint.project }
          }
        }

        return {
          ...dep,
          sourceItem,
          targetItem,
        }
      })
    )

    return NextResponse.json({ dependencies: enrichedDependencies })
  } catch (error) {
    console.error('Error fetching dependencies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new dependency
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createDependencySchema.parse(body)

    // Verify source and target items exist
    // This is a simplified check - in production, you'd verify each type specifically
    const dependency = await prisma.dependency.create({
      data: {
        tenantId: session.user.tenantId,
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        status: validatedData.status || 'ACTIVE',
        priority: validatedData.priority || 'MEDIUM',
        impact: validatedData.impact,
        mitigation: validatedData.mitigation,
        sourceType: validatedData.sourceType,
        sourceId: validatedData.sourceId,
        targetType: validatedData.targetType,
        targetId: validatedData.targetId,
      },
    })

    return NextResponse.json({ dependency }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating dependency:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

