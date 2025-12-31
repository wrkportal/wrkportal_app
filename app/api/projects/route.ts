import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { WorkflowType, MethodologyType } from '@/types/index'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

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
  workflowType: z.nativeEnum(WorkflowType).optional(),
  methodologyType: z.nativeEnum(MethodologyType).optional(),
})

// POST - Create new project
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'projects', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
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
        tenantId: userInfo.tenantId,
        managerId: validatedData.managerId || userInfo.userId,
        createdById: userInfo.userId,
        workflowType: validatedData.workflowType || null,
        methodologyType: validatedData.methodologyType || null,
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
  )
}

// GET - Fetch user's projects
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'projects', action: 'READ' },
    async (request, userInfo) => {
      try {
        const tenantId = userInfo.tenantId

    if (!tenantId) {
      console.warn('No tenantId found for user, returning empty projects array')
      return NextResponse.json({ projects: [] })
    }

      try {
        // Admin users can see all projects, others see only their projects
        const isAdmin = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN', 'PMO_LEAD'].includes(userInfo.role as string)
        
        // Optional workflow filter
        const { searchParams } = new URL(request.url)
      const workflowType = searchParams.get('workflowType') as WorkflowType | null

      const projects = await prisma.project.findMany({
        where: {
          tenantId: tenantId,
          deletedAt: null,
          ...(workflowType ? { workflowType } : {}),
          ...(isAdmin ? {} : {
            // Non-admin users: only show projects where they're manager or member
            OR: [
              { managerId: userInfo.userId },
              { teamMembers: { some: { userId: userInfo.userId } } },
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
      } catch (dbError: any) {
        // Handle case where Project table might not exist yet or relation issues
        if (dbError.code === 'P2001' || 
            dbError.code === 'P2017' || 
            dbError.message?.includes('does not exist') || 
            dbError.message?.includes('Unknown model') ||
            dbError.message?.includes('relation') ||
            dbError.message?.includes('teamMembers')) {
          console.warn('Project table or relations not found, returning empty array:', dbError.message)
          return NextResponse.json({ projects: [] })
        }
        throw dbError
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      // Return empty array instead of 500 to prevent UI errors
      return NextResponse.json({ projects: [] })
    }
  })
}
