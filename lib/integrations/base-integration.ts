/**
 * Base Integration Framework
 * 
 * Provides a foundation for all external integrations
 */

import { prisma } from '@/lib/prisma'

export interface IntegrationConfig {
  id: string
  tenantId: string
  provider: string
  type: 'CRM' | 'COMMUNICATION' | 'MARKETING' | 'PRODUCTIVITY' | 'FINANCIAL' | 'DOCUMENT' | 'OTHER'
  name: string
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'PENDING'
  credentials: Record<string, any> // Encrypted credentials
  settings: Record<string, any>
  lastSyncAt?: Date
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

export interface SyncResult {
  success: boolean
  recordsSynced: number
  errors: string[]
  lastSyncAt: Date
}

export abstract class BaseIntegration {
  protected config: IntegrationConfig
  protected tenantId: string

  constructor(config: IntegrationConfig) {
    this.config = config
    this.tenantId = config.tenantId
  }

  /**
   * Test connection to external service
   */
  abstract testConnection(): Promise<boolean>

  /**
   * Sync data from external service
   */
  abstract syncFromExternal(): Promise<SyncResult>

  /**
   * Sync data to external service
   */
  abstract syncToExternal(data: any[]): Promise<SyncResult>

  /**
   * Get integration status
   */
  async getStatus(): Promise<IntegrationConfig['status']> {
    try {
      const isConnected = await this.testConnection()
      return isConnected ? 'CONNECTED' : 'ERROR'
    } catch (error) {
      return 'ERROR'
    }
  }

  /**
   * Update integration status
   */
  protected async updateStatus(status: IntegrationConfig['status'], errorMessage?: string) {
    await prisma.salesIntegration.update({
      where: { id: this.config.id },
      data: {
        status: status as any,
        errorMessage: errorMessage || null,
        lastSyncAt: status === 'CONNECTED' ? new Date() : undefined,
      },
    })
  }

  /**
   * Decrypt credentials
   */
  protected decryptCredentials(): Record<string, any> {
    const { decryptCredentials } = require('./credential-encryption')
    
    // If credentials is already an object (not encrypted), return as-is
    if (typeof this.config.credentials === 'object' && !Array.isArray(this.config.credentials)) {
      return this.config.credentials
    }
    
    // If credentials is a string, try to decrypt it
    if (typeof this.config.credentials === 'string') {
      try {
        return decryptCredentials(this.config.credentials)
      } catch (error) {
        console.error('Failed to decrypt credentials, returning as-is:', error)
        return {}
      }
    }
    
    return this.config.credentials || {}
  }

  /**
   * Encrypt credentials
   */
  protected encryptCredentials(credentials: Record<string, any>): string {
    const { encryptCredentials } = require('./credential-encryption')
    return encryptCredentials(credentials)
  }
}

