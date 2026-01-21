import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { PrismaClientKnownRequestError } from '@prisma/client'

// Helper to safely query Prisma models that might not exist
const safeQuery = async <T>(
  queryFn: () => Promise<T>,
  defaultValue: T
): Promise<T> => {
  try {
    return await queryFn()
  } catch (error: any) {
    // Check if it's a Prisma error about missing model or TypeError from undefined
    if (
      error instanceof PrismaClientKnownRequestError &&
      (error.code === 'P2001' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('Unknown model') ||
        error.message?.includes('model does not exist'))
    ) {
      console.warn('Prisma model not found, using default value:', error.message)
      return defaultValue
    }
    // Catch TypeError from accessing undefined properties
    if (
      error instanceof TypeError &&
      (error.message?.includes('Cannot read properties of undefined') ||
        error.message?.includes('undefined'))
    ) {
      console.warn('Prisma model not found (TypeError), using default value:', error.message)
      return defaultValue
    }
    throw error
  }
}

// GET - Get IT dashboard trends data for charts
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'it', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || 'all' // 'tickets', 'assets', 'security', 'network', 'all'
        const months = parseInt(searchParams.get('months') || '4')

        const today = new Date()
        const result: any = {}

        // Tickets trends
        if (type === 'all' || type === 'tickets') {
          const monthlyData: any[] = []
          
          for (let i = 0; i < months; i++) {
            const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1)
            const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0)
            
            const openCount = await prisma.salesCase.count({
              where: {
                tenantId: userInfo.tenantId,
                status: { in: ['NEW', 'IN_PROGRESS'] },
                createdAt: { lte: monthEnd },
                updatedAt: { gte: monthStart },
              },
            })

            const resolvedCount = await prisma.salesCase.count({
              where: {
                tenantId: userInfo.tenantId,
                status: 'CLOSED',
                closedDate: {
                  gte: monthStart,
                  lte: monthEnd,
                },
              },
            })

            const inProgressCount = await prisma.salesCase.count({
              where: {
                tenantId: userInfo.tenantId,
                status: 'IN_PROGRESS',
                updatedAt: {
                  gte: monthStart,
                  lte: monthEnd,
                },
              },
            })

            monthlyData.unshift({
              month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
              Open: openCount,
              Resolved: resolvedCount,
              InProgress: inProgressCount,
            })
          }

          result.tickets = monthlyData
        }

        // Assets trends (safely handle missing model)
        if (type === 'all' || type === 'assets') {
          const assets = await safeQuery(
            () => (prisma as any).operationsAsset.findMany({
              where: { tenantId: userInfo.tenantId },
              select: { category: true },
            }),
            []
          )

          const categoryCounts: Record<string, number> = {}
          assets.forEach((asset: any) => {
            const category = asset.category || 'Other'
            categoryCounts[category] = (categoryCounts[category] || 0) + 1
          })

          const total = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0)
          const assetsData = Object.entries(categoryCounts).map(([category, count]) => ({
            category,
            value: count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          }))

          result.assets = assetsData
        }

        // Security trends
        if (type === 'all' || type === 'security') {
          const monthlyData: any[] = []
          
          for (let i = 0; i < months; i++) {
            const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1)
            const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0)
            
            // Placeholder - would need security monitoring integration
            const alerts = 0
            const threats = 0
            const incidents = 0

            monthlyData.unshift({
              month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
              Alerts: alerts,
              Threats: threats,
              Incidents: incidents,
            })
          }

          result.security = monthlyData
        }

        // Network trends
        if (type === 'all' || type === 'network') {
          // Placeholder - would need network monitoring integration
          const networkData = [
            { time: '00:00', Usage: 45, Uptime: 100 },
            { time: '06:00', Usage: 52, Uptime: 100 },
            { time: '12:00', Usage: 68, Uptime: 99.9 },
            { time: '18:00', Usage: 65, Uptime: 99.8 },
            { time: '24:00', Usage: 48, Uptime: 99.8 },
          ]

          result.network = networkData
        }

        return NextResponse.json(result)
      } catch (error) {
        console.error('Error fetching trends data:', error)
        return NextResponse.json(
          { 
            error: 'Failed to fetch trends data',
            message: (error as Error).message,
            details: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
          },
          { status: 500 }
        )
      }
    }
  )
}

