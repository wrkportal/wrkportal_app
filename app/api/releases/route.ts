import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createReleaseSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().optional(),
  targetDate: z.string(),
  releaseDate: z.string().optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'RELEASED', 'CANCELLED']).optional(),
})

// GET - Fetch releases
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

    const releases = await prisma.release.findMany({
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
          },
        },
      },
      orderBy: {
        targetDate: 'desc',
      },
    })

    // Calculate progress and counts for each release
    const releasesWithStats = releases.map((release) => {
      const tasks = release.tasks || []
      const totalTasks = tasks.length
      const completedTasks = tasks.filter((t) => t.status === 'DONE').length
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      return {
        ...release,
        progress,
        features: totalTasks,
        bugs: tasks.filter((t) => t.priority === 'CRITICAL' || t.priority === 'HIGH').length,
      }
    })

    return NextResponse.json({ releases: releasesWithStats })
  } catch (error) {
    console.error('Error fetching releases:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new release
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createReleaseSchema.parse(body)

    // Verify project exists and user has access if projectId is provided
    if (validatedData.projectId) {
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
    }

    const release = await prisma.release.create({
      data: {
        tenantId: session.user.tenantId,
        name: validatedData.name,
        version: validatedData.version,
        description: validatedData.description,
        projectId: validatedData.projectId,
        targetDate: new Date(validatedData.targetDate),
        releaseDate: validatedData.releaseDate ? new Date(validatedData.releaseDate) : null,
        status: validatedData.status || 'PLANNED',
        progress: 0,
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

    return NextResponse.json({ release }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating release:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

