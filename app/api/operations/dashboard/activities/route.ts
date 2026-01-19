import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// GET - Get recent activities for dashboard
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '10')

        const activities: any[] = []

        // Helper to safely query Prisma models that might not exist
        const safeQuery = async <T>(
          queryFn: () => Promise<T>,
          defaultValue: T
        ): Promise<T> => {
          try {
            return await queryFn()
          } catch (error: any) {
            if (
              error?.code === 'P2001' ||
              error?.message?.includes('does not exist') ||
              error?.message?.includes('Unknown model') ||
              error?.message?.includes('model does not exist')
            ) {
              console.warn('Prisma model not found, using default value:', error.message)
              return defaultValue
            }
            throw error
          }
        }

        // Get recent inventory distributions
        const distributions = await safeQuery(
          () => prisma.operationsInventoryDistribution?.findMany({
            where: { tenantId: userInfo.tenantId },
            include: {
              item: {
                select: { name: true, category: true },
              },
              distributedBy: {
                select: { name: true },
              },
            },
            orderBy: { distributedAt: 'desc' },
            take: limit,
          }) || Promise.resolve([]),
          []
        )

        distributions.forEach((dist) => {
          activities.push({
            id: `dist-${dist.id}`,
            type: 'DISTRIBUTION',
            description: `${dist.item.name} distributed to ${dist.location}`,
            time: dist.distributedAt,
            status: 'COMPLETED',
            createdAt: dist.distributedAt,
          })
        })

        // Get recent training completions
        const trainings = await safeQuery(
          () => prisma.operationsComplianceTraining?.findMany({
            where: {
              tenantId: userInfo.tenantId,
              status: 'COMPLETED',
              completedDate: { not: null },
            },
            include: {
              assignedTo: {
                select: { name: true },
              },
            },
            orderBy: { completedDate: 'desc' },
            take: limit,
          }) || Promise.resolve([]),
          []
        )

        trainings.forEach((training) => {
          activities.push({
            id: `training-${training.id}`,
            type: 'TRAINING',
            description: `${training.name} completed`,
            time: training.completedDate,
            status: 'COMPLETED',
            createdAt: training.completedDate,
          })
        })

        // Get recent incidents
        const incidents = await safeQuery(
          () => prisma.operationsIncident?.findMany({
            where: { tenantId: userInfo.tenantId },
            orderBy: { reportedAt: 'desc' },
            take: limit,
          }) || Promise.resolve([]),
          []
        )

        incidents.forEach((incident) => {
          activities.push({
            id: `incident-${incident.id}`,
            type: 'INCIDENT',
            description: `New incident reported: ${incident.title}`,
            time: incident.reportedAt,
            status: incident.status === 'RESOLVED' ? 'RESOLVED' : 'OPEN',
            createdAt: incident.reportedAt,
          })
        })

        // Get recent work order completions
        const workOrders = await safeQuery(
          () => prisma.operationsWorkOrder?.findMany({
            where: {
              tenantId: userInfo.tenantId,
              status: 'COMPLETED',
              completedDate: { not: null },
            },
            orderBy: { completedDate: 'desc' },
            take: limit,
          }) || Promise.resolve([]),
          []
        )

        workOrders.forEach((wo) => {
          activities.push({
            id: `wo-${wo.id}`,
            type: 'PERFORMANCE',
            description: `Work order "${wo.title}" completed`,
            time: wo.completedDate,
            status: 'SUCCESS',
            createdAt: wo.completedDate,
          })
        })

        // Get low stock alerts
        // Note: Simplified query since we can't use field references in Prisma
        const lowStockItems = await safeQuery(
          () => prisma.operationsInventoryItem?.findMany({
            where: {
              tenantId: userInfo.tenantId,
              OR: [
                { status: 'LOW_STOCK' },
                { status: 'OUT_OF_STOCK' },
              ],
            },
            orderBy: { updatedAt: 'desc' },
            take: limit,
          }) || Promise.resolve([]),
          []
        )

        lowStockItems.forEach((item) => {
          activities.push({
            id: `stock-${item.id}`,
            type: 'INVENTORY',
            description: `Low stock alert: ${item.name}`,
            time: item.updatedAt,
            status: 'WARNING',
            createdAt: item.updatedAt,
          })
        })

        // Sort by time and limit
        activities.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        // Format time relative to now
        const formatTimeAgo = (date: Date) => {
          const now = new Date()
          const diffMs = now.getTime() - date.getTime()
          const diffMins = Math.floor(diffMs / (1000 * 60))
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

          if (diffMins < 60) return `${diffMins} minutes ago`
          if (diffHours < 24) return `${diffHours} hours ago`
          if (diffDays < 7) return `${diffDays} days ago`
          return date.toLocaleDateString()
        }

        const formattedActivities = activities.slice(0, limit).map(activity => ({
          ...activity,
          time: formatTimeAgo(activity.createdAt),
        }))

        return NextResponse.json({ activities: formattedActivities })
      } catch (error) {
        console.error('Error fetching activities:', error)
        return NextResponse.json(
          { error: 'Failed to fetch activities' },
          { status: 500 }
        )
      }
    }
  )
}

