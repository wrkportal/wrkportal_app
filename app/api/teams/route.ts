import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const createTeamSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  members: z.array(z.object({
    userId: z.string(),
    role: z.string(),
  })).optional(),
})

// GET - Fetch teams
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const whereClause: any = {
      tenantId: session.user.tenantId,
    }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    const teams = await prisma.team.findMany({
      where: whereClause,
      include: {
        members: {
          where: {
            leftAt: null, // Only active members
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get project counts for each team (count projects where team members are assigned)
    type TeamWithMembers = Prisma.TeamGetPayload<{
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true
                firstName: true
                lastName: true
                email: true
                avatar: true
              }
            }
          }
        }
      }
    }>

    type TeamMember = TeamWithMembers['members'][0]

    const teamsWithStats = await Promise.all(
      (teams as TeamWithMembers[]).map(async (team: TeamWithMembers) => {
        // Get all user IDs in this team
        const userIds = team.members.map((m: TeamMember) => m.user.id)
        
        // Count projects where these users are team members
        const projectCount = await prisma.project.count({
          where: {
            tenantId: session.user.tenantId,
            deletedAt: null,
            teamMembers: {
              some: {
                userId: { in: userIds },
              },
            },
          },
        })

        // Count tasks assigned to team members
        const taskCounts = await prisma.task.count({
          where: {
            tenantId: session.user.tenantId,
            deletedAt: null,
            assigneeId: { in: userIds },
          },
        })

        return {
          id: team.id,
          name: team.name,
          description: team.description || '',
          department: team.department || undefined,
          status: team.status,
          createdAt: team.createdAt.toISOString().split('T')[0],
          projects: projectCount,
          members: team.members.map((m: TeamMember) => ({
            id: m.user.id,
            firstName: m.user.firstName || '',
            lastName: m.user.lastName || '',
            email: m.user.email,
            role: m.role,
            avatar: m.user.avatar || undefined,
            allocation: 100, // Default allocation
            projects: 0, // Could be calculated if needed
            tasks: 0, // Could be calculated if needed
          })),
        }
      })
    )

    return NextResponse.json({ teams: teamsWithStats })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new team
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createTeamSchema.parse(body)

    // Create team
    const team = await prisma.team.create({
      data: {
        tenantId: session.user.tenantId,
        name: validatedData.name,
        description: validatedData.description,
        department: validatedData.department,
        status: validatedData.status || 'ACTIVE',
        members: validatedData.members ? {
          create: validatedData.members.map((m) => ({
            userId: m.userId,
            role: m.role,
          })),
        } : undefined,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

