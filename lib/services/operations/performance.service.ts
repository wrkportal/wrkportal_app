import { prisma } from '@/lib/prisma'
import { KPIStatus, KPITrend } from '@prisma/client'

export interface KPIStats {
  total: number
  onTrack: number
  atRisk: number
  offTrack: number
  exceeded: number
  avgPerformance: number
}

export interface QualityStats {
  totalChecks: number
  totalPassed: number
  totalFailed: number
  overallQuality: number
  byType: Record<string, { passed: number; failed: number; rate: number }>
}

export class PerformanceService {
  /**
   * Get KPI statistics
   */
  static async getKPIStats(
    tenantId: string,
    period?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
    date?: Date
  ): Promise<KPIStats> {
    const where: any = { tenantId }
    if (period) where.period = period

    if (date) {
      const startOfPeriod = new Date(date)
      if (period === 'MONTHLY') {
        startOfPeriod.setDate(1)
      } else if (period === 'QUARTERLY') {
        const quarter = Math.floor(startOfPeriod.getMonth() / 3)
        startOfPeriod.setMonth(quarter * 3, 1)
      } else if (period === 'YEARLY') {
        startOfPeriod.setMonth(0, 1)
      }
      where.date = { gte: startOfPeriod }
    }

    const kpis = await prisma.operationsKPI.findMany({ where })

    const onTrack = kpis.filter((k) => k.status === 'ON_TRACK').length
    const atRisk = kpis.filter((k) => k.status === 'AT_RISK').length
    const offTrack = kpis.filter((k) => k.status === 'OFF_TRACK').length
    const exceeded = kpis.filter((k) => k.status === 'EXCEEDED').length

    const avgPerformance =
      kpis.length > 0
        ? Number(
            (
              kpis.reduce(
                (sum, k) =>
                  sum + (Number(k.currentValue) / Number(k.targetValue)) * 100,
                0
              ) / kpis.length
            ).toFixed(1)
          )
        : 0

    return {
      total: kpis.length,
      onTrack,
      atRisk,
      offTrack,
      exceeded,
      avgPerformance,
    }
  }

  /**
   * Calculate KPI status
   */
  static calculateKPIStatus(
    currentValue: number,
    targetValue: number
  ): KPIStatus {
    const variance = ((currentValue - targetValue) / targetValue) * 100

    if (variance >= 10) return 'EXCEEDED'
    if (variance <= -20) return 'OFF_TRACK'
    if (variance <= -10) return 'AT_RISK'
    return 'ON_TRACK'
  }

  /**
   * Calculate KPI trend
   */
  static calculateKPITrend(
    currentValue: number,
    previousValue: number
  ): KPITrend {
    if (currentValue > previousValue) return 'INCREASING'
    if (currentValue < previousValue) return 'DECLINING'
    return 'STABLE'
  }

  /**
   * Get quality statistics
   */
  static async getQualityStats(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<QualityStats> {
    const where: any = { tenantId }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }

    const checks = await prisma.operationsQualityCheck.findMany({ where })

    const totalPassed = checks.reduce((sum, c) => sum + c.passed, 0)
    const totalFailed = checks.reduce((sum, c) => sum + c.failed, 0)
    const overallQuality =
      checks.length > 0
        ? Number(
            (
              checks.reduce((sum, c) => sum + Number(c.passRate), 0) /
              checks.length
            ).toFixed(1)
          )
        : 0

    const byType: Record<string, { passed: number; failed: number; rate: number }> =
      {}
    checks.forEach((check) => {
      if (!byType[check.checkType]) {
        byType[check.checkType] = { passed: 0, failed: 0, rate: 0 }
      }
      byType[check.checkType].passed += check.passed
      byType[check.checkType].failed += check.failed
    })

    // Calculate rates
    Object.keys(byType).forEach((type) => {
      const total = byType[type].passed + byType[type].failed
      byType[type].rate =
        total > 0
          ? Number(((byType[type].passed / total) * 100).toFixed(1))
          : 0
    })

    return {
      totalChecks: checks.length,
      totalPassed,
      totalFailed,
      overallQuality,
      byType,
    }
  }

  /**
   * Calculate quality pass rate
   */
  static calculatePassRate(passed: number, failed: number): number {
    const total = passed + failed
    if (total === 0) return 0
    return Number(((passed / total) * 100).toFixed(2))
  }

  /**
   * Determine quality status
   */
  static determineQualityStatus(passRate: number): 'PASS' | 'FAIL' | 'WARNING' {
    if (passRate < 80) return 'FAIL'
    if (passRate < 90) return 'WARNING'
    return 'PASS'
  }

  /**
   * Calculate incentive amount
   */
  static calculateIncentiveAmount(
    baseAmount: number,
    performanceScore: number,
    type: 'PERFORMANCE' | 'QUALITY' | 'PRODUCTIVITY'
  ): number {
    // Different multipliers based on type
    const multipliers = {
      PERFORMANCE: 1.0,
      QUALITY: 1.2, // Quality is weighted higher
      PRODUCTIVITY: 0.9,
    }

    const multiplier = multipliers[type] || 1.0
    return Number((baseAmount * (performanceScore / 100) * multiplier).toFixed(2))
  }

  /**
   * Get recognition statistics
   */
  static async getRecognitionStats(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: any = { tenantId, status: 'PUBLISHED' }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }

    const recognitions = await prisma.operationsRecognition.findMany({ where })

    const byCategory: Record<string, number> = {}
    recognitions.forEach((rec) => {
      byCategory[rec.category] = (byCategory[rec.category] || 0) + 1
    })

    return {
      total: recognitions.length,
      byCategory,
      topPerformers: recognitions.length,
    }
  }
}

