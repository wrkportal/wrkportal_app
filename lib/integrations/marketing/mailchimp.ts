/**
 * Mailchimp Integration
 * 
 * Sync contacts and manage email campaigns
 */

import { BaseIntegration, SyncResult } from '../base-integration'
import { applyFieldMappings } from '../field-mapping'

export class MailchimpIntegration extends BaseIntegration {
  private apiKey?: string
  private serverPrefix?: string

  async testConnection(): Promise<boolean> {
    try {
      const credentials = this.decryptCredentials()
      this.apiKey = credentials.apiKey
      this.serverPrefix = credentials.serverPrefix

      if (!this.apiKey) {
        throw new Error('Mailchimp API key not configured')
      }

      // Extract server prefix from API key if not provided
      if (!this.serverPrefix && this.apiKey.includes('-')) {
        this.serverPrefix = this.apiKey.split('-')[1]
      }

      if (!this.serverPrefix) {
        throw new Error('Mailchimp server prefix required')
      }

      // Test connection by getting account info
      const response = await fetch(`https://${this.serverPrefix}.api.mailchimp.com/3.0/`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Mailchimp API error: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('Mailchimp connection test failed:', error)
      await this.updateStatus('ERROR', (error as Error).message)
      return false
    }
  }

  async syncFromExternal(): Promise<SyncResult> {
    const errors: string[] = []
    let recordsSynced = 0

    try {
      if (!this.apiKey || !this.serverPrefix) {
        await this.testConnection()
      }

      // Get default list ID from settings
      const listId = this.config.settings?.listId
      if (!listId) {
        throw new Error('Mailchimp list ID not configured')
      }

      // Sync contacts from Mailchimp
      const contacts = await this.fetchContacts(listId)
      recordsSynced += await this.syncContactsToLocal(contacts)

      await this.updateStatus('CONNECTED')
    } catch (error) {
      errors.push((error as Error).message)
      await this.updateStatus('ERROR', (error as Error).message)
    }

    return {
      success: errors.length === 0,
      recordsSynced,
      errors,
      lastSyncAt: new Date(),
    }
  }

  async syncToExternal(data: any[]): Promise<SyncResult> {
    const errors: string[] = []
    let recordsSynced = 0

    try {
      if (!this.apiKey || !this.serverPrefix) {
        await this.testConnection()
      }

      const listId = this.config.settings?.listId
      if (!listId) {
        throw new Error('Mailchimp list ID not configured')
      }

      // Sync leads to Mailchimp
      for (const lead of data) {
        try {
          // Apply field mappings
          let mappedData: any = lead
          try {
            mappedData = await applyFieldMappings(
              this.config.id,
              this.tenantId,
              lead,
              'TO_EXTERNAL'
            )
            mappedData = { ...lead, ...mappedData }
          } catch (mappingError) {
            console.warn('Field mapping failed:', mappingError)
          }

          const contactData = {
            email_address: mappedData.email || lead.email,
            status: 'subscribed',
            merge_fields: {
              FNAME: mappedData.firstName || lead.firstName || '',
              LNAME: mappedData.lastName || lead.lastName || '',
              PHONE: mappedData.phone || lead.phone || '',
              COMPANY: mappedData.company || lead.company || '',
            },
          }

          // Upsert contact (create or update)
          const response = await fetch(
            `https://${this.serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members/${this.hashEmail(contactData.email_address)}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(contactData),
            }
          )

          if (!response.ok) {
            const error = await response.text()
            throw new Error(`Mailchimp API error: ${error}`)
          }

          recordsSynced++
        } catch (error: any) {
          errors.push(`Lead ${lead.id}: ${error.message}`)
        }
      }

      await this.updateStatus('CONNECTED')
    } catch (error) {
      errors.push((error as Error).message)
      await this.updateStatus('ERROR', (error as Error).message)
    }

    return {
      success: errors.length === 0,
      recordsSynced,
      errors,
      lastSyncAt: new Date(),
    }
  }

  private async fetchContacts(listId: string): Promise<any[]> {
    try {
      const allContacts: any[] = []
      let offset = 0
      const count = 1000

      do {
        const response = await fetch(
          `https://${this.serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members?count=${count}&offset=${offset}`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`Mailchimp API error: ${response.statusText}`)
        }

        const data = await response.json()
        allContacts.push(...(data.members || []))
        offset += count
      } while (allContacts.length % count === 0 && allContacts.length > 0)

      return allContacts
    } catch (error) {
      console.error('Error fetching Mailchimp contacts:', error)
      return []
    }
  }

  private async syncContactsToLocal(contacts: any[]): Promise<number> {
    const { prisma } = await import('@/lib/prisma')
    let synced = 0

    for (const contact of contacts) {
      try {
        const email = contact.email_address
        if (!email) continue

        // Apply field mappings
        let mappedData: any = {
          email: contact.email_address,
          firstName: contact.merge_fields?.FNAME,
          lastName: contact.merge_fields?.LNAME,
          phone: contact.merge_fields?.PHONE,
          company: contact.merge_fields?.COMPANY,
        }

        try {
          mappedData = await applyFieldMappings(
            this.config.id,
            this.tenantId,
            contact,
            'FROM_EXTERNAL'
          )
          mappedData = { ...mappedData, email: contact.email_address }
        } catch (mappingError) {
          console.warn('Field mapping failed:', mappingError)
        }

        const existing = await prisma.salesLead.findFirst({
          where: {
            tenantId: this.tenantId,
            email,
          },
        })

        if (existing) {
          await prisma.salesLead.update({
            where: { id: existing.id },
            data: {
              firstName: mappedData.firstName || contact.merge_fields?.FNAME || existing.firstName,
              lastName: mappedData.lastName || contact.merge_fields?.LNAME || existing.lastName,
              email,
              company: mappedData.company || contact.merge_fields?.COMPANY || existing.company,
              phone: mappedData.phone || contact.merge_fields?.PHONE || existing.phone,
            },
          })
        } else {
          await prisma.salesLead.create({
            data: {
              tenantId: this.tenantId,
              email,
              firstName: mappedData.firstName || contact.merge_fields?.FNAME || 'Unknown',
              lastName: mappedData.lastName || contact.merge_fields?.LNAME || '',
              company: mappedData.company || contact.merge_fields?.COMPANY,
              phone: mappedData.phone || contact.merge_fields?.PHONE,
              leadSource: 'EMAIL_MARKETING' as any,
              status: 'NEW' as any,
              ownerId: this.config.tenantId,
            },
          })
        }
        synced++
      } catch (error) {
        console.error('Error syncing contact:', error)
      }
    }

    return synced
  }

  /**
   * Hash email for Mailchimp API (MD5)
   */
  private hashEmail(email: string): string {
    // In production, use crypto.createHash('md5').update(email.toLowerCase()).digest('hex')
    // For now, return a placeholder - this should be implemented properly
    const crypto = require('crypto')
    return crypto.createHash('md5').update(email.toLowerCase()).digest('hex')
  }

  /**
   * Create a campaign
   */
  async createCampaign(
    subject: string,
    fromName: string,
    fromEmail: string,
    listId: string,
    htmlContent: string
  ): Promise<any> {
    try {
      if (!this.apiKey || !this.serverPrefix) {
        await this.testConnection()
      }

      const campaignData = {
        type: 'regular',
        recipients: {
          list_id: listId,
        },
        settings: {
          subject_line: subject,
          from_name: fromName,
          reply_to: fromEmail,
        },
      }

      const response = await fetch(
        `https://${this.serverPrefix}.api.mailchimp.com/3.0/campaigns`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(campaignData),
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Mailchimp API error: ${error}`)
      }

      const campaign = await response.json()

      // Set content
      await fetch(
        `https://${this.serverPrefix}.api.mailchimp.com/3.0/campaigns/${campaign.id}/content`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            html: htmlContent,
          }),
        }
      )

      return campaign
    } catch (error) {
      console.error('Error creating Mailchimp campaign:', error)
      throw error
    }
  }
}

