import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSprintSchema = z.object({
  name: z.string().min(1),
  goal: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  storyPoints: z.number().optional(),
})

// GET - Fetch sprints
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')

    const whereClause: any = {
      tenantId: session.user.tenantId,
    }

    if (projectId) {
      whereClause.projectId = projectId
    }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    const sprints = await prisma.sprint.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        tasks: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            status: true,
            estimatedHours: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    })

    // Calculate progress and stats for each sprint
    const sprintsWithStats = sprints.map((sprint: any) => {
      const tasks = sprint.tasks || []
      const totalTasks = tasks.length
      const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      
      // Calculate story points (if tasks have estimatedHours, use that as proxy)
      const totalStoryPoints = sprint.storyPoints || tasks.length
      const completedStoryPoints = Math.round((completedTasks / totalTasks) * totalStoryPoints) || 0
      
      // Calculate velocity (only for completed sprints)
      const velocity = sprint.status === 'COMPLETED' ? completedStoryPoints : null

      return {
        ...sprint,
        progress,
        totalTasks,
        completedTasks,
        completedStoryPoints,
        velocity: velocity || 0,
      }
    })

    return NextResponse.json({ sprints: sprintsWithStats })
  } catch (error) {
    console.error('Error fetching sprints:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new sprint
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createSprintSchema.parse(body)

    // Verify project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const sprint = await prisma.sprint.create({
      data: {
        tenantId: session.user.tenantId,
        projectId: validatedData.projectId,
        name: validatedData.name,
        goal: validatedData.goal,
        description: validatedData.description,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        status: validatedData.status || 'PLANNED',
        progress: 0,
        storyPoints: validatedData.storyPoints || 0,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json({ sprint }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating sprint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

