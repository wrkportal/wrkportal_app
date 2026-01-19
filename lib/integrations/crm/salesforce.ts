/**
 * Salesforce Integration
 * 
 * Bi-directional sync with Salesforce CRM
 */

import { BaseIntegration, SyncResult } from '../base-integration'
import { applyFieldMappings } from '../field-mapping'

export class SalesforceIntegration extends BaseIntegration {
  private client: any // Salesforce client instance

  async testConnection(): Promise<boolean> {
    try {
      const credentials = this.decryptCredentials()
      
      if (!credentials.accessToken && !credentials.username) {
        throw new Error('Salesforce credentials not configured')
      }

      const { Connection } = require('jsforce')
      
      // If we have access token, use it directly
      if (credentials.accessToken && credentials.instanceUrl) {
        this.client = new Connection({
          accessToken: credentials.accessToken,
          instanceUrl: credentials.instanceUrl,
        })
      } 
      // Otherwise, use username/password
      else if (credentials.username && credentials.password) {
        this.client = new Connection({
          loginUrl: credentials.loginUrl || 'https://login.salesforce.com',
        })
        await this.client.login(credentials.username, credentials.password)
      } else {
        throw new Error('Insufficient Salesforce credentials')
      }

      // Test connection by querying user
      await this.client.query('SELECT Id, Name FROM User LIMIT 1')
      
      return true
    } catch (error) {
      console.error('Salesforce connection test failed:', error)
      await this.updateStatus('ERROR', (error as Error).message)
      return false
    }
  }

  async syncFromExternal(): Promise<SyncResult> {
    const errors: string[] = []
    let recordsSynced = 0

    try {
      // Sync Leads
      const leads = await this.fetchLeads()
      recordsSynced += await this.syncLeadsToLocal(leads)

      // Sync Opportunities
      const opportunities = await this.fetchOpportunities()
      recordsSynced += await this.syncOpportunitiesToLocal(opportunities)

      // Sync Contacts
      const contacts = await this.fetchContacts()
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
      if (!this.client) {
        await this.testConnection()
      }

      // Sync leads to Salesforce
      for (const lead of data) {
        try {
          const leadData: any = {
            FirstName: lead.firstName,
            LastName: lead.lastName,
            Email: lead.email,
            Company: lead.company,
            Phone: lead.phone,
            Title: lead.title,
            Industry: lead.industry,
            LeadSource: lead.leadSource || 'Other',
            Status: lead.status || 'Open - Not Contacted',
          }

          if (lead.externalId) {
            // Update existing lead
            await this.client.sobject('Lead').update({
              Id: lead.externalId,
              ...leadData,
            })
          } else {
            // Create new lead
            const result = await this.client.sobject('Lead').create(leadData)
            // Store the Salesforce ID for future updates
            if (result.success) {
              // Update local record with external ID
              const { prisma } = await import('@/lib/prisma')
              await prisma.salesLead.update({
                where: { id: lead.id },
                data: { externalId: result.id },
              })
            }
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

  private async fetchLeads(): Promise<any[]> {
    try {
      const result = await this.client.query(
        "SELECT Id, FirstName, LastName, Email, Company, Phone, Title, Industry, LeadSource, Status, Rating, Description, CreatedDate, LastModifiedDate FROM Lead WHERE LastModifiedDate >= LAST_N_DAYS:30"
      )
      return result.records || []
    } catch (error) {
      console.error('Error fetching Salesforce leads:', error)
      return []
    }
  }

  private async fetchOpportunities(): Promise<any[]> {
    try {
      const result = await this.client.query(
        "SELECT Id, Name, AccountId, Amount, StageName, CloseDate, Probability, Type, LeadSource, Description, CreatedDate, LastModifiedDate FROM Opportunity WHERE LastModifiedDate >= LAST_N_DAYS:30"
      )
      return result.records || []
    } catch (error) {
      console.error('Error fetching Salesforce opportunities:', error)
      return []
    }
  }

  private async fetchContacts(): Promise<any[]> {
    try {
      const result = await this.client.query(
        "SELECT Id, FirstName, LastName, Email, Phone, MobilePhone, Title, AccountId, MailingCity, MailingState, MailingCountry, CreatedDate, LastModifiedDate FROM Contact WHERE LastModifiedDate >= LAST_N_DAYS:30"
      )
      return result.records || []
    } catch (error) {
      console.error('Error fetching Salesforce contacts:', error)
      return []
    }
  }

  private async syncLeadsToLocal(leads: any[]): Promise<number> {
    const { prisma } = await import('@/lib/prisma')
    let synced = 0

    for (const lead of leads) {
      try {
        // Apply field mappings if configured
        let mappedData: any = lead
        try {
          mappedData = await applyFieldMappings(
            this.config.id,
            this.tenantId,
            lead,
            'FROM_EXTERNAL'
          )
          // Merge mapped data with original (fallback to original if mapping fails)
          mappedData = { ...lead, ...mappedData }
        } catch (mappingError) {
          console.warn('Field mapping failed, using direct mapping:', mappingError)
          // Continue with direct mapping if field mapping fails
        }

        // Use mapped email or fallback to original
        const email = mappedData.email || lead.Email
        if (!email) continue

        const externalId = mappedData.externalId || lead.Id

        // Check if lead exists by externalId or email
        const existing = await prisma.salesLead.findFirst({
          where: {
            tenantId: this.tenantId,
            OR: [
              { externalId },
              { email },
            ],
          },
        })

        if (existing) {
          // Update existing - use mapped data with fallbacks
          await prisma.salesLead.update({
            where: { id: existing.id },
            data: {
              externalId: externalId || existing.externalId,
              firstName: mappedData.firstName || lead.FirstName || existing.firstName,
              lastName: mappedData.lastName || lead.LastName || existing.lastName,
              email,
              company: mappedData.company || lead.Company || existing.company,
              phone: mappedData.phone || lead.Phone || existing.phone,
              title: mappedData.title || lead.Title || existing.title,
            },
          })
        } else {
          // Create new - use mapped data with fallbacks
          await prisma.salesLead.create({
            data: {
              tenantId: this.tenantId,
              externalId,
              firstName: mappedData.firstName || lead.FirstName || 'Unknown',
              lastName: mappedData.lastName || lead.LastName || '',
              email,
              company: mappedData.company || lead.Company,
              phone: mappedData.phone || lead.Phone,
              title: mappedData.title || lead.Title,
              leadSource: mappedData.leadSource || 'OTHER',
              status: mappedData.status || 'NEW',
              ownerId: this.config.tenantId, // Default owner
            },
          })
        }
        synced++
      } catch (error) {
        console.error('Error syncing lead:', error)
      }
    }

    return synced
  }

  private async syncOpportunitiesToLocal(opportunities: any[]): Promise<number> {
    const { prisma } = await import('@/lib/prisma')
    let synced = 0

    for (const opp of opportunities) {
      try {
        if (!opp.Name) continue

        const existing = await prisma.salesOpportunity.findFirst({
          where: {
            tenantId: this.tenantId,
            OR: [
              { externalId: opp.Id },
              { name: opp.Name },
            ],
          },
        })

        if (existing) {
          await prisma.salesOpportunity.update({
            where: { id: existing.id },
            data: {
              externalId: opp.Id,
              name: opp.Name,
              amount: opp.Amount ? parseFloat(opp.Amount.toString()) : null,
              stage: this.mapSalesforceStage(opp.StageName),
              closeDate: opp.CloseDate ? new Date(opp.CloseDate) : null,
              probability: opp.Probability ? parseFloat(opp.Probability.toString()) : null,
            },
          })
        } else {
          await prisma.salesOpportunity.create({
            data: {
              tenantId: this.tenantId,
              externalId: opp.Id,
              name: opp.Name,
              amount: opp.Amount ? parseFloat(opp.Amount.toString()) : null,
              stage: this.mapSalesforceStage(opp.StageName),
              closeDate: opp.CloseDate ? new Date(opp.CloseDate) : null,
              probability: opp.Probability ? parseFloat(opp.Probability.toString()) : null,
              ownerId: this.config.tenantId,
            },
          })
        }
        synced++
      } catch (error) {
        console.error('Error syncing opportunity:', error)
      }
    }

    return synced
  }

  private async syncContactsToLocal(contacts: any[]): Promise<number> {
    const { prisma } = await import('@/lib/prisma')
    let synced = 0

    for (const contact of contacts) {
      try {
        const email = contact.Email
        if (!email) continue

        const existing = await prisma.salesContact.findFirst({
          where: {
            tenantId: this.tenantId,
            OR: [
              { externalId: contact.Id },
              { email },
            ],
          },
        })

        if (existing) {
          await prisma.salesContact.update({
            where: { id: existing.id },
            data: {
              externalId: contact.Id,
              firstName: contact.FirstName || existing.firstName,
              lastName: contact.LastName || existing.lastName,
              email,
              phone: contact.Phone || existing.phone,
              mobile: contact.MobilePhone || existing.mobile,
              title: contact.Title || existing.title,
            },
          })
        } else {
          await prisma.salesContact.create({
            data: {
              tenantId: this.tenantId,
              externalId: contact.Id,
              firstName: contact.FirstName || 'Unknown',
              lastName: contact.LastName || '',
              email,
              phone: contact.Phone,
              mobile: contact.MobilePhone,
              title: contact.Title,
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

  private mapSalesforceStage(stage: string): string {
    // Map Salesforce stages to our opportunity stages
    const stageMap: Record<string, string> = {
      'Prospecting': 'PROSPECTING',
      'Qualification': 'QUALIFICATION',
      'Needs Analysis': 'QUALIFICATION',
      'Value Proposition': 'PROPOSAL',
      'Id. Decision Makers': 'PROPOSAL',
      'Perception Analysis': 'PROPOSAL',
      'Proposal/Price Quote': 'PROPOSAL',
      'Negotiation/Review': 'NEGOTIATION',
      'Closed Won': 'WON',
      'Closed Lost': 'LOST',
    }
    return stageMap[stage] || 'PROSPECTING'
  }
}

