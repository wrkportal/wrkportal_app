import { prisma } from '@/lib/prisma'
import {
  ComplianceIssueSeverity,
  RiskLevel,
  RiskLikelihood,
  RiskImpact,
} from '@prisma/client'

export interface ComplianceStats {
  pendingTrainings: number
  overdueTrainings: number
  openIssues: number
  highSeverityIssues: number
  identifiedRisks: number
  highRisks: number
  openIncidents: number
  criticalIncidents: number
}

export class ComplianceService {
  /**
   * Get overall compliance statistics
   */
  static async getComplianceStats(
    tenantId: string
  ): Promise<ComplianceStats> {
    const now = new Date()

    const [
      pendingTrainings,
      overdueTrainings,
      openIssues,
      highSeverityIssues,
      identifiedRisks,
      highRisks,
      openIncidents,
      criticalIncidents,
    ] = await Promise.all([
      prisma.operationsComplianceTraining.count({
        where: {
          tenantId,
          status: 'PENDING',
        },
      }),
      prisma.operationsComplianceTraining.count({
        where: {
          tenantId,
          status: 'PENDING',
          dueDate: { lt: now },
        },
      }),
      prisma.operationsComplianceIssue.count({
        where: {
          tenantId,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      }),
      prisma.operationsComplianceIssue.count({
        where: {
          tenantId,
          severity: { in: ['HIGH', 'CRITICAL'] },
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      }),
      prisma.operationsRisk.count({
        where: { tenantId },
      }),
      prisma.operationsRisk.count({
        where: {
          tenantId,
          riskLevel: { in: ['HIGH', 'CRITICAL'] },
        },
      }),
      prisma.operationsIncident.count({
        where: {
          tenantId,
          status: { in: ['OPEN', 'INVESTIGATING'] },
        },
      }),
      prisma.operationsIncident.count({
        where: {
          tenantId,
          severity: 'CRITICAL',
          status: { in: ['OPEN', 'INVESTIGATING'] },
        },
      }),
    ])

    return {
      pendingTrainings,
      overdueTrainings,
      openIssues,
      highSeverityIssues,
      identifiedRisks,
      highRisks,
      openIncidents,
      criticalIncidents,
    }
  }

  /**
   * Calculate training completion rate
   */
  static async getTrainingCompletionRate(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const where: any = { tenantId }
    if (startDate || endDate) {
      where.assignedDate = {}
      if (startDate) where.assignedDate.gte = startDate
      if (endDate) where.assignedDate.lte = endDate
    }

    const [total, completed] = await Promise.all([
      prisma.operationsComplianceTraining.count({ where }),
      prisma.operationsComplianceTraining.count({
        where: { ...where, status: 'COMPLETED' },
      }),
    ])

    return total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0
  }

  /**
   * Check if training is overdue
   */
  static isTrainingOverdue(dueDate: Date, status: string): boolean {
    return status === 'PENDING' && new Date(dueDate) < new Date()
  }

  /**
   * Calculate risk level
   */
  static calculateRiskLevel(
    likelihood: RiskLikelihood,
    impact: RiskImpact
  ): RiskLevel {
    // Risk matrix
    const matrix: Record<string, Record<string, RiskLevel>> = {
      LOW: {
        LOW: 'LOW',
        MEDIUM: 'LOW',
        HIGH: 'MEDIUM',
        CRITICAL: 'MEDIUM',
      },
      MEDIUM: {
        LOW: 'LOW',
        MEDIUM: 'MEDIUM',
        HIGH: 'HIGH',
        CRITICAL: 'HIGH',
      },
      HIGH: {
        LOW: 'MEDIUM',
        MEDIUM: 'HIGH',
        HIGH: 'HIGH',
        CRITICAL: 'CRITICAL',
      },
    }

    return matrix[likelihood]?.[impact] || 'MEDIUM'
  }

  /**
   * Get risk score (numeric)
   */
  static getRiskScore(
    likelihood: RiskLikelihood,
    impact: RiskImpact
  ): number {
    const likelihoodScores = { LOW: 1, MEDIUM: 2, HIGH: 3 }
    const impactScores = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4,
    }

    return (
      (likelihoodScores[likelihood] || 2) * (impactScores[impact] || 2)
    )
  }

  /**
   * Get compliance score
   */
  static async getComplianceScore(tenantId: string): Promise<number> {
    const stats = await this.getComplianceStats(tenantId)

    // Calculate score based on various factors
    const totalTrainings = await prisma.operationsComplianceTraining.count({
      where: { tenantId },
    })
    const trainingScore =
      totalTrainings > 0
        ? ((totalTrainings - stats.overdueTrainings) / totalTrainings) * 100
        : 100

    const totalIssues = await prisma.operationsComplianceIssue.count({
      where: { tenantId },
    })
    const resolvedIssues = totalIssues - stats.openIssues
    const issueScore =
      totalIssues > 0 ? (resolvedIssues / totalIssues) * 100 : 100

    const totalRisks = await prisma.operationsRisk.count({ where: { tenantId } })
    const mitigatedRisks = await prisma.operationsRisk.count({
      where: {
        tenantId,
        mitigationStatus: 'MITIGATED',
      },
    })
    const riskScore =
      totalRisks > 0 ? (mitigatedRisks / totalRisks) * 100 : 100

    // Weighted average
    const complianceScore =
      trainingScore * 0.3 + issueScore * 0.3 + riskScore * 0.4

    return Number(complianceScore.toFixed(1))
  }

  /**
   * Get incident trends
   */
  static async getIncidentTrends(
    tenantId: string,
    months: number = 6
  ): Promise<Array<{ month: string; count: number; severity: string }>> {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const incidents = await prisma.operationsIncident.findMany({
      where: {
        tenantId,
        reportedDate: { gte: startDate },
      },
      orderBy: {
        reportedDate: 'asc',
      },
    })

    const trends: Record<
      string,
      { count: number; severity: string }
    > = {}

    incidents.forEach((incident) => {
      const month = new Date(incident.reportedDate)
        .toISOString()
        .slice(0, 7) // YYYY-MM

      if (!trends[month]) {
        trends[month] = { count: 0, severity: 'MEDIUM' }
      }

      trends[month].count++
      // Track highest severity
      const severityOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }
      if (
        severityOrder[incident.severity] >
        severityOrder[trends[month].severity as keyof typeof severityOrder]
      ) {
        trends[month].severity = incident.severity
      }
    })

    return Object.entries(trends).map(([month, data]) => ({
      month,
      ...data,
    }))
  }

  /**
   * Check compliance status
   */
  static async getComplianceStatus(tenantId: string): Promise<{
    status: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT'
    score: number
    issues: string[]
  }> {
    const score = await this.getComplianceScore(tenantId)
    const stats = await this.getComplianceStats(tenantId)

    const issues: string[] = []

    if (stats.overdueTrainings > 0) {
      issues.push(`${stats.overdueTrainings} overdue training(s)`)
    }
    if (stats.criticalIncidents > 0) {
      issues.push(`${stats.criticalIncidents} critical incident(s)`)
    }
    if (stats.highRisks > 0) {
      issues.push(`${stats.highRisks} high risk(s)`)
    }

    let status: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT' = 'COMPLIANT'
    if (score < 70 || stats.criticalIncidents > 0) {
      status = 'NON_COMPLIANT'
    } else if (score < 85 || issues.length > 0) {
      status = 'AT_RISK'
    }

    return {
      status,
      score,
      issues,
    }
  }
}

