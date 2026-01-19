import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// GET - List IT projects
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'it', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const search = searchParams.get('search')

        const where: any = {
          tenantId: userInfo.tenantId,
          deletedAt: null,
          workflowType: 'SOFTWARE_DEVELOPMENT', // IT projects
        }

        if (status && status !== 'all') {
          where.status = status
        }

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ]
        }

        const projects = await prisma.project.findMany({
          where,
          include: {
            manager: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            teamMembers: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        // Format projects for IT dashboard
        const formattedProjects = projects.map((project) => ({
          id: project.id,
          name: project.name,
          description: project.description || '',
          status: project.status,
          priority: project.ragStatus === 'RED' ? 'HIGH' : project.ragStatus === 'YELLOW' ? 'MEDIUM' : 'LOW',
          startDate: project.startDate.toISOString().split('T')[0],
          endDate: project.endDate.toISOString().split('T')[0],
          progress: project.progress || 0,
          manager: project.manager?.name || 'Unassigned',
          teamMembers: project.teamMembers.map((tm) => tm.user.name),
        }))

        return NextResponse.json({
          projects: formattedProjects,
        })
      } catch (error) {
        console.error('Error fetching IT projects:', error)
        return NextResponse.json(
          { error: 'Failed to fetch projects' },
          { status: 500 }
        )
      }
    }
  )
}

