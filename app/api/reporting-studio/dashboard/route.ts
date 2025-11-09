import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, charts, layout, pageBackgroundColor, activeFilters } = body

        if (!name || !charts) {
            return NextResponse.json({ error: 'Name and charts are required' }, { status: 400 })
        }

        const userId = session.user.id

        // Save dashboard
        const dashboard = await prisma.reportingDashboard.create({
            data: {
                name,
                configuration: {
                    charts,
                    layout,
                    pageBackgroundColor,
                    activeFilters
                },
                createdBy: userId,
                updatedBy: userId
            }
        })

        return NextResponse.json({ 
            success: true, 
            dashboard: {
                id: dashboard.id,
                name: dashboard.name
            }
        })
    } catch (error) {
        console.error('Error saving dashboard:', error)
        return NextResponse.json({ error: 'Failed to save dashboard' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get all dashboards
        const dashboards = await prisma.reportingDashboard.findMany({
            where: {
                deletedAt: null
            },
            orderBy: {
                updatedAt: 'desc'
            },
            select: {
                id: true,
                name: true,
                configuration: true,
                createdAt: true,
                updatedAt: true,
                createdByUser: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })

        return NextResponse.json({ dashboards })
    } catch (error) {
        console.error('Error fetching dashboards:', error)
        return NextResponse.json({ error: 'Failed to fetch dashboards' }, { status: 500 })
    }
}

