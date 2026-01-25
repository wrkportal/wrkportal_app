/**
 * HubSpot Integration
 * 
 * Bi-directional sync with HubSpot CRM
 */

import { BaseIntegration, SyncResult } from '../base-integration'
import { applyFieldMappings } from '../field-mapping'

export class HubSpotIntegration extends BaseIntegration {
  private apiKey?: string
  private accessToken?: string

  async testConnection(): Promise<boolean> {
    try {
      const credentials = this.decryptCredentials()
      this.apiKey = credentials.apiKey
      this.accessToken = credentials.accessToken

      if (!this.accessToken && !this.apiKey) {
        throw new Error('HubSpot credentials not configured')
      }

      // Test connection using access token (preferred) or API key
      const authHeader = this.accessToken 
        ? `Bearer ${this.accessToken}`
        : `Bearer ${this.apiKey}`

      const response = await fetch('https://api.hubapi.com/contacts/v1/lists/all/contacts/all?count=1', {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`HubSpot API error: ${error}`)
      }

      return true
    } catch (error) {
      console.error('HubSpot connection test failed:', error)
      await this.updateStatus('ERROR', (error as Error).message)
      return false
    }
  }

  async syncFromExternal(): Promise<SyncResult> {
    const errors: string[] = []
    let recordsSynced = 0

    try {
      // Sync Contacts (Leads in HubSpot)
      const contacts = await this.fetchContacts()
      recordsSynced += await this.syncContactsToLocal(contacts)

      // Sync Deals (Opportunities)
      const deals = await this.fetchDeals()
      recordsSynced += await this.syncDealsToLocal(deals)

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
      const authHeader = this.accessToken 
        ? `Bearer ${this.accessToken}`
        : `Bearer ${this.apiKey}`

      // Sync leads to HubSpot
      for (const lead of data) {
        try {
          const contactData = {
            properties: [
              { property: 'firstname', value: lead.firstName },
              { property: 'lastname', value: lead.lastName },
              { property: 'email', value: lead.email },
              { property: 'company', value: lead.company },
              { property: 'phone', value: lead.phone },
              { property: 'jobtitle', value: lead.title },
            ].filter(prop => prop.value), // Remove empty values
          }

          if (lead.externalId) {
            // Update existing contact
            const response = await fetch(`https://api.hubapi.com/contacts/v1/contact/vid/${lead.externalId}/profile`, {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(contactData),
            })

            if (!response.ok) {
              throw new Error(`HubSpot API error: ${response.statusText}`)
            }
          } else {
            // Create new contact
            const response = await fetch('https://api.hubapi.com/contacts/v1/contact', {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(contactData),
            })

            if (!response.ok) {
              throw new Error(`HubSpot API error: ${response.statusText}`)
            }

            const result = await response.json()
            // Store the HubSpot ID for future updates
            if (result.vid) {
              const { prisma } = await import('@/lib/prisma')
              await (prisma.salesLead.update as any)({
                where: { id: lead.id },
                data: { externalId: result.vid.toString() },
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

  private async fetchContacts(): Promise<any[]> {
    try {
      const authHeader = this.accessToken 
        ? `Bearer ${this.accessToken}`
        : `Bearer ${this.apiKey}`

      const allContacts: any[] = []
      let vidOffset: string | null = null

      do {
        const url: string = vidOffset
          ? `https://api.hubapi.com/contacts/v1/lists/all/contacts/all?vidOffset=${vidOffset}&count=100`
          : 'https://api.hubapi.com/contacts/v1/lists/all/contacts/all?count=100'

        const response: Response = await fetch(url, {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`HubSpot API error: ${response.statusText}`)
        }

        const data: any = await response.json()
        allContacts.push(...(data.contacts || []))
        vidOffset = data['vid-offset'] || null
      } while (vidOffset)

      return allContacts
    } catch (error) {
      console.error('Error fetching HubSpot contacts:', error)
      return []
    }
  }

  private async fetchDeals(): Promise<any[]> {
    try {
      const authHeader = this.accessToken 
        ? `Bearer ${this.accessToken}`
        : `Bearer ${this.apiKey}`

      const allDeals: any[] = []
      let offset: string | null = null

      do {
        const url: string = offset
          ? `https://api.hubapi.com/deals/v1/deal/paged?offset=${offset}&limit=100`
          : 'https://api.hubapi.com/deals/v1/deal/paged?limit=100'

        const response: Response = await fetch(url, {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`HubSpot API error: ${response.statusText}`)
        }

        const data: any = await response.json()
        allDeals.push(...(data.deals || []))
        offset = data.offset || null
      } while (offset)

      return allDeals
    } catch (error) {
      console.error('Error fetching HubSpot deals:', error)
      return []
    }
  }

  private async syncContactsToLocal(contacts: any[]): Promise<number> {
    const { prisma } = await import('@/lib/prisma')
    let synced = 0

    for (const contact of contacts) {
      try {
        const email = contact.properties?.email
        if (!email) continue

        const externalId = contact.vid?.toString()

        // Check if lead exists by externalId or email
        const existing = await prisma.salesLead.findFirst({
          where: {
            tenantId: this.tenantId,
            OR: [
              { externalId } as any,
              { email },
            ] as any,
          } as any,
        })

        if (existing) {
          // Update existing
          await (prisma.salesLead.update as any)({
            where: { id: existing.id },
            data: {
              externalId: externalId || existing.externalId,
              firstName: contact.properties?.firstname || existing.firstName,
              lastName: contact.properties?.lastname || existing.lastName,
              email,
              company: contact.properties?.company || existing.company,
              phone: contact.properties?.phone || existing.phone,
            },
          })
        } else {
          // Create new
          await (prisma.salesLead.create as any)({
            data: {
              tenantId: this.tenantId,
              externalId,
              firstName: contact.properties?.firstname || 'Unknown',
              lastName: contact.properties?.lastname || '',
              email,
              company: contact.properties?.company,
              phone: contact.properties?.phone,
              leadSource: 'OTHER',
              status: 'NEW',
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

  private async syncDealsToLocal(deals: any[]): Promise<number> {
    const { prisma } = await import('@/lib/prisma')
    let synced = 0

    for (const deal of deals) {
      try {
        if (!deal.dealname) continue

        const existing = await prisma.salesOpportunity.findFirst({
          where: {
            tenantId: this.tenantId,
            OR: [
              { externalId: deal.dealId?.toString() } as any,
              { name: deal.dealname },
            ] as any,
          } as any,
        })

        const amount = deal.amount ? parseFloat(deal.amount.toString()) : null
        const stage = this.mapHubSpotStage(deal.dealstage?.value || deal.dealstage)

        if (existing) {
          await (prisma.salesOpportunity.update as any)({
            where: { id: existing.id },
            data: {
              externalId: deal.dealId?.toString() || existing.externalId,
              name: deal.dealname,
              amount: amount ?? undefined,
              stage: (stage || existing.stage) as any,
              closeDate: deal.closedate ? new Date(deal.closedate) : existing.closeDate,
              probability: deal.pipeline ? parseFloat(deal.pipeline.toString()) : existing.probability ?? undefined,
            },
          })
        } else {
          await (prisma.salesOpportunity.create as any)({
            data: {
              tenantId: this.tenantId,
              externalId: deal.dealId?.toString(),
              name: deal.dealname,
              amount: amount ?? undefined,
              stage: (stage || 'PROSPECTING') as any,
              closeDate: deal.closedate ? new Date(deal.closedate) : null,
              probability: deal.pipeline ? parseFloat(deal.pipeline.toString()) : undefined,
              ownerId: this.config.tenantId,
            },
          })
        }
        synced++
      } catch (error) {
        console.error('Error syncing deal:', error)
      }
    }

    return synced
  }

  private mapHubSpotStage(stage: string): string {
    // Map HubSpot stages to our opportunity stages
    const stageMap: Record<string, string> = {
      'appointmentscheduled': 'QUALIFICATION',
      'qualifiedtobuy': 'QUALIFICATION',
      'presentationscheduled': 'PROPOSAL',
      'decisionmakerboughtin': 'PROPOSAL',
      'contractsent': 'NEGOTIATION',
      'closedwon': 'WON',
      'closedlost': 'LOST',
    }
    return stageMap[stage?.toLowerCase()] || 'PROSPECTING'
  }
}

