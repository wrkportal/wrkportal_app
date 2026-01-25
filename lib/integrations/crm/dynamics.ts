/**
 * Microsoft Dynamics 365 Integration
 * 
 * Bi-directional sync with Microsoft Dynamics 365 CRM
 */

import { BaseIntegration, SyncResult } from '../base-integration'
import { applyFieldMappings } from '../field-mapping'

export class DynamicsIntegration extends BaseIntegration {
  private accessToken?: string
  private apiUrl?: string

  async testConnection(): Promise<boolean> {
    try {
      const credentials = this.decryptCredentials()
      this.accessToken = credentials.accessToken
      this.apiUrl = credentials.apiUrl || credentials.instanceUrl

      if (!this.accessToken || !this.apiUrl) {
        throw new Error('Dynamics 365 credentials not configured')
      }

      // Test connection by querying organization
      const response = await fetch(`${this.apiUrl}/api/data/v9.2/WhoAmI`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
        },
      })

      if (!response.ok) {
        throw new Error(`Dynamics 365 API error: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('Dynamics 365 connection test failed:', error)
      await this.updateStatus('ERROR', (error as Error).message)
      return false
    }
  }

  async syncFromExternal(): Promise<SyncResult> {
    const errors: string[] = []
    let recordsSynced = 0

    try {
      if (!this.accessToken || !this.apiUrl) {
        await this.testConnection()
      }

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
      if (!this.accessToken || !this.apiUrl) {
        await this.testConnection()
      }

      // Sync leads to Dynamics 365
      for (const lead of data) {
        try {
          const leadData: any = {
            firstname: lead.firstName,
            lastname: lead.lastName,
            emailaddress1: lead.email,
            companyname: lead.company,
            telephone1: lead.phone,
            jobtitle: lead.title,
            leadsourcecode: this.mapLeadSource(lead.leadSource),
          }

          if (lead.externalId) {
            // Update existing lead
            const response = await fetch(
              `${this.apiUrl}/api/data/v9.2/leads(${lead.externalId})`,
              {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${this.accessToken}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
                body: JSON.stringify(leadData),
              }
            )

            if (!response.ok) {
              throw new Error(`Dynamics 365 API error: ${response.statusText}`)
            }
          } else {
            // Create new lead
            const response = await fetch(`${this.apiUrl}/api/data/v9.2/leads`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify(leadData),
            })

            if (!response.ok) {
              throw new Error(`Dynamics 365 API error: ${response.statusText}`)
            }

            // Extract ID from response header
            const location = response.headers.get('OData-EntityId')
            if (location) {
              const match = location.match(/leads\(([^)]+)\)/)
              if (match && match[1]) {
                const { prisma } = await import('@/lib/prisma')
                await prisma.salesLead.update({
                  where: { id: lead.id },
                  data: { externalId: match[1] } as any,
                })
              }
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
      const response = await fetch(
        `${this.apiUrl}/api/data/v9.2/leads?$select=leadid,firstname,lastname,emailaddress1,companyname,telephone1,jobtitle,leadsourcecode,createdon,modifiedon&$filter=modifiedon ge ${this.getLast30DaysFilter()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Dynamics 365 API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.value || []
    } catch (error) {
      console.error('Error fetching Dynamics 365 leads:', error)
      return []
    }
  }

  private async fetchOpportunities(): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/data/v9.2/opportunities?$select=opportunityid,name,estimatedvalue,closeprobability,actualclosedate,statuscode,createdon,modifiedon&$filter=modifiedon ge ${this.getLast30DaysFilter()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Dynamics 365 API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.value || []
    } catch (error) {
      console.error('Error fetching Dynamics 365 opportunities:', error)
      return []
    }
  }

  private async fetchContacts(): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/data/v9.2/contacts?$select=contactid,firstname,lastname,emailaddress1,telephone1,mobilephone,jobtitle,createdon,modifiedon&$filter=modifiedon ge ${this.getLast30DaysFilter()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Dynamics 365 API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.value || []
    } catch (error) {
      console.error('Error fetching Dynamics 365 contacts:', error)
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
          mappedData = { ...lead, ...mappedData }
        } catch (mappingError) {
          console.warn('Field mapping failed, using direct mapping:', mappingError)
        }

        const email = mappedData.emailaddress1 || mappedData.email || lead.emailaddress1
        if (!email) continue

        const externalId = mappedData.leadid || lead.leadid

        const existing = await prisma.salesLead.findFirst({
          where: {
            tenantId: this.tenantId,
            OR: [
              { externalId: externalId?.toString() } as any,
              { email },
            ] as any,
          } as any,
        })

        if (existing) {
          await (prisma.salesLead.update as any)({
            where: { id: existing.id },
            data: {
              externalId: externalId?.toString() || existing.externalId,
              firstName: mappedData.firstname || lead.firstname || existing.firstName,
              lastName: mappedData.lastname || lead.lastname || existing.lastName,
              email,
              company: mappedData.companyname || lead.companyname || existing.company,
              phone: mappedData.telephone1 || lead.telephone1 || existing.phone,
              title: mappedData.jobtitle || lead.jobtitle || existing.title,
            },
          })
        } else {
          await prisma.salesLead.create({
            data: {
              tenantId: this.tenantId,
              externalId: externalId?.toString(),
              firstName: mappedData.firstname || lead.firstname || 'Unknown',
              lastName: mappedData.lastname || lead.lastname || '',
              email,
              company: mappedData.companyname || lead.companyname,
              phone: mappedData.telephone1 || lead.telephone1,
              title: mappedData.jobtitle || lead.jobtitle,
              leadSource: (this.mapDynamicsLeadSource(lead.leadsourcecode) || 'OTHER') as any,
              status: 'NEW',
              ownerId: this.config.tenantId,
            } as any,
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
        if (!opp.name) continue

        const existing = await prisma.salesOpportunity.findFirst({
          where: {
            tenantId: this.tenantId,
            OR: [
              { externalId: opp.opportunityid?.toString() } as any,
              { name: opp.name },
            ] as any,
          } as any,
        })

        if (existing) {
          await prisma.salesOpportunity.update({
            where: { id: existing.id },
            data: {
              externalId: opp.opportunityid?.toString(),
              name: opp.name,
              amount: opp.estimatedvalue ? parseFloat(opp.estimatedvalue.toString()) : undefined,
              stage: this.mapDynamicsStage(opp.statuscode) as any,
              closeDate: opp.actualclosedate ? new Date(opp.actualclosedate) : null,
              probability: opp.closeprobability ? parseFloat(opp.closeprobability.toString()) : undefined,
            } as any,
          })
        } else {
          await prisma.salesOpportunity.create({
            data: {
              tenantId: this.tenantId,
              externalId: opp.opportunityid?.toString(),
              name: opp.name,
              amount: opp.estimatedvalue ? parseFloat(opp.estimatedvalue.toString()) : undefined,
              stage: (this.mapDynamicsStage(opp.statuscode) || 'PROSPECTING') as any,
              closeDate: opp.actualclosedate ? new Date(opp.actualclosedate) : null,
              probability: opp.closeprobability ? parseFloat(opp.closeprobability.toString()) : undefined,
              ownerId: this.config.tenantId,
            } as any,
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
        const email = contact.emailaddress1
        if (!email) continue

        const existing = await prisma.salesContact.findFirst({
          where: {
            tenantId: this.tenantId,
            OR: [
              { externalId: contact.contactid?.toString() } as any,
              { email },
            ] as any,
          } as any,
        })

        if (existing) {
          await prisma.salesContact.update({
            where: { id: existing.id },
            data: {
              externalId: contact.contactid?.toString(),
              firstName: contact.firstname || existing.firstName,
              lastName: contact.lastname || existing.lastName,
              email,
              phone: contact.telephone1 || existing.phone,
              mobile: contact.mobilephone || existing.mobile,
              title: contact.jobtitle || existing.title,
            } as any,
          })
        } else {
          await prisma.salesContact.create({
            data: {
              tenantId: this.tenantId,
              externalId: contact.contactid?.toString(),
              firstName: contact.firstname || 'Unknown',
              lastName: contact.lastname || '',
              email,
              phone: contact.telephone1,
              mobile: contact.mobilephone,
              title: contact.jobtitle,
              ownerId: this.config.tenantId,
            } as any,
          })
        }
        synced++
      } catch (error) {
        console.error('Error syncing contact:', error)
      }
    }

    return synced
  }

  private getLast30DaysFilter(): string {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString()
  }

  private mapLeadSource(source: string): number {
    // Dynamics 365 lead source codes
    const sourceMap: Record<string, number> = {
      'WEBSITE': 1,
      'ADVERTISING': 2,
      'EMPLOYEE_REFERRAL': 3,
      'EXTERNAL_REFERRAL': 4,
      'PARTNER': 5,
      'PUBLIC_RELATIONS': 6,
      'SEMINAR': 7,
      'TRADE_SHOW': 8,
      'WEB': 9,
      'WORD_OF_MOUTH': 10,
      'OTHER': 11,
    }
    return sourceMap[source] || 11
  }

  private mapDynamicsLeadSource(code: number): string {
    const sourceMap: Record<number, string> = {
      1: 'WEBSITE',
      2: 'ADVERTISING',
      3: 'EMPLOYEE_REFERRAL',
      4: 'EXTERNAL_REFERRAL',
      5: 'PARTNER',
      6: 'PUBLIC_RELATIONS',
      7: 'SEMINAR',
      8: 'TRADE_SHOW',
      9: 'WEB',
      10: 'WORD_OF_MOUTH',
      11: 'OTHER',
    }
    return sourceMap[code] || 'OTHER'
  }

  private mapDynamicsStage(statusCode: number): string {
    // Map Dynamics 365 opportunity status codes to our stages
    // This is a simplified mapping - adjust based on your Dynamics configuration
    if (statusCode >= 1 && statusCode <= 3) return 'PROSPECTING'
    if (statusCode >= 4 && statusCode <= 6) return 'QUALIFICATION'
    if (statusCode >= 7 && statusCode <= 9) return 'PROPOSAL'
    if (statusCode >= 10 && statusCode <= 12) return 'NEGOTIATION'
    if (statusCode === 13) return 'WON'
    if (statusCode === 14) return 'LOST'
    return 'PROSPECTING'
  }
}

