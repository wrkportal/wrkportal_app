import { prisma } from '@/lib/prisma'
import { WorkOrdersService } from './work-orders.service'
import { ResourcesService } from './resources.service'
import { InventoryService } from './inventory.service'
import { PerformanceService } from './performance.service'
import { ComplianceService } from './compliance.service'

export interface DashboardStats {
  workOrders: {
    total: number
    pending: number
    inProgress: number
    completed: number
    overdue: number
    completionRate: number
  }
  resources: {
    total: number
    available: number
    utilization: number
    onLeave: number
    attendanceRate: number
  }
  inventory: {
    totalItems: number
    totalValue: number
    lowStock: number
    outOfStock: number
  }
  performance: {
    kpisOnTrack: number
    qualityScore: number
    avgPerformance: number
  }
  compliance: {
    score: number
    status: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT'
    pendingTrainings: number
    openIssues: number
    highRisks: number
  }
}

export class DashboardService {
  /**
   * Get comprehensive dashboard statistics
   */
  static async getDashboardStats(
    tenantId: string
  ): Promise<DashboardStats> {
    const [
      workOrderStats,
      capacityStats,
      attendanceStats,
      inventoryStats,
      kpiStats,
      qualityStats,
      complianceStats,
      complianceStatus,
    ] = await Promise.all([
      WorkOrdersService.getWorkOrderStats(tenantId),
      ResourcesService.getCapacityByDepartment(tenantId),
      ResourcesService.getAttendanceStats(tenantId),
      InventoryService.getInventoryStats(tenantId),
      PerformanceService.getKPIStats(tenantId),
      PerformanceService.getQualityStats(tenantId),
      ComplianceService.getComplianceStats(tenantId),
      ComplianceService.getComplianceStatus(tenantId),
    ])

    const completionRate = await WorkOrdersService.getCompletionRate(tenantId)

    return {
      workOrders: {
        ...workOrderStats,
        completionRate,
      },
      resources: {
        total: capacityStats.totals.total,
        available: capacityStats.totals.available,
        utilization: capacityStats.totals.utilization,
        onLeave: capacityStats.totals.onLeave,
        attendanceRate: attendanceStats.attendanceRate,
      },
      inventory: {
        totalItems: inventoryStats.totalItems,
        totalValue: inventoryStats.totalValue,
        lowStock: inventoryStats.lowStock,
        outOfStock: inventoryStats.outOfStock,
      },
      performance: {
        kpisOnTrack: kpiStats.onTrack,
        qualityScore: qualityStats.overallQuality,
        avgPerformance: kpiStats.avgPerformance,
      },
      compliance: {
        score: complianceStatus.score,
        status: complianceStatus.status,
        pendingTrainings: complianceStats.pendingTrainings,
        openIssues: complianceStats.openIssues,
        highRisks: complianceStats.highRisks,
      },
    }
  }

  /**
   * Get recent activity
   */
  static async getRecentActivity(tenantId: string, limit: number = 10) {
    const [workOrders, incidents, issues] = await Promise.all([
      prisma.operationsWorkOrder.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          workOrderNumber: true,
          title: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.operationsIncident.findMany({
        where: { tenantId },
        orderBy: { reportedDate: 'desc' },
        take: limit,
        select: {
          id: true,
          type: true,
          severity: true,
          reportedDate: true,
        },
      }),
      prisma.operationsComplianceIssue.findMany({
        where: { tenantId },
        orderBy: { reportedDate: 'desc' },
        take: limit,
        select: {
          id: true,
          type: true,
          severity: true,
          reportedDate: true,
        },
      }),
    ])

    return {
      workOrders,
      incidents,
      issues,
    }
  }

  /**
   * Get trends data for charts
   */
  static async getTrendsData(
    tenantId: string,
    period: 'WEEK' | 'MONTH' | 'QUARTER' = 'MONTH'
  ) {
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case 'WEEK':
        startDate.setDate(now.getDate() - 7)
        break
      case 'MONTH':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'QUARTER':
        startDate.setMonth(now.getMonth() - 3)
        break
    }

    const [workOrderTrends, attendanceTrends, qualityTrends] =
      await Promise.all([
        this.getWorkOrderTrends(tenantId, startDate),
        this.getAttendanceTrends(tenantId, startDate),
        this.getQualityTrends(tenantId, startDate),
      ])

    return {
      workOrders: workOrderTrends,
      attendance: attendanceTrends,
      quality: qualityTrends,
    }
  }

  private static async getWorkOrderTrends(
    tenantId: string,
    startDate: Date
  ) {
    const workOrders = await prisma.operationsWorkOrder.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        status: true,
      },
    })

    // Group by date
    const trends: Record<string, { created: number; completed: number }> = {}
    workOrders.forEach((wo) => {
      const date = new Date(wo.createdAt).toISOString().split('T')[0]
      if (!trends[date]) {
        trends[date] = { created: 0, completed: 0 }
      }
      trends[date].created++
      if (wo.status === 'COMPLETED') {
        trends[date].completed++
      }
    })

    return Object.entries(trends).map(([date, data]) => ({
      date,
      ...data,
    }))
  }

  private static async getAttendanceTrends(
    tenantId: string,
    startDate: Date
  ) {
    const attendances = await prisma.operationsAttendance.findMany({
      where: {
        tenantId,
        date: { gte: startDate },
      },
      select: {
        date: true,
        status: true,
      },
    })

    const trends: Record<string, { present: number; absent: number }> = {}
    attendances.forEach((att) => {
      const date = new Date(att.date).toISOString().split('T')[0]
      if (!trends[date]) {
        trends[date] = { present: 0, absent: 0 }
      }
      if (att.status === 'PRESENT') {
        trends[date].present++
      } else if (att.status === 'ABSENT') {
        trends[date].absent++
      }
    })

    return Object.entries(trends).map(([date, data]) => ({
      date,
      ...data,
      rate:
        data.present + data.absent > 0
          ? Number(
              ((data.present / (data.present + data.absent)) * 100).toFixed(1)
            )
          : 0,
    }))
  }

  private static async getQualityTrends(
    tenantId: string,
    startDate: Date
  ) {
    const qualityChecks = await prisma.operationsQualityCheck.findMany({
      where: {
        tenantId,
        date: { gte: startDate },
      },
      select: {
        date: true,
        passRate: true,
      },
    })

    const trends: Record<string, { checks: number; avgPassRate: number }> = {}
    qualityChecks.forEach((qc) => {
      const date = new Date(qc.date).toISOString().split('T')[0]
      if (!trends[date]) {
        trends[date] = { checks: 0, avgPassRate: 0 }
      }
      trends[date].checks++
      trends[date].avgPassRate += Number(qc.passRate)
    })

    return Object.entries(trends).map(([date, data]) => ({
      date,
      checks: data.checks,
      avgPassRate: Number((data.avgPassRate / data.checks).toFixed(1)),
    }))
  }
}

