/**
 * Data Enrichment Service
 * 
 * Enriches leads and accounts with additional data from external sources
 * Integration points for ZoomInfo, Clearbit, etc.
 */

import { prisma } from '@/lib/prisma'

export interface EnrichmentData {
  companyName?: string
  companyWebsite?: string
  companyIndustry?: string
  companySize?: string
  companyRevenue?: string
  companyDescription?: string
  companyLogo?: string
  employeeCount?: number
  headquarters?: string
  technologies?: string[]
  socialProfiles?: {
    linkedin?: string
    twitter?: string
    facebook?: string
  }
  contactFirstName?: string
  contactLastName?: string
  contactEmail?: string
  contactTitle?: string
  contactPhone?: string
  contactLinkedIn?: string
}

export interface EnrichmentProvider {
  name: string
  enabled: boolean
  apiKey?: string
  config?: Record<string, any>
}

/**
 * Enrich a lead with external data
 */
export async function enrichLead(
  leadId: string,
  tenantId: string,
  provider?: string
): Promise<EnrichmentData | null> {
  const lead = await prisma.salesLead.findUnique({
    where: { id: leadId },
  })

  if (!lead) {
    return null
  }

  // Get enrichment provider configuration
  const providers = await getEnrichmentProviders(tenantId)
  const activeProvider = provider 
    ? providers.find(p => p.name === provider && p.enabled)
    : providers.find(p => p.enabled)

  if (!activeProvider || !activeProvider.apiKey) {
    console.warn('No enrichment provider configured or enabled')
    return null
  }

  try {
    let enrichmentData: EnrichmentData | null = null

    // Route to appropriate provider
    switch (activeProvider.name.toLowerCase()) {
      case 'clearbit':
        enrichmentData = await enrichWithClearbit(lead, activeProvider)
        break
      case 'zoominfo':
        enrichmentData = await enrichWithZoomInfo(lead, activeProvider)
        break
      default:
        console.warn(`Unknown enrichment provider: ${activeProvider.name}`)
        return null
    }

    // Apply enrichment data to lead
    if (enrichmentData) {
      await applyEnrichmentToLead(leadId, enrichmentData)
    }

    return enrichmentData
  } catch (error) {
    console.error('Error enriching lead:', error)
    return null
  }
}

/**
 * Enrich an account with external data
 */
export async function enrichAccount(
  accountId: string,
  tenantId: string,
  provider?: string
): Promise<EnrichmentData | null> {
  const account = await prisma.salesAccount.findUnique({
    where: { id: accountId },
  })

  if (!account) {
    return null
  }

  const providers = await getEnrichmentProviders(tenantId)
  const activeProvider = provider 
    ? providers.find(p => p.name === provider && p.enabled)
    : providers.find(p => p.enabled)

  if (!activeProvider || !activeProvider.apiKey) {
    console.warn('No enrichment provider configured or enabled')
    return null
  }

  try {
    let enrichmentData: EnrichmentData | null = null

    switch (activeProvider.name.toLowerCase()) {
      case 'clearbit':
        enrichmentData = await enrichAccountWithClearbit(account, activeProvider)
        break
      case 'zoominfo':
        enrichmentData = await enrichAccountWithZoomInfo(account, activeProvider)
        break
      default:
        console.warn(`Unknown enrichment provider: ${activeProvider.name}`)
        return null
    }

    if (enrichmentData) {
      await applyEnrichmentToAccount(accountId, enrichmentData)
    }

    return enrichmentData
  } catch (error) {
    console.error('Error enriching account:', error)
    return null
  }
}

/**
 * Enrich with Clearbit - Person API
 * Docs: https://clearbit.com/docs#person-api
 */
async function enrichWithClearbit(lead: any, provider: EnrichmentProvider): Promise<EnrichmentData | null> {
  if (!provider.apiKey) {
    console.warn('Clearbit API key not configured')
    return null
  }

  try {
    // Use Clearbit Combined API to get both person and company data
    const email = lead.email
    if (!email) {
      console.warn('Lead email required for Clearbit enrichment')
      return null
    }

    const response = await fetch(`https://person.clearbit.com/v2/combined/find?email=${encodeURIComponent(email)}`, {
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.log('Person not found in Clearbit')
        return null
      }
      throw new Error(`Clearbit API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    const enrichmentData: EnrichmentData = {}

    // Person data
    if (data.person) {
      enrichmentData.contactFirstName = data.person.name?.givenName || lead.firstName
      enrichmentData.contactLastName = data.person.name?.familyName || lead.lastName
      enrichmentData.contactEmail = data.person.email || email
      enrichmentData.contactTitle = data.person.title
      enrichmentData.contactPhone = data.person.phone
      enrichmentData.contactLinkedIn = data.person.linkedin
    }

    // Company data
    if (data.company) {
      enrichmentData.companyName = data.company.name || lead.company
      enrichmentData.companyWebsite = data.company.domain
      enrichmentData.companyIndustry = data.company.category?.industry
      enrichmentData.companySize = data.company.metrics?.employees?.toString()
      enrichmentData.companyRevenue = data.company.metrics?.annualRevenue?.toString()
      enrichmentData.companyDescription = data.company.description
      enrichmentData.companyLogo = data.company.logo
      enrichmentData.employeeCount = data.company.metrics?.employees
      enrichmentData.headquarters = data.company.geo?.city
        ? `${data.company.geo.city}, ${data.company.geo.state}, ${data.company.geo.country}`
        : undefined
      enrichmentData.technologies = data.company.tech || []
      enrichmentData.socialProfiles = {
        linkedin: data.company.linkedin?.handle
          ? `https://linkedin.com/company/${data.company.linkedin.handle}`
          : undefined,
        twitter: data.company.twitter?.handle
          ? `https://twitter.com/${data.company.twitter.handle}`
          : undefined,
        facebook: data.company.facebook?.handle
          ? `https://facebook.com/${data.company.facebook.handle}`
          : undefined,
      }
    }

    return Object.keys(enrichmentData).length > 0 ? enrichmentData : null
  } catch (error) {
    console.error('Clearbit enrichment error:', error)
    return null
  }
}

/**
 * Enrich with ZoomInfo - Contact Search API
 * Docs: https://developer.zoominfo.com/docs
 * Note: ZoomInfo requires specific API setup and authentication
 */
async function enrichWithZoomInfo(lead: any, provider: EnrichmentProvider): Promise<EnrichmentData | null> {
  if (!provider.apiKey) {
    console.warn('ZoomInfo API key not configured')
    return null
  }

  try {
    const email = lead.email
    const companyName = lead.company

    if (!email && !companyName) {
      console.warn('Lead email or company name required for ZoomInfo enrichment')
      return null
    }

    // ZoomInfo API endpoint (adjust based on your ZoomInfo plan)
    // This is a generic implementation - actual endpoint may vary
    const baseUrl = provider.config?.baseUrl || 'https://api.zoominfo.com'
    const apiKey = provider.apiKey

    // Search for contact by email
    if (email) {
      const response = await fetch(`${baseUrl}/contacts/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          emails: [email],
        }),
      })

      if (!response.ok) {
        if (response.status === 404) {
          console.log('Contact not found in ZoomInfo')
        } else {
          throw new Error(`ZoomInfo API error: ${response.status} ${response.statusText}`)
        }
      } else {
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          const contact = data.data[0]

          const enrichmentData: EnrichmentData = {
            contactFirstName: contact.firstName || lead.firstName,
            contactLastName: contact.lastName || lead.lastName,
            contactEmail: contact.email || email,
            contactTitle: contact.jobTitle,
            contactPhone: contact.phone,
            contactLinkedIn: contact.linkedInUrl,
            companyName: contact.companyName || companyName,
            companyWebsite: contact.companyWebsite,
            companyIndustry: contact.industry,
            companySize: contact.companySize,
            employeeCount: contact.employeeCount,
            headquarters: contact.location,
          }

          return enrichmentData
        }
      }
    }

    // If email search didn't work, try company search
    if (companyName) {
      const response = await fetch(`${baseUrl}/companies/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          companyName: companyName,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          const company = data.data[0]

          const enrichmentData: EnrichmentData = {
            companyName: company.companyName || companyName,
            companyWebsite: company.website,
            companyIndustry: company.industry,
            companySize: company.companySize,
            companyRevenue: company.revenue,
            companyDescription: company.description,
            employeeCount: company.employeeCount,
            headquarters: company.headquarters,
            technologies: company.technologies,
          }

          return enrichmentData
        }
      }
    }

    return null
  } catch (error) {
    console.error('ZoomInfo enrichment error:', error)
    return null
  }
}

/**
 * Enrich account with Clearbit - Company API
 * Docs: https://clearbit.com/docs#company-api
 */
async function enrichAccountWithClearbit(account: any, provider: EnrichmentProvider): Promise<EnrichmentData | null> {
  if (!provider.apiKey) {
    console.warn('Clearbit API key not configured')
    return null
  }

  try {
    const domain = account.website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
    const companyName = account.name

    if (!domain && !companyName) {
      console.warn('Account domain or name required for Clearbit enrichment')
      return null
    }

    // Try domain lookup first (most accurate)
    if (domain) {
      const response = await fetch(`https://company.clearbit.com/v2/companies/find?domain=${encodeURIComponent(domain)}`, {
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
        },
      })

      if (response.ok) {
        const data = await response.json()

        return {
          companyName: data.name || companyName,
          companyWebsite: data.domain,
          companyIndustry: data.category?.industry,
          companySize: data.metrics?.employees?.toString(),
          companyRevenue: data.metrics?.annualRevenue?.toString(),
          companyDescription: data.description,
          companyLogo: data.logo,
          employeeCount: data.metrics?.employees,
          headquarters: data.geo?.city
            ? `${data.geo.city}, ${data.geo.state}, ${data.geo.country}`
            : undefined,
          technologies: data.tech || [],
          socialProfiles: {
            linkedin: data.linkedin?.handle
              ? `https://linkedin.com/company/${data.linkedin.handle}`
              : undefined,
            twitter: data.twitter?.handle
              ? `https://twitter.com/${data.twitter.handle}`
              : undefined,
            facebook: data.facebook?.handle
              ? `https://facebook.com/${data.facebook.handle}`
              : undefined,
          },
        }
      }
    }

    // Fallback to name search (less accurate)
    if (companyName) {
      const response = await fetch(`https://company.clearbit.com/v2/companies/search?name=${encodeURIComponent(companyName)}`, {
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          const company = data[0]
          return {
            companyName: company.name || companyName,
            companyWebsite: company.domain,
            companyIndustry: company.category?.industry,
            companySize: company.metrics?.employees?.toString(),
            companyRevenue: company.metrics?.annualRevenue?.toString(),
            companyDescription: company.description,
            companyLogo: company.logo,
            employeeCount: company.metrics?.employees,
            headquarters: company.geo?.city
              ? `${company.geo.city}, ${company.geo.state}, ${company.geo.country}`
              : undefined,
            technologies: company.tech || [],
          }
        }
      }
    }

    return null
  } catch (error) {
    console.error('Clearbit account enrichment error:', error)
    return null
  }
}

/**
 * Enrich account with ZoomInfo - Company Search API
 * Docs: https://developer.zoominfo.com/docs
 */
async function enrichAccountWithZoomInfo(account: any, provider: EnrichmentProvider): Promise<EnrichmentData | null> {
  if (!provider.apiKey) {
    console.warn('ZoomInfo API key not configured')
    return null
  }

  try {
    const companyName = account.name
    const domain = account.website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]

    if (!companyName && !domain) {
      console.warn('Account name or domain required for ZoomInfo enrichment')
      return null
    }

    const baseUrl = provider.config?.baseUrl || 'https://api.zoominfo.com'
    const apiKey = provider.apiKey

    // Search for company
    const searchParams: any = {}
    if (companyName) searchParams.companyName = companyName
    if (domain) searchParams.domain = domain

    const response = await fetch(`${baseUrl}/companies/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(searchParams),
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.log('Company not found in ZoomInfo')
        return null
      }
      throw new Error(`ZoomInfo API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    if (data.data && data.data.length > 0) {
      const company = data.data[0]

      return {
        companyName: company.companyName || companyName,
        companyWebsite: company.website || domain,
        companyIndustry: company.industry,
        companySize: company.companySize,
        companyRevenue: company.revenue,
        companyDescription: company.description,
        employeeCount: company.employeeCount,
        headquarters: company.headquarters || company.location,
        technologies: company.technologies,
        socialProfiles: {
          linkedin: company.linkedInUrl,
          twitter: company.twitterUrl,
          facebook: company.facebookUrl,
        },
      }
    }

    return null
  } catch (error) {
    console.error('ZoomInfo account enrichment error:', error)
    return null
  }
}

/**
 * Apply enrichment data to lead
 */
async function applyEnrichmentToLead(leadId: string, data: EnrichmentData): Promise<void> {
  const updates: any = {}

  if (data.contactFirstName) updates.firstName = data.contactFirstName
  if (data.contactLastName) updates.lastName = data.contactLastName
  if (data.contactEmail) updates.email = data.contactEmail
  if (data.contactTitle) updates.title = data.contactTitle
  if (data.contactPhone) updates.phone = data.contactPhone
  if (data.companyName) updates.company = data.companyName
  if (data.companyIndustry) updates.industry = data.companyIndustry

  if (Object.keys(updates).length > 0) {
    await prisma.salesLead.update({
      where: { id: leadId },
      data: updates,
    })
  }

  // Store additional enrichment data in customFields
  if (data.companyWebsite || data.companySize || data.companyRevenue || data.socialProfiles) {
    const lead = await prisma.salesLead.findUnique({
      where: { id: leadId },
      select: { customFields: true },
    })

    const customFields = (lead?.customFields as any) || {}
    customFields.enrichment = {
      companyWebsite: data.companyWebsite,
      companySize: data.companySize,
      companyRevenue: data.companyRevenue,
      companyDescription: data.companyDescription,
      employeeCount: data.employeeCount,
      headquarters: data.headquarters,
      technologies: data.technologies,
      socialProfiles: data.socialProfiles,
      enrichedAt: new Date().toISOString(),
    }

    await prisma.salesLead.update({
      where: { id: leadId },
      data: { customFields },
    })
  }
}

/**
 * Apply enrichment data to account
 */
async function applyEnrichmentToAccount(accountId: string, data: EnrichmentData): Promise<void> {
  const updates: any = {}

  if (data.companyWebsite) updates.website = data.companyWebsite
  if (data.companyIndustry) updates.industry = data.companyIndustry
  if (data.companyDescription) updates.description = data.companyDescription
  if (data.headquarters) {
    // Store in customFields or add address field to schema
  }

  if (Object.keys(updates).length > 0) {
    await prisma.salesAccount.update({
      where: { id: accountId },
      data: updates,
    })
  }

  // Store additional enrichment data
  if (data.companySize || data.companyRevenue || data.employeeCount || data.technologies || data.socialProfiles) {
    const account = await prisma.salesAccount.findUnique({
      where: { id: accountId },
      select: { customFields: true },
    })

    const customFields = (account?.customFields as any) || {}
    customFields.enrichment = {
      companySize: data.companySize,
      companyRevenue: data.companyRevenue,
      employeeCount: data.employeeCount,
      technologies: data.technologies,
      socialProfiles: data.socialProfiles,
      companyLogo: data.companyLogo,
      enrichedAt: new Date().toISOString(),
    }

    await prisma.salesAccount.update({
      where: { id: accountId },
      data: { customFields },
    })
  }
}

/**
 * Get enrichment providers from tenant settings
 */
async function getEnrichmentProviders(tenantId: string): Promise<EnrichmentProvider[]> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  })

  const settings = (tenant?.settings as any) || {}
  const enrichmentSettings = settings.sales?.enrichment || {}

  const providers: EnrichmentProvider[] = [
    {
      name: 'Clearbit',
      enabled: enrichmentSettings.clearbit?.enabled || false,
      apiKey: enrichmentSettings.clearbit?.apiKey,
      config: enrichmentSettings.clearbit?.config,
    },
    {
      name: 'ZoomInfo',
      enabled: enrichmentSettings.zoominfo?.enabled || false,
      apiKey: enrichmentSettings.zoominfo?.apiKey,
      config: enrichmentSettings.zoominfo?.config,
    },
  ]

  return providers
}

