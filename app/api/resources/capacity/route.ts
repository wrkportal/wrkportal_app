import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/resources/capacity - Get capacity planning data
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : new Date()
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days default

    // Get all active users
    const users = await prisma.user.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
      include: {
        teamMemberships: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        },
        timesheets: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    })

    // Calculate capacity for each user
    const capacityData = users.map((user) => {
      // Get active project allocations
      const activeProjects = user.teamMemberships.filter((pm) => {
        const project = pm.project
        if (!project.startDate || !project.endDate) return false
        const projectStart = new Date(project.startDate)
        const projectEnd = new Date(project.endDate)
        return projectStart <= endDate && projectEnd >= startDate
      })

      // Calculate total allocation percentage
      const totalAllocation = activeProjects.reduce((sum, pm) => {
        return sum + (Number(pm.allocation) || 0)
      }, 0)

      // Calculate hours logged in period
      const totalHoursLogged = user.timesheets.reduce((sum, ts) => {
        return sum + Number(ts.hours)
      }, 0)

      // Calculate available capacity (100% - allocation)
      const availableCapacity = Math.max(0, 100 - totalAllocation)
      const isOverAllocated = totalAllocation > 100

      // Estimate weekly hours (assuming 40 hours/week standard)
      const weeksInPeriod = Math.max(1, (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
      const estimatedCapacity = weeksInPeriod * 40 * (totalAllocation / 100)

      return {
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        totalAllocation: Math.round(totalAllocation * 10) / 10,
        availableCapacity: Math.round(availableCapacity * 10) / 10,
        isOverAllocated,
        hoursLogged: Math.round(totalHoursLogged * 10) / 10,
        estimatedCapacity: Math.round(estimatedCapacity * 10) / 10,
        activeProjects: activeProjects.map((pm) => ({
          projectId: pm.project.id,
          projectName: pm.project.name,
          allocation: Number(pm.allocation) || 0,
        })),
      }
    })

    // Calculate summary statistics
    const totalResources = capacityData.length
    const overAllocated = capacityData.filter((u) => u.isOverAllocated).length
    const available = capacityData.filter((u) => u.availableCapacity > 20).length // >20% available
    const avgUtilization = capacityData.length > 0
      ? capacityData.reduce((sum, u) => sum + u.totalAllocation, 0) / capacityData.length
      : 0

    // Group by week for heatmap
    const weeklyCapacity: Array<{
      week: string
      date: string
      data: Array<{ userId: string; name: string; allocation: number; available: number }>
    }> = []

    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const weekStart = new Date(currentDate)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week (Sunday)

      const weekData = capacityData.map((user) => ({
        userId: user.userId,
        name: user.name,
        allocation: user.totalAllocation,
        available: user.availableCapacity,
      }))

      weeklyCapacity.push({
        week: `Week of ${weekStart.toLocaleDateString()}`,
        date: weekStart.toISOString().split('T')[0],
        data: weekData,
      })

      currentDate.setDate(currentDate.getDate() + 7) // Move to next week
    }

    return NextResponse.json({
      capacity: capacityData,
      summary: {
        totalResources,
        overAllocated,
        available,
        avgUtilization: Math.round(avgUtilization * 10) / 10,
      },
      weeklyCapacity,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Error fetching capacity data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch capacity data', details: error.message },
      { status: 500 }
    )
  }
}

