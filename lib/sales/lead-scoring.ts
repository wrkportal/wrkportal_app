/**
 * Advanced Lead Scoring System
 * Configurable scoring based on multiple parameters
 */

import { prisma } from '@/lib/prisma'

export interface LeadScoringConfig {
  parameters: {
    [key: string]: {
      weight: number
      conditions: Array<{
        field: string
        operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in'
        value: any
        points: number
      }>
    }
  }
  thresholds: {
    hot: number
    warm: number
    cold: number
  }
  autoConvertThreshold?: number
}

export class LeadScoringEngine {
  /**
   * Calculate lead score based on configuration
   */
  static async calculateScore(leadId: string, tenantId: string): Promise<number> {
    try {
      const lead = await prisma.salesLead.findUnique({
        where: { id: leadId },
      })

      if (!lead) {
        return 0
      }

      // Get scoring configuration (can be stored in tenant settings)
      const config = await this.getScoringConfig(tenantId)

      let totalScore = 0

      // Score each parameter
      for (const [paramName, paramConfig] of Object.entries(config.parameters)) {
        const paramScore = this.scoreParameter(lead, paramName, paramConfig)
        totalScore += paramScore * paramConfig.weight
      }

      // Update lead score and rating
      const rating = this.getRating(totalScore, config.thresholds)

      await prisma.salesLead.update({
        where: { id: leadId },
        data: {
          score: Math.round(totalScore),
          rating,
        },
      })

      // Check if should auto-convert to opportunity
      if (config.autoConvertThreshold && totalScore >= config.autoConvertThreshold) {
        if (lead.status !== 'QUALIFIED' && lead.status !== 'CONVERTED') {
          await prisma.salesLead.update({
            where: { id: leadId },
            data: {
              status: 'QUALIFIED',
            },
          })

          // Trigger automation for qualified lead
          const { SalesAutomationEngine } = await import('./automation-engine')
          await SalesAutomationEngine.trigger({
            tenantId,
            triggerType: 'LEAD_SCORED',
            data: { leadId, score: totalScore, lead },
          })
        }
      }

      return Math.round(totalScore)
    } catch (error) {
      console.error('Lead scoring error:', error)
      return 0
    }
  }

  /**
   * Score a specific parameter
   */
  static scoreParameter(lead: any, paramName: string, paramConfig: any): number {
    let score = 0

    for (const condition of paramConfig.conditions) {
      const fieldValue = this.getFieldValue(lead, condition.field)
      const matches = this.evaluateCondition(fieldValue, condition.operator, condition.value)

      if (matches) {
        score += condition.points
      }
    }

    return score
  }

  /**
   * Get field value from lead object
   */
  static getFieldValue(lead: any, fieldPath: string): any {
    const parts = fieldPath.split('.')
    let value = lead
    for (const part of parts) {
      value = value?.[part]
      if (value === undefined) return null
    }
    return value
  }

  /**
   * Evaluate a single condition
   */
  static evaluateCondition(value: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return value === expectedValue
      case 'contains':
        return String(value).toLowerCase().includes(String(expectedValue).toLowerCase())
      case 'greater_than':
        return Number(value) > Number(expectedValue)
      case 'less_than':
        return Number(value) < Number(expectedValue)
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(value)
      default:
        return false
    }
  }

  /**
   * Get rating based on score and thresholds
   */
  static getRating(score: number, thresholds: any): 'HOT' | 'WARM' | 'COLD' {
    if (score >= thresholds.hot) {
      return 'HOT'
    } else if (score >= thresholds.warm) {
      return 'WARM'
    } else {
      return 'COLD'
    }
  }

  /**
   * Get scoring configuration (default or from tenant settings)
   */
  static async getScoringConfig(tenantId: string): Promise<LeadScoringConfig> {
    // Try to get from tenant settings
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    })

    if (tenant?.settings && (tenant.settings as any).leadScoring) {
      return (tenant.settings as any).leadScoring
    }

    // Return default configuration
    return {
      parameters: {
        company: {
          weight: 1.0,
          conditions: [
            { field: 'company', operator: 'contains', value: '', points: 10 },
            { field: 'company', operator: 'contains', value: 'inc', points: 5 },
            { field: 'company', operator: 'contains', value: 'corp', points: 5 },
          ],
        },
        contact: {
          weight: 1.0,
          conditions: [
            { field: 'phone', operator: 'contains', value: '', points: 5 },
            { field: 'mobile', operator: 'contains', value: '', points: 5 },
            { field: 'title', operator: 'contains', value: '', points: 5 },
          ],
        },
        source: {
          weight: 1.5,
          conditions: [
            { field: 'leadSource', operator: 'equals', value: 'WEB_FORM', points: 10 },
            { field: 'leadSource', operator: 'equals', value: 'EVENT', points: 15 },
            { field: 'leadSource', operator: 'equals', value: 'LINKEDIN', points: 12 },
            { field: 'leadSource', operator: 'equals', value: 'EMAIL', points: 8 },
          ],
        },
        engagement: {
          weight: 1.2,
          conditions: [
            { field: 'status', operator: 'equals', value: 'CONTACTED', points: 10 },
            { field: 'status', operator: 'equals', value: 'QUALIFIED', points: 20 },
          ],
        },
      },
      thresholds: {
        hot: 30,
        warm: 15,
        cold: 0,
      },
      autoConvertThreshold: 25,
    }
  }

  /**
   * Update scoring configuration
   */
  static async updateScoringConfig(tenantId: string, config: LeadScoringConfig) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    })

    const settings = (tenant?.settings as any) || {}

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          leadScoring: config,
        },
      },
    })
  }
}

