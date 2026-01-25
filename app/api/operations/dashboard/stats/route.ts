import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsResource model
function getOperationsResource() {
  return (prisma as any).operationsResource as any
}

// Helper function to safely access operationsAttendance model
function getOperationsAttendance() {
  return (prisma as any).operationsAttendance as any
}

// Helper function to safely access operationsAttrition model
function getOperationsAttrition() {
  return (prisma as any).operationsAttrition as any
}

// Helper function to safely access operationsWorkOrder model
function getOperationsWorkOrder() {
  return (prisma as any).operationsWorkOrder as any
}

// Helper function to safely access operationsInventoryItem model
function getOperationsInventoryItem() {
  return (prisma as any).operationsInventoryItem as any
}

// Helper function to safely access operationsComplianceTraining model
function getOperationsComplianceTraining() {
  return (prisma as any).operationsComplianceTraining as any
}

// Helper function to safely access operationsIncident model
function getOperationsIncident() {
  return (prisma as any).operationsIncident as any
}

// Helper function to safely access operationsRisk model
function getOperationsRisk() {
  return (prisma as any).operationsRisk as any
}

// Helper function to safely access operationsShift model
function getOperationsShift() {
  return (prisma as any).operationsShift as any
}

// Helper function to safely access operationsTrainingEnrollment model
function getOperationsTrainingEnrollment() {
  return (prisma as any).operationsTrainingEnrollment as any
}

// Helper function to safely access operationsNewHire model
function getOperationsNewHire() {
  return (prisma as any).operationsNewHire as any
}

// Helper function to safely access operationsOnboarding model
function getOperationsOnboarding() {
  return (prisma as any).operationsOnboarding as any
}

// Helper function to safely access operationsComplianceIssue model
function getOperationsComplianceIssue() {
  return (prisma as any).operationsComplianceIssue as any
}

type OperationsResource = {
  utilization: number | string
}

type OperationsAttendance = {
  status: string
}

type OperationsWorkOrder = {
  status: string
  scheduledDate: Date | null
  completedDate: Date | null
  qualityScore: number | null
}

type OperationsInventoryItem = {
  status: string
  quantity: number
  reorderLevel: number
}

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
          safeQuery<OperationsResource[]>(
            () => {
              const operationsResource = getOperationsResource()
              return operationsResource
                ? operationsResource.findMany({
                    where: { tenantId: userInfo.tenantId },
                  })
                : Promise.resolve([])
            },
            []
          ),
          safeQuery<OperationsAttendance[]>(
            () => {
              const operationsAttendance = getOperationsAttendance()
              return operationsAttendance
                ? operationsAttendance.findMany({
                    where: {
                      tenantId: userInfo.tenantId,
                      date: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999)),
                      },
                    },
                  })
                : Promise.resolve([])
            },
            []
          ),
          safeQuery<OperationsWorkOrder[]>(
            () => {
              const operationsWorkOrder = getOperationsWorkOrder()
              return operationsWorkOrder
                ? operationsWorkOrder.findMany({
                    where: { tenantId: userInfo.tenantId },
                  })
                : Promise.resolve([])
            },
            []
          ),
          safeQuery<OperationsInventoryItem[]>(
            () => {
              const operationsInventoryItem = getOperationsInventoryItem()
              return operationsInventoryItem
                ? operationsInventoryItem.findMany({
                    where: { tenantId: userInfo.tenantId },
                  })
                : Promise.resolve([])
            },
            []
          ),
          safeQuery(
            () => {
              const operationsComplianceTraining = getOperationsComplianceTraining()
              return operationsComplianceTraining
                ? operationsComplianceTraining.findMany({
                    where: {
                      tenantId: userInfo.tenantId,
                      status: 'PENDING',
                    },
                  })
                : Promise.resolve([])
            },
            []
          ),
          safeQuery(
            () => {
              const operationsIncident = getOperationsIncident()
              return operationsIncident
                ? operationsIncident.findMany({
                    where: {
                      tenantId: userInfo.tenantId,
                      status: { in: ['OPEN', 'INVESTIGATING'] },
                    },
                  })
                : Promise.resolve([])
            },
            []
          ),
          safeQuery(
            () => {
              const operationsRisk = getOperationsRisk()
              return operationsRisk
                ? operationsRisk.findMany({
                    where: { tenantId: userInfo.tenantId },
                  })
                : Promise.resolve([])
            },
            []
          ),
        ])

        // Calculate metrics
        const capacityUtilization = resources.length > 0
          ? resources.reduce((sum, r: OperationsResource) => sum + Number(r.utilization), 0) / resources.length
          : 0

        const attendanceRate = attendanceRecords.length > 0
          ? (attendanceRecords.filter((a: OperationsAttendance) => a.status === 'PRESENT').length / attendanceRecords.length) * 100
          : 0

        const attritionThisMonth = await safeQuery(
          () => {
            const operationsAttrition = getOperationsAttrition()
            return operationsAttrition
              ? operationsAttrition.count({
                  where: {
                    tenantId: userInfo.tenantId,
                    exitDate: {
                      gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                  },
                })
              : Promise.resolve(0)
          },
          0
        )

        const attritionRate = totalResources > 0
          ? (attritionThisMonth / totalResources) * 100
          : 0

        const activeShifts = await safeQuery(
          () => {
            const operationsShift = getOperationsShift()
            return operationsShift
              ? operationsShift.count({
                  where: {
                    tenantId: userInfo.tenantId,
                    status: 'ACTIVE',
                  },
                })
              : Promise.resolve(0)
          },
          0
        )

        const pendingTrainings = await safeQuery(
          () => {
            const operationsTrainingEnrollment = getOperationsTrainingEnrollment()
            return operationsTrainingEnrollment
              ? operationsTrainingEnrollment.count({
                  where: {
                    tenantId: userInfo.tenantId,
                    status: 'PENDING',
                  },
                })
              : Promise.resolve(0)
          },
          0
        )

        const newHires = await safeQuery(
          () => {
            const operationsNewHire = getOperationsNewHire()
            return operationsNewHire
              ? operationsNewHire.count({
                  where: {
                    tenantId: userInfo.tenantId,
                    joinDate: {
                      gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                  },
                })
              : Promise.resolve(0)
          },
          0
        )

        const activeOnboarding = await safeQuery(
          () => {
            const operationsOnboarding = getOperationsOnboarding()
            return operationsOnboarding
              ? operationsOnboarding.count({
                  where: {
                    tenantId: userInfo.tenantId,
                    status: 'IN_PROGRESS',
                  },
                })
              : Promise.resolve(0)
          },
          0
        )

        // Performance metrics
        const completedWorkOrders = workOrders.filter((wo: OperationsWorkOrder) => wo.status === 'COMPLETED')
        const avgTAT = completedWorkOrders.length > 0
          ? completedWorkOrders.reduce((sum, wo: OperationsWorkOrder) => {
              if (wo.scheduledDate && wo.completedDate) {
                const hours = (wo.completedDate.getTime() - wo.scheduledDate.getTime()) / (1000 * 60 * 60)
                return sum + hours
              }
              return sum
            }, 0) / completedWorkOrders.length
          : 0

        const backlog = workOrders.filter((wo: OperationsWorkOrder) => 
          ['OPEN', 'SCHEDULED', 'IN_PROGRESS'].includes(wo.status)
        ).length

        // Quality score - calculate from work orders with quality scores
        const workOrdersWithQuality = workOrders.filter((wo: OperationsWorkOrder) => wo.qualityScore !== null)
        const qualityScore = workOrdersWithQuality.length > 0
          ? workOrdersWithQuality.reduce((sum, wo: OperationsWorkOrder) => sum + Number(wo.qualityScore || 0), 0) / workOrdersWithQuality.length
          : 85.0

        // Error rate - based on work orders with low quality scores or rejected status
        const errorWorkOrders = workOrders.filter((wo: OperationsWorkOrder) => 
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
          () => {
            const operationsComplianceTraining = getOperationsComplianceTraining()
            return operationsComplianceTraining
              ? operationsComplianceTraining.count({
                  where: {
                    tenantId: userInfo.tenantId,
                    status: 'COMPLETED',
                    completedDate: {
                      gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                  },
                })
              : Promise.resolve(0)
          },
          0
        )

        const totalTrainings = await safeQuery(
          () => {
            const operationsComplianceTraining = getOperationsComplianceTraining()
            return operationsComplianceTraining
              ? operationsComplianceTraining.count({
                  where: {
                    tenantId: userInfo.tenantId,
                    dueDate: {
                      lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
                    },
                  },
                })
              : Promise.resolve(0)
          },
          0
        )

        const complianceRate = totalTrainings > 0
          ? (completedTrainings / totalTrainings) * 100
          : 0

        const openIssues = await safeQuery(
          () => {
            const operationsComplianceIssue = getOperationsComplianceIssue()
            return operationsComplianceIssue
              ? operationsComplianceIssue.count({
                  where: {
                    tenantId: userInfo.tenantId,
                    status: { in: ['OPEN', 'IN_PROGRESS'] },
                  },
                })
              : Promise.resolve(0)
          },
          0
        )

        const identifiedRisks = risks.length
        const activeIncidents = incidents.length

        // Inventory metrics
        const totalInventory = inventoryItems.length
        const lowStockItems = inventoryItems.filter((item: OperationsInventoryItem) => 
          item.status === 'LOW_STOCK' || (item.quantity <= item.reorderLevel && item.status === 'IN_STOCK')
        ).length
        const outOfStockItems = inventoryItems.filter((item: OperationsInventoryItem) => item.status === 'OUT_OF_STOCK').length
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

