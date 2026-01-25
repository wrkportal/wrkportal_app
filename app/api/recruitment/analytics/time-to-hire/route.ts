import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/recruitment/analytics/time-to-hire - Get time-to-hire analytics
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '6M' // 1M, 3M, 6M, 1Y

    // Calculate date range
    const now = new Date()
    let startDate: Date
    switch (period) {
      case '1M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        break
      case '3M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        break
      case '6M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        break
      case '1Y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    }

    // Get users created in the period (as proxy for hired candidates)
    // TODO: Replace with RecruitmentCandidate and RecruitmentOffer models
    const users = await prisma.user.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        createdAt: true,
      },
    })

    // For demo purposes, calculate average time-to-hire
    // In real implementation, this would calculate from application date to offer acceptance
    const avgTimeToHire =
      users.length > 0
        ? Math.round(
            users.reduce((sum: number, user: any) => {
              // Simulate time-to-hire (7-45 days)
              const days = Math.floor(Math.random() * 38) + 7
              return sum + days
            }, 0) / users.length
          )
        : 0

    // Time-to-hire by department
    const byDepartment = users.reduce(
      (acc: Record<string, { count: number; totalDays: number }>, user: any) => {
      const dept = user.department || 'Unassigned'
      if (!acc[dept]) {
        acc[dept] = { count: 0, totalDays: 0 }
      }
      acc[dept].count++
      acc[dept].totalDays += Math.floor(Math.random() * 38) + 7
      return acc
      },
      {} as Record<string, { count: number; totalDays: number }>
    )

    const departmentMetrics = (
      Object.entries(byDepartment) as [string, { count: number; totalDays: number }][]
    ).map(([dept, data]) => ({
        department: dept,
        averageDays: Math.round(data.totalDays / data.count),
        hires: data.count,
      }))

    // Time-to-hire trend (monthly)
    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthUsers = users.filter(
        (u: any) =>
          new Date(u.createdAt).getMonth() === date.getMonth() &&
          new Date(u.createdAt).getFullYear() === date.getFullYear()
      )
      const avgDays =
        monthUsers.length > 0
          ? Math.round(
              monthUsers.reduce(
                (sum: number) => sum + (Math.floor(Math.random() * 38) + 7),
                0
              ) / monthUsers.length
            )
          : 0

      monthlyData.push({
        month: date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        averageDays: avgDays,
        hires: monthUsers.length,
      })
    }

    // Stage duration (simulated)
    // TODO: Replace with actual stage duration from RecruitmentCandidate model
    const stageDurations = [
      { stage: 'Applied to Screening', averageDays: 3 },
      { stage: 'Screening to Interview', averageDays: 5 },
      { stage: 'Interview to Offer', averageDays: 7 },
      { stage: 'Offer to Acceptance', averageDays: 4 },
    ]

    return NextResponse.json({
      overall: {
        averageDays: avgTimeToHire,
        totalHires: users.length,
        period,
      },
      byDepartment: departmentMetrics,
      trend: monthlyData,
      stageDurations,
    })
  } catch (error: any) {
    console.error('Error fetching time-to-hire analytics:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch time-to-hire analytics',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
