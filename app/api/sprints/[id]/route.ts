import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSprintSchema = z.object({
  name: z.string().min(1).optional(),
  goal: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  progress: z.number().min(0).max(100).optional(),
  storyPoints: z.number().optional(),
  velocity: z.number().optional(),
})

// GET - Fetch single sprint by ID
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

    const sprint = await prisma.sprint.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
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
          where: {
            deletedAt: null,
          },
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    if (!sprint) {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
    }

    return NextResponse.json({ sprint })
  } catch (error) {
    console.error('Error fetching sprint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update sprint
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const validatedData = updateSprintSchema.parse(body)

    // Verify sprint exists and user has access
    const existingSprint = await prisma.sprint.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingSprint) {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.goal !== undefined) updateData.goal = validatedData.goal
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.startDate !== undefined) updateData.startDate = new Date(validatedData.startDate)
    if (validatedData.endDate !== undefined) updateData.endDate = new Date(validatedData.endDate)
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.progress !== undefined) updateData.progress = validatedData.progress
    if (validatedData.storyPoints !== undefined) updateData.storyPoints = validatedData.storyPoints
    if (validatedData.velocity !== undefined) updateData.velocity = validatedData.velocity

    const sprint = await prisma.sprint.update({
      where: { id },
      data: updateData,
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
    })

    return NextResponse.json({ sprint })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating sprint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete sprint
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify sprint exists and user has access
    const sprint = await prisma.sprint.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!sprint) {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
    }

    // Remove sprintId from all tasks
    await prisma.task.updateMany({
      where: {
        sprintId: id,
      },
      data: {
        sprintId: null,
      },
    })

    // Delete the sprint
    await prisma.sprint.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Sprint deleted successfully' })
  } catch (error) {
    console.error('Error deleting sprint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

