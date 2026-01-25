import { prisma } from '@/lib/prisma'
import { RiskLevel } from '@prisma/client'

// Type definitions for risk assessment
type RiskLikelihood = 'LOW' | 'MEDIUM' | 'HIGH'
type RiskImpact = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// Extended Prisma client type to include operations models that may not be in schema yet
type ExtendedPrismaClient = typeof prisma & {
  operationsComplianceTraining?: {
    count: (args?: { where?: any }) => Promise<number>
  }
  operationsComplianceIssue?: {
    count: (args?: { where?: any }) => Promise<number>
  }
  operationsRisk?: {
    count: (args?: { where?: any }) => Promise<number>
  }
  operationsIncident?: {
    count: (args?: { where?: any }) => Promise<number>
    findMany: (args?: { where?: any; orderBy?: any }) => Promise<any[]>
  }
}

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

    // Type assertions needed: These models may not be in Prisma schema yet
    // or Prisma Client needs to be regenerated
    const prismaClient = prisma as ExtendedPrismaClient
    
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
      prismaClient.operationsComplianceTraining?.count({
        where: {
          tenantId,
          status: 'PENDING',
        },
      }) || Promise.resolve(0),
      prismaClient.operationsComplianceTraining?.count({
        where: {
          tenantId,
          status: 'PENDING',
          dueDate: { lt: now },
        },
      }) || Promise.resolve(0),
      prismaClient.operationsComplianceIssue?.count({
        where: {
          tenantId,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      }) || Promise.resolve(0),
      prismaClient.operationsComplianceIssue?.count({
        where: {
          tenantId,
          severity: { in: ['HIGH', 'CRITICAL'] },
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      }) || Promise.resolve(0),
      prismaClient.operationsRisk?.count({
        where: { tenantId },
      }) || Promise.resolve(0),
      prismaClient.operationsRisk?.count({
        where: {
          tenantId,
          riskLevel: { in: ['HIGH', 'CRITICAL'] },
        },
      }) || Promise.resolve(0),
      prismaClient.operationsIncident?.count({
        where: {
          tenantId,
          status: { in: ['OPEN', 'INVESTIGATING'] },
        },
      }) || Promise.resolve(0),
      prismaClient.operationsIncident?.count({
        where: {
          tenantId,
          severity: 'CRITICAL',
          status: { in: ['OPEN', 'INVESTIGATING'] },
        },
      }) || Promise.resolve(0),
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

    // Type assertion needed: These models may not be in Prisma schema yet
    const prismaClient = prisma as ExtendedPrismaClient
    
    const [total, completed] = await Promise.all([
      (prismaClient.operationsComplianceTraining?.count({ where }) || Promise.resolve(0)),
      (prismaClient.operationsComplianceTraining?.count({
        where: { ...where, status: 'COMPLETED' },
      }) || Promise.resolve(0)),
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

    // Type assertion needed: These models may not be in Prisma schema yet
    const prismaClient = prisma as ExtendedPrismaClient
    
    // Calculate score based on various factors
    const totalTrainings = await (prismaClient.operationsComplianceTraining?.count({
      where: { tenantId },
    }) || Promise.resolve(0))
    const trainingScore =
      totalTrainings > 0
        ? ((totalTrainings - stats.overdueTrainings) / totalTrainings) * 100
        : 100

    const totalIssues = await (prismaClient.operationsComplianceIssue?.count({
      where: { tenantId },
    }) || Promise.resolve(0))
    const resolvedIssues = totalIssues - stats.openIssues
    const issueScore =
      totalIssues > 0 ? (resolvedIssues / totalIssues) * 100 : 100

    const totalRisks = await (prismaClient.operationsRisk?.count({ where: { tenantId } }) || Promise.resolve(0))
    const mitigatedRisks = await (prismaClient.operationsRisk?.count({
      where: {
        tenantId,
        mitigationStatus: 'MITIGATED',
      },
    }) || Promise.resolve(0))
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

    // Type assertion needed: These models may not be in Prisma schema yet
    const prismaClient = prisma as ExtendedPrismaClient
    
    const incidents = await (prismaClient.operationsIncident?.findMany({
      where: {
        tenantId,
        reportedDate: { gte: startDate },
      },
      orderBy: {
        reportedDate: 'asc',
      },
    }) || Promise.resolve([]))

    const trends: Record<
      string,
      { count: number; severity: string }
    > = {}

    incidents.forEach((incident: any) => {
      const month = new Date(incident.reportedDate)
        .toISOString()
        .slice(0, 7) // YYYY-MM

      if (!trends[month]) {
        trends[month] = { count: 0, severity: 'MEDIUM' }
      }

      trends[month].count++
      // Track highest severity
      const severityOrder: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }
      const incidentSeverity = incident.severity as string
      const currentSeverity = trends[month].severity as string
      if (
        (severityOrder[incidentSeverity] || 0) >
        (severityOrder[currentSeverity] || 0)
      ) {
        trends[month].severity = incidentSeverity
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

