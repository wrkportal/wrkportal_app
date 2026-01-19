/**
 * Slack Integration
 * 
 * Send notifications and updates to Slack channels
 */

import { BaseIntegration, SyncResult } from '../base-integration'

export class SlackIntegration extends BaseIntegration {
  private webhookUrl?: string
  private botToken?: string

  async testConnection(): Promise<boolean> {
    try {
      const credentials = this.decryptCredentials()
      this.webhookUrl = credentials.webhookUrl
      this.botToken = credentials.botToken

      if (this.botToken) {
        // Test bot token
        const { WebClient } = require('@slack/web-api')
        const client = new WebClient(this.botToken)
        const result = await client.auth.test()
        return result.ok === true
      } else if (this.webhookUrl) {
        // Test webhook
        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'Connection test' }),
        })
        return response.ok
      }

      throw new Error('Slack credentials not configured')
    } catch (error) {
      console.error('Slack connection test failed:', error)
      await this.updateStatus('ERROR', (error as Error).message)
      return false
    }
  }

  async syncFromExternal(): Promise<SyncResult> {
    // Slack is primarily one-way (we send to Slack)
    return {
      success: true,
      recordsSynced: 0,
      errors: [],
      lastSyncAt: new Date(),
    }
  }

  async syncToExternal(data: any[]): Promise<SyncResult> {
    // Not applicable for Slack
    return {
      success: true,
      recordsSynced: 0,
      errors: [],
      lastSyncAt: new Date(),
    }
  }

  /**
   * Send notification to Slack
   */
  async sendNotification(channel: string, message: string, attachments?: any[]): Promise<boolean> {
    try {
      const credentials = this.decryptCredentials()
      const webhookUrl = credentials.webhookUrl || this.webhookUrl
      const botToken = credentials.botToken || this.botToken

      if (webhookUrl) {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel,
            text: message,
            attachments,
          }),
        })
        return response.ok
      } else if (botToken) {
        // Use Slack Web API
        const { WebClient } = require('@slack/web-api')
        const client = new WebClient(botToken)
        
        const result = await client.chat.postMessage({
          channel,
          text: message,
          attachments,
        })
        
        return result.ok === true
      }

      return false
    } catch (error) {
      console.error('Error sending Slack notification:', error)
      return false
    }
  }

  /**
   * Send opportunity update to Slack
   */
  async notifyOpportunityUpdate(opportunity: any): Promise<boolean> {
    const message = `*Opportunity Update*\n*${opportunity.name}* - ${opportunity.stage}\nAmount: $${opportunity.amount}\nOwner: ${opportunity.owner?.name}`
    
    const attachments = [
      {
        color: opportunity.stage === 'CLOSED_WON' ? 'good' : 'warning',
        fields: [
          { title: 'Stage', value: opportunity.stage, short: true },
          { title: 'Amount', value: `$${opportunity.amount}`, short: true },
        ],
      },
    ]

    return await this.sendNotification(
      this.config.settings.channel || '#sales',
      message,
      attachments
    )
  }
}

