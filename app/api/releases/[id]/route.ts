import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateReleaseSchema = z.object({
  name: z.string().min(1).optional(),
  version: z.string().min(1).optional(),
  description: z.string().optional(),
  projectId: z.string().optional().nullable(),
  targetDate: z.string().optional(),
  releaseDate: z.string().optional().nullable(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'RELEASED', 'CANCELLED']).optional(),
  progress: z.number().min(0).max(100).optional(),
})

// GET - Fetch single release by ID
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

    const release = await prisma.release.findFirst({
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

    if (!release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 })
    }

    return NextResponse.json({ release })
  } catch (error) {
    console.error('Error fetching release:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update release
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
    const validatedData = updateReleaseSchema.parse(body)

    // Verify release exists and user has access
    const existingRelease = await prisma.release.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingRelease) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 })
    }

    // Verify project exists if projectId is being updated
    if (validatedData.projectId !== undefined && validatedData.projectId !== null) {
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

    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.version !== undefined) updateData.version = validatedData.version
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.projectId !== undefined) updateData.projectId = validatedData.projectId
    if (validatedData.targetDate !== undefined) updateData.targetDate = new Date(validatedData.targetDate)
    if (validatedData.releaseDate !== undefined) {
      updateData.releaseDate = validatedData.releaseDate ? new Date(validatedData.releaseDate) : null
    }
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.progress !== undefined) updateData.progress = validatedData.progress

    const release = await prisma.release.update({
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

    return NextResponse.json({ release })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating release:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete release
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

    // Verify release exists and user has access
    const release = await prisma.release.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 })
    }

    // Remove releaseId from all tasks
    await prisma.task.updateMany({
      where: {
        releaseId: id,
      },
      data: {
        releaseId: null,
      },
    })

    // Delete the release
    await prisma.release.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Release deleted successfully' })
  } catch (error) {
    console.error('Error deleting release:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

