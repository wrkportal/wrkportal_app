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
    const integration = await prisma.integration.findUnique({
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

    const integration = await prisma.integration.create({
      data: {
        tenantId,
        type: type as any,
        name,
        description: provider ? `Integration with ${provider}` : undefined,
        configuration: {
          credentials: encryptedCredentials,
          settings: settings,
          provider: provider,
        } as any,
        status: 'INACTIVE',
        createdById,
      },
    })

    // Test connection
    const instance = this.createIntegrationInstance(integration as any)
    const isConnected = await instance.testConnection()

    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        status: isConnected ? 'ACTIVE' : 'ERROR',
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
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    })

    if (!integration) {
      throw new Error('Integration not found')
    }

    const instance = this.createIntegrationInstance(integration as any)
    const syncDirection = direction || (integration.syncDirection as any)

    // Create sync job
    const syncJob = await prisma.integrationSyncJob.create({
      data: {
        integrationId,
        tenantId: integration.tenantId,
        syncType: syncDirection === 'BIDIRECTIONAL' ? 'FULL_SYNC' : 'INCREMENTAL',
        status: 'RUNNING',
        configuration: { direction: syncDirection },
        startedAt: new Date(),
      },
    })

    try {
      let result

      if (syncDirection === 'FROM_EXTERNAL' || syncDirection === 'BIDIRECTIONAL') {
        result = await instance.syncFromExternal()
      } else {
        result = await instance.syncToExternal([])
      }

      await prisma.integrationSyncJob.update({
        where: { id: syncJob.id },
        data: {
          status: result.success ? 'COMPLETED' : 'FAILED',
          recordsProcessed: result.recordsSynced,
          recordsCreated: result.recordsSynced,
          recordsFailed: result.errors.length,
          errorMessage: result.errors.length > 0 ? result.errors.join(', ') : null,
          completedAt: new Date(),
        },
      })

      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
        },
      })
    } catch (error) {
      await prisma.integrationSyncJob.update({
        where: { id: syncJob.id },
        data: {
          status: 'FAILED',
          errorMessage: (error as Error).message,
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
    return await prisma.integration.findMany({
      where: { tenantId },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        syncJobs: {
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
    return await prisma.integrationSyncJob.findMany({
      where: { integrationId },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
    })
  }
}

