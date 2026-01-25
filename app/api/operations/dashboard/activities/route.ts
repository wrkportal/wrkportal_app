import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsInventoryDistribution model
function getOperationsInventoryDistribution() {
  return (prisma as any).operationsInventoryDistribution as any
}

// Helper function to safely access operationsComplianceTraining model
function getOperationsComplianceTraining() {
  return (prisma as any).operationsComplianceTraining as any
}

// Helper function to safely access operationsIncident model
function getOperationsIncident() {
  return (prisma as any).operationsIncident as any
}

// Helper function to safely access operationsWorkOrder model
function getOperationsWorkOrder() {
  return (prisma as any).operationsWorkOrder as any
}

// Helper function to safely access operationsInventoryItem model
function getOperationsInventoryItem() {
  return (prisma as any).operationsInventoryItem as any
}

type InventoryDistribution = {
  id: string
  item: { name: string; category: string }
  location: string
  distributedAt: Date
}

type ComplianceTraining = {
  id: string
  name: string
  completedDate: Date
}

type OperationsIncident = {
  id: string
  title: string
  reportedAt: Date
  status: string
}

type OperationsWorkOrder = {
  id: string
  title: string
  completedDate: Date
}

type OperationsInventoryItem = {
  id: string
  name: string
  updatedAt: Date
}

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
        const operationsInventoryDistribution = getOperationsInventoryDistribution()
        const distributions = await safeQuery<InventoryDistribution[]>(
          () =>
            operationsInventoryDistribution
              ? operationsInventoryDistribution.findMany({
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
                })
              : Promise.resolve([]),
          []
        )

        distributions.forEach((dist: InventoryDistribution) => {
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
        const operationsComplianceTraining = getOperationsComplianceTraining()
        const trainings = await safeQuery<ComplianceTraining[]>(
          () =>
            operationsComplianceTraining
              ? operationsComplianceTraining.findMany({
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
                })
              : Promise.resolve([]),
          []
        )

        trainings.forEach((training: ComplianceTraining) => {
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
        const operationsIncident = getOperationsIncident()
        const incidents = await safeQuery<OperationsIncident[]>(
          () =>
            operationsIncident
              ? operationsIncident.findMany({
                  where: { tenantId: userInfo.tenantId },
                  orderBy: { reportedAt: 'desc' },
                  take: limit,
                })
              : Promise.resolve([]),
          []
        )

        incidents.forEach((incident: OperationsIncident) => {
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
        const operationsWorkOrder = getOperationsWorkOrder()
        const workOrders = await safeQuery<OperationsWorkOrder[]>(
          () =>
            operationsWorkOrder
              ? operationsWorkOrder.findMany({
                  where: {
                    tenantId: userInfo.tenantId,
                    status: 'COMPLETED',
                    completedDate: { not: null },
                  },
                  orderBy: { completedDate: 'desc' },
                  take: limit,
                })
              : Promise.resolve([]),
          []
        )

        workOrders.forEach((wo: OperationsWorkOrder) => {
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
        const operationsInventoryItem = getOperationsInventoryItem()
        const lowStockItems = await safeQuery<OperationsInventoryItem[]>(
          () =>
            operationsInventoryItem
              ? operationsInventoryItem.findMany({
                  where: {
                    tenantId: userInfo.tenantId,
                    OR: [
                      { status: 'LOW_STOCK' },
                      { status: 'OUT_OF_STOCK' },
                    ],
                  },
                  orderBy: { updatedAt: 'desc' },
                  take: limit,
                })
              : Promise.resolve([]),
          []
        )

        lowStockItems.forEach((item: OperationsInventoryItem) => {
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

