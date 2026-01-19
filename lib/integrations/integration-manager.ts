/**
 * Integration Manager
 * 
 * Manages all integrations and provides a unified interface
 */

import { prisma } from '@/lib/prisma'
import { BaseIntegration, IntegrationConfig } from './base-integration'
import { SalesforceIntegration } from './crm/salesforce'
import { HubSpotIntegration } from './crm/hubspot'
import { DynamicsIntegration } from './crm/dynamics'
import { SlackIntegration } from './communication/slack'
import { TeamsIntegration } from './communication/teams'
import { ZoomIntegration } from './communication/zoom'
import { WebexIntegration } from './communication/webex'
import { MailchimpIntegration } from './marketing/mailchimp'
import { SendGridIntegration } from './marketing/sendgrid'
import { DocuSignIntegration } from './productivity/docusign'
import { applyFieldMappings } from './field-mapping'

export class IntegrationManager {
  /**
   * Get integration instance
   */
  static async getIntegration(integrationId: string): Promise<BaseIntegration | null> {
    const integration = await prisma.salesIntegration.findUnique({
      where: { id: integrationId },
    })

    if (!integration) {
      return null
    }

    return this.createIntegrationInstance(integration as any)
  }

  /**
   * Create integration instance based on provider
   */
  static createIntegrationInstance(config: IntegrationConfig): BaseIntegration {
    switch (config.provider.toLowerCase()) {
      // CRM Integrations
      case 'salesforce':
        return new SalesforceIntegration(config)
      case 'hubspot':
        return new HubSpotIntegration(config)
      case 'dynamics':
      case 'microsoft-dynamics':
      case 'dynamics365':
        return new DynamicsIntegration(config)
      
      // Communication Integrations
      case 'slack':
        return new SlackIntegration(config)
      case 'teams':
      case 'microsoft-teams':
        return new TeamsIntegration(config)
      case 'zoom':
        return new ZoomIntegration(config)
      case 'webex':
        return new WebexIntegration(config)
      
      // Marketing Integrations
      case 'mailchimp':
        return new MailchimpIntegration(config)
      case 'sendgrid':
        return new SendGridIntegration(config)
      
      // Productivity Integrations
      case 'docusign':
        return new DocuSignIntegration(config)
      
      default:
        throw new Error(`Unknown integration provider: ${config.provider}`)
    }
  }

  /**
   * Create a new integration
   */
  static async createIntegration(
    tenantId: string,
    provider: string,
    type: 'CRM' | 'COMMUNICATION' | 'MARKETING' | 'PRODUCTIVITY' | 'FINANCIAL' | 'DOCUMENT' | 'OTHER',
    name: string,
    credentials: Record<string, any>,
    settings: Record<string, any>,
    createdById: string
  ): Promise<string> {
    // Encrypt credentials before storing
    const { encryptCredentials } = require('./credential-encryption')
    const encryptedCredentials = encryptCredentials(credentials)

    const integration = await prisma.salesIntegration.create({
      data: {
        tenantId,
        provider,
        type: type as any,
        name,
        credentials: encryptedCredentials as any,
        settings: settings as any,
        status: 'PENDING',
        createdById,
      },
    })

    // Test connection
    const instance = this.createIntegrationInstance(integration as any)
    const isConnected = await instance.testConnection()

    await prisma.salesIntegration.update({
      where: { id: integration.id },
      data: {
        status: isConnected ? 'CONNECTED' : 'ERROR',
      },
    })

    return integration.id
  }

  /**
   * Sync integration
   */
  static async syncIntegration(
    integrationId: string,
    direction?: 'FROM_EXTERNAL' | 'TO_EXTERNAL' | 'BIDIRECTIONAL'
  ): Promise<void> {
    const integration = await prisma.salesIntegration.findUnique({
      where: { id: integrationId },
    })

    if (!integration) {
      throw new Error('Integration not found')
    }

    const instance = this.createIntegrationInstance(integration as any)
    const syncDirection = direction || (integration.syncDirection as any)

    // Create sync log
    const syncLog = await prisma.salesIntegrationSyncLog.create({
      data: {
        integrationId,
        direction: syncDirection as any,
        status: 'IN_PROGRESS',
      },
    })

    try {
      let result

      if (syncDirection === 'FROM_EXTERNAL' || syncDirection === 'BIDIRECTIONAL') {
        result = await instance.syncFromExternal()
      } else {
        result = await instance.syncToExternal([])
      }

      await prisma.salesIntegrationSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: result.success ? 'SUCCESS' : 'FAILED',
          recordsSynced: result.recordsSynced,
          errors: result.errors as any,
          completedAt: new Date(),
        },
      })

      await prisma.salesIntegration.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
        },
      })
    } catch (error) {
      await prisma.salesIntegrationSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          errors: [(error as Error).message] as any,
          completedAt: new Date(),
        },
      })
      throw error
    }
  }

  /**
   * Get all integrations for tenant
   */
  static async getTenantIntegrations(tenantId: string) {
    return await prisma.salesIntegration.findMany({
      where: { tenantId },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        syncLogs: {
          orderBy: {
            startedAt: 'desc',
          },
          take: 5,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Get integration sync history
   */
  static async getSyncHistory(integrationId: string, limit: number = 50) {
    return await prisma.salesIntegrationSyncLog.findMany({
      where: { integrationId },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
    })
  }
}

