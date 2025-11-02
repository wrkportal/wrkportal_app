import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createProjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  programId: z.string().optional(),
  managerId: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  budget: z.number().optional(),
  status: z.enum([
    'PLANNED',
    'IN_PROGRESS',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED',
  ]),
})

// POST - Create new project
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createProjectSchema.parse(body)

    // Check if project code already exists
    const existingProject = await prisma.project.findUnique({
      where: { code: validatedData.code },
    })

    if (existingProject) {
      return NextResponse.json(
        { error: 'Project code already exists' },
        { status: 400 }
      )
    }

    // Validate project dates against program dates if program is specified
    if (validatedData.programId) {
      const program = await prisma.program.findUnique({
        where: { id: validatedData.programId },
        select: { startDate: true, endDate: true, name: true },
      })

      if (program) {
        const projectStart = new Date(validatedData.startDate)
        const projectEnd = new Date(validatedData.endDate)
        const programStart = new Date(program.startDate)
        const programEnd = new Date(program.endDate)

        if (projectStart < programStart) {
          return NextResponse.json(
            {
              error: `Project start date must be on or after the program start date (${programStart.toLocaleDateString()})`,
            },
            { status: 400 }
          )
        }

        if (projectEnd > programEnd) {
          return NextResponse.json(
            {
              error: `Project end date must be on or before the program end date (${programEnd.toLocaleDateString()})`,
            },
            { status: 400 }
          )
        }
      }
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description || '',
        programId: validatedData.programId || null,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        budget: {
          total: validatedData.budget || 0,
          spent: 0,
          committed: 0,
        },
        status: validatedData.status,
        ragStatus: 'GREEN',
        progress: 0,
        tenantId: session.user.tenantId,
        managerId: validatedData.managerId || session.user.id,
        createdById: session.user.id,
      },
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

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Fetch user's projects
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin users can see all projects, others see only their projects
    const isAdmin = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN', 'PMO_LEAD'].includes(session.user.role)

    const projects = await prisma.project.findMany({
      where: {
        tenantId: session.user.tenantId,
        deletedAt: null,
        ...(isAdmin ? {} : {
          // Non-admin users: only show projects where they're manager or member
          OR: [
            { managerId: session.user.id },
            { teamMembers: { some: { userId: session.user.id } } },
          ],
        }),
      },
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
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
