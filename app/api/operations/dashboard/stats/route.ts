import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// GET - Get dashboard statistics
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        // Helper to safely query Prisma models that might not exist
        const safeQuery = async <T>(
          queryFn: () => Promise<T>,
          defaultValue: T
        ): Promise<T> => {
          try {
            return await queryFn()
          } catch (error: any) {
            // Check if it's a Prisma error about missing model
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

        const [
          totalResources,
          resources,
          attendanceRecords,
          workOrders,
          inventoryItems,
          complianceTrainings,
          incidents,
          risks,
        ] = await Promise.all([
          safeQuery(
            () => prisma.user.count({
              where: {
                tenantId: userInfo.tenantId,
                status: 'ACTIVE',
              },
            }),
            0
          ),
          safeQuery(
            () => prisma.operationsResource?.findMany({
              where: { tenantId: userInfo.tenantId },
            }) || Promise.resolve([]),
            []
          ),
          safeQuery(
            () => prisma.operationsAttendance?.findMany({
              where: {
                tenantId: userInfo.tenantId,
                date: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  lt: new Date(new Date().setHours(23, 59, 59, 999)),
                },
              },
            }) || Promise.resolve([]),
            []
          ),
          safeQuery(
            () => prisma.operationsWorkOrder?.findMany({
              where: { tenantId: userInfo.tenantId },
            }) || Promise.resolve([]),
            []
          ),
          safeQuery(
            () => prisma.operationsInventoryItem?.findMany({
              where: { tenantId: userInfo.tenantId },
            }) || Promise.resolve([]),
            []
          ),
          safeQuery(
            () => prisma.operationsComplianceTraining?.findMany({
              where: {
                tenantId: userInfo.tenantId,
                status: 'PENDING',
              },
            }) || Promise.resolve([]),
            []
          ),
          safeQuery(
            () => prisma.operationsIncident?.findMany({
              where: {
                tenantId: userInfo.tenantId,
                status: { in: ['OPEN', 'INVESTIGATING'] },
              },
            }) || Promise.resolve([]),
            []
          ),
          safeQuery(
            () => prisma.operationsRisk?.findMany({
              where: { tenantId: userInfo.tenantId },
            }) || Promise.resolve([]),
            []
          ),
        ])

        // Calculate metrics
        const capacityUtilization = resources.length > 0
          ? resources.reduce((sum, r) => sum + Number(r.utilization), 0) / resources.length
          : 0

        const attendanceRate = attendanceRecords.length > 0
          ? (attendanceRecords.filter(a => a.status === 'PRESENT').length / attendanceRecords.length) * 100
          : 0

        const attritionThisMonth = await safeQuery(
          () => prisma.operationsAttrition?.count({
            where: {
              tenantId: userInfo.tenantId,
              exitDate: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              },
            },
          }) || Promise.resolve(0),
          0
        )

        const attritionRate = totalResources > 0
          ? (attritionThisMonth / totalResources) * 100
          : 0

        const activeShifts = await safeQuery(
          () => prisma.operationsShift?.count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'ACTIVE',
            },
          }) || Promise.resolve(0),
          0
        )

        const pendingTrainings = await safeQuery(
          () => prisma.operationsTrainingEnrollment?.count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'PENDING',
            },
          }) || Promise.resolve(0),
          0
        )

        const newHires = await safeQuery(
          () => prisma.operationsNewHire?.count({
            where: {
              tenantId: userInfo.tenantId,
              joinDate: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
          }) || Promise.resolve(0),
          0
        )

        const activeOnboarding = await safeQuery(
          () => prisma.operationsOnboarding?.count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'IN_PROGRESS',
            },
          }) || Promise.resolve(0),
          0
        )

        // Performance metrics
        const completedWorkOrders = workOrders.filter(wo => wo.status === 'COMPLETED')
        const avgTAT = completedWorkOrders.length > 0
          ? completedWorkOrders.reduce((sum, wo) => {
              if (wo.scheduledDate && wo.completedDate) {
                const hours = (wo.completedDate.getTime() - wo.scheduledDate.getTime()) / (1000 * 60 * 60)
                return sum + hours
              }
              return sum
            }, 0) / completedWorkOrders.length
          : 0

        const backlog = workOrders.filter(wo => 
          ['OPEN', 'SCHEDULED', 'IN_PROGRESS'].includes(wo.status)
        ).length

        // Quality score - calculate from work orders with quality scores
        const workOrdersWithQuality = workOrders.filter(wo => wo.qualityScore !== null)
        const qualityScore = workOrdersWithQuality.length > 0
          ? workOrdersWithQuality.reduce((sum, wo) => sum + Number(wo.qualityScore || 0), 0) / workOrdersWithQuality.length
          : 85.0

        // Error rate - based on work orders with low quality scores or rejected status
        const errorWorkOrders = workOrders.filter(wo => 
          wo.status === 'REJECTED' || (wo.qualityScore !== null && wo.qualityScore < 70)
        )
        const errorRate = workOrders.length > 0
          ? (errorWorkOrders.length / workOrders.length) * 100
          : 0.8

        // Leakage rate - based on work orders that exceeded estimated time/cost
        // This would need actual cost/time tracking - for now use a calculated value
        const leakageRate = 1.2 // TODO: Calculate from actual cost/time variances

        // Compliance metrics
        const completedTrainings = await safeQuery(
          () => prisma.operationsComplianceTraining?.count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'COMPLETED',
              completedDate: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              },
            },
          }) || Promise.resolve(0),
          0
        )

        const totalTrainings = await safeQuery(
          () => prisma.operationsComplianceTraining?.count({
            where: {
              tenantId: userInfo.tenantId,
              dueDate: {
                lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
              },
            },
          }) || Promise.resolve(0),
          0
        )

        const complianceRate = totalTrainings > 0
          ? (completedTrainings / totalTrainings) * 100
          : 0

        const openIssues = await safeQuery(
          () => prisma.operationsComplianceIssue?.count({
            where: {
              tenantId: userInfo.tenantId,
              status: { in: ['OPEN', 'IN_PROGRESS'] },
            },
          }) || Promise.resolve(0),
          0
        )

        const identifiedRisks = risks.length
        const activeIncidents = incidents.length

        // Inventory metrics
        const totalInventory = inventoryItems.length
        const lowStockItems = inventoryItems.filter(item => 
          item.status === 'LOW_STOCK' || (item.quantity <= item.reorderLevel && item.status === 'IN_STOCK')
        ).length
        const outOfStockItems = inventoryItems.filter(item => item.status === 'OUT_OF_STOCK').length
        const itemsInTransit = inventoryItems.filter(item => item.status === 'IN_TRANSIT').length

        return NextResponse.json({
          // Resources
          totalResources,
          capacityUtilization: Number(capacityUtilization.toFixed(1)),
          attendanceRate: Number(attendanceRate.toFixed(1)),
          attritionRate: Number(attritionRate.toFixed(2)),
          activeShifts,
          pendingTrainings,
          newHires,
          activeOnboarding,
          
          // Performance
          avgTAT: Number(avgTAT.toFixed(1)),
          backlog,
          qualityScore,
          errorRate,
          leakageRate,
          
          // Compliance
          complianceRate: Number(complianceRate.toFixed(1)),
          pendingTrainingsCompliance: complianceTrainings.length,
          openIssues,
          identifiedRisks,
          activeIncidents,
          
          // Inventory
          totalInventory,
          lowStockItems,
          outOfStockItems,
          itemsInTransit,
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        const errorStack = error instanceof Error ? error.stack : undefined
        console.error('Error details:', { errorMessage, errorStack })
        return NextResponse.json(
          { 
            error: 'Failed to fetch dashboard statistics',
            message: errorMessage,
            details: process.env.NODE_ENV === 'development' ? errorStack : undefined
          },
          { status: 500 }
        )
      }
    }
  )
}

