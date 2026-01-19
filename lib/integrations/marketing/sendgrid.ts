/**
 * SendGrid Integration
 * 
 * Email delivery and contact management
 */

import { BaseIntegration, SyncResult } from '../base-integration'

export class SendGridIntegration extends BaseIntegration {
  private apiKey?: string

  async testConnection(): Promise<boolean> {
    try {
      const credentials = this.decryptCredentials()
      this.apiKey = credentials.apiKey

      if (!this.apiKey) {
        throw new Error('SendGrid API key not configured')
      }

      // Test connection by getting user profile
      const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`SendGrid API error: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('SendGrid connection test failed:', error)
      await this.updateStatus('ERROR', (error as Error).message)
      return false
    }
  }

  async syncFromExternal(): Promise<SyncResult> {
    // SendGrid is primarily for sending emails, not syncing contacts
    return {
      success: true,
      recordsSynced: 0,
      errors: [],
      lastSyncAt: new Date(),
    }
  }

  async syncToExternal(data: any[]): Promise<SyncResult> {
    // Not applicable for SendGrid
    return {
      success: true,
      recordsSynced: 0,
      errors: [],
      lastSyncAt: new Date(),
    }
  }

  /**
   * Send transactional email
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    htmlContent: string,
    textContent?: string,
    fromEmail?: string,
    fromName?: string
  ): Promise<boolean> {
    try {
      if (!this.apiKey) {
        await this.testConnection()
      }

      const recipients = Array.isArray(to) ? to : [to]
      const personalizations = recipients.map(email => ({
        to: [{ email }],
      }))

      const emailData = {
        personalizations,
        from: {
          email: fromEmail || this.config.settings?.fromEmail || 'noreply@example.com',
          name: fromName || this.config.settings?.fromName || 'Sales Team',
        },
        subject,
        content: [
          {
            type: 'text/plain',
            value: textContent || htmlContent.replace(/<[^>]*>/g, ''),
          },
          {
            type: 'text/html',
            value: htmlContent,
          },
        ],
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`SendGrid API error: ${error}`)
      }

      return true
    } catch (error) {
      console.error('Error sending email via SendGrid:', error)
      return false
    }
  }

  /**
   * Add contact to SendGrid
   */
  async addContact(email: string, firstName?: string, lastName?: string, customFields?: Record<string, any>): Promise<boolean> {
    try {
      if (!this.apiKey) {
        await this.testConnection()
      }

      const contactData: any = {
        email,
      }

      if (firstName || lastName) {
        contactData.first_name = firstName
        contactData.last_name = lastName
      }

      if (customFields) {
        contactData.custom_fields = customFields
      }

      const response = await fetch('https://api.sendgrid.com/v3/marketing/contacts', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contacts: [contactData],
        }),
      })

      return response.ok
    } catch (error) {
      console.error('Error adding contact to SendGrid:', error)
      return false
    }
  }
}

