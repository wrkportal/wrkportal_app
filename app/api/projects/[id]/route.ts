import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { WorkflowType, MethodologyType } from '@/types/index'

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  programId: z.string().nullable().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().optional(),
  status: z
    .enum(['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'])
    .optional(),
  workflowType: z.nativeEnum(WorkflowType).nullable().optional(),
  methodologyType: z.nativeEnum(MethodologyType).nullable().optional(),
})

// GET - Fetch single project by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
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
                avatar: true,
                role: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        risks: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        issues: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await req.json()
    const validatedData = updateProjectSchema.parse(body)

    // Verify project exists and belongs to user's tenant
    const existingProject = await prisma.project.findFirst({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name
    }

    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description
    }

    if (validatedData.programId !== undefined) {
      updateData.programId = validatedData.programId
    }

    if (validatedData.startDate !== undefined) {
      updateData.startDate = new Date(validatedData.startDate)
    }

    if (validatedData.endDate !== undefined) {
      updateData.endDate = new Date(validatedData.endDate)
    }

    if (validatedData.budget !== undefined) {
      // Update the budget JSON field
      const currentBudget = (existingProject.budget as any) || {
        total: 0,
        spent: 0,
        committed: 0,
      }
      updateData.budget = {
        ...currentBudget,
        total: validatedData.budget,
      }
    }

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
    }

    if (validatedData.workflowType !== undefined) {
      updateData.workflowType = validatedData.workflowType
    }

    if (validatedData.methodologyType !== undefined) {
      updateData.methodologyType = validatedData.methodologyType
    }

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ project: updatedProject })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating project:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete a project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Verify project exists and belongs to user's tenant
    const existingProject = await prisma.project.findFirst({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Soft delete: set deletedAt timestamp
    const deletedProject = await prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: session.user.id,
      },
    })

    return NextResponse.json(
      { message: 'Project deleted successfully', project: deletedProject },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
