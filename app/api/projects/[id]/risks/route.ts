import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const projectId = params.id

        // Get project to verify access and tenant
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { tenantId: true }
        })

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        // Verify user has access to this tenant
        if (project.tenantId !== session.user.tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Fetch risks for this project
        const risks = await prisma.risk.findMany({
            where: {
                projectId: projectId,
                tenantId: session.user.tenantId
            },
            include: {
                owner: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({ risks })
    } catch (error) {
        console.error('Error fetching risks:', error)
        return NextResponse.json(
            { error: 'Failed to fetch risks' },
            { status: 500 }
        )
    }
}

