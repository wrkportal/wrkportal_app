import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/recruitment/analytics/sources - Get source performance analytics
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

    // Get users created in the period (as proxy for candidates)
    // TODO: Replace with RecruitmentCandidate model with source field
    const users = await prisma.user.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
    })

    // Simulate source distribution for demo
    // TODO: Replace with actual source data from RecruitmentCandidate model
    const sources = [
      { id: 'LINKEDIN', label: 'LinkedIn', color: '#0077b5' },
      { id: 'WEBSITE', label: 'Website', color: '#8884d8' },
      { id: 'REFERRAL', label: 'Referral', color: '#82ca9d' },
      { id: 'JOB_BOARD', label: 'Job Board', color: '#ffc658' },
      { id: 'RECRUITER', label: 'Recruiter', color: '#ff8042' },
    ]

    // Distribute users across sources for demo
    const sourceData = sources.map((source, index) => {
      const count =
        Math.floor(users.length / sources.length) +
        (index < users.length % sources.length ? 1 : 0)
      // Simulate conversion rates (LinkedIn and Referral typically have higher rates)
      const conversionRate =
        source.id === 'LINKEDIN' || source.id === 'REFERRAL'
          ? Math.floor(Math.random() * 20) + 15 // 15-35%
          : Math.floor(Math.random() * 15) + 5 // 5-20%

      // Simulate cost per hire (LinkedIn is typically more expensive)
      const costPerHire =
        source.id === 'LINKEDIN'
          ? Math.floor(Math.random() * 2000) + 3000 // $3000-5000
          : source.id === 'JOB_BOARD'
          ? Math.floor(Math.random() * 500) + 500 // $500-1000
          : Math.floor(Math.random() * 1000) + 1000 // $1000-2000

      const hires = Math.floor(count * (conversionRate / 100))

      return {
        ...source,
        candidates: count,
        hires,
        conversionRate,
        costPerHire,
        totalCost: hires * costPerHire,
      }
    })

    // Calculate totals
    const totalCandidates = sourceData.reduce((sum, s) => sum + s.candidates, 0)
    const totalHires = sourceData.reduce((sum, s) => sum + s.hires, 0)
    const overallConversionRate =
      totalCandidates > 0 ? (totalHires / totalCandidates) * 100 : 0
    const totalCost = sourceData.reduce((sum, s) => sum + s.totalCost, 0)
    const avgCostPerHire = totalHires > 0 ? totalCost / totalHires : 0

    // Source performance trend (monthly)
    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthUsers = users.filter(
        (u: any) =>
          new Date(u.createdAt).getMonth() === date.getMonth() &&
          new Date(u.createdAt).getFullYear() === date.getFullYear()
      )

      const monthSourceData = sources.map((source, index) => {
        const count =
          Math.floor(monthUsers.length / sources.length) +
          (index < monthUsers.length % sources.length ? 1 : 0)
        return {
          source: source.label,
          candidates: count,
        }
      })

      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        sources: monthSourceData,
      })
    }

    // ROI by source
    const roiData = sourceData.map((source) => {
      // Simplified ROI calculation (would need actual revenue data)
      const roi =
        source.hires > 0
          ? ((source.hires * 100000 - source.totalCost) / source.totalCost) *
            100
          : 0
      return {
        source: source.label,
        roi: Math.round(roi),
        hires: source.hires,
        cost: source.totalCost,
      }
    })

    return NextResponse.json({
      sources: sourceData,
      summary: {
        totalCandidates,
        totalHires,
        overallConversionRate: Math.round(overallConversionRate),
        totalCost,
        avgCostPerHire: Math.round(avgCostPerHire),
      },
      trend: monthlyData,
      roi: roiData,
    })
  } catch (error: any) {
    console.error('Error fetching source analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch source analytics', details: error.message },
      { status: 500 }
    )
  }
}
