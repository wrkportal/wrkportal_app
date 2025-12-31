/**
 * Automatic Activity Capture
 * Automatically creates activities for common sales actions to reduce manual logging
 */

import { prisma } from '@/lib/prisma'

export interface ActivityCaptureContext {
  tenantId: string
  userId: string
  type: 'OPPORTUNITY_STAGE_CHANGED' | 'QUOTE_SENT' | 'QUOTE_ACCEPTED' | 'ORDER_CREATED' | 'LEAD_CONVERTED' | 'CONTACT_CREATED' | 'ACCOUNT_CREATED'
  data: Record<string, any>
}

/**
 * Automatically capture activities for common sales events
 */
export class AutoActivityCapture {
  /**
   * Capture activity automatically based on context
   */
  static async capture(context: ActivityCaptureContext) {
    try {
      switch (context.type) {
        case 'OPPORTUNITY_STAGE_CHANGED':
          await this.captureStageChange(context)
          break
        case 'QUOTE_SENT':
          await this.captureQuoteSent(context)
          break
        case 'QUOTE_ACCEPTED':
          await this.captureQuoteAccepted(context)
          break
        case 'ORDER_CREATED':
          await this.captureOrderCreated(context)
          break
        case 'LEAD_CONVERTED':
          await this.captureLeadConverted(context)
          break
        case 'CONTACT_CREATED':
          await this.captureContactCreated(context)
          break
        case 'ACCOUNT_CREATED':
          await this.captureAccountCreated(context)
          break
      }
    } catch (error) {
      console.error('Auto activity capture error:', error)
      // Don't throw - activity capture should not break main flow
    }
  }

  /**
   * Capture activity when opportunity stage changes
   */
  private static async captureStageChange(context: ActivityCaptureContext) {
    const { opportunityId, oldStage, newStage, opportunity } = context.data

    if (!opportunityId) return

    // Get opportunity details if not provided
    const opp = opportunity || await prisma.salesOpportunity.findUnique({
      where: { id: opportunityId },
      select: {
        name: true,
        ownerId: true,
        accountId: true,
        contacts: {
          select: { contactId: true },
          take: 1
        }
      }
    })

    if (!opp) return

    const stageLabels: Record<string, string> = {
      'PROSPECTING': 'Started prospecting',
      'QUALIFICATION': 'Qualified opportunity',
      'NEEDS_ANALYSIS': 'Analyzing needs',
      'VALUE_PROPOSITION': 'Presented value proposition',
      'ID_DECISION_MAKERS': 'Identified decision makers',
      'PERCEPTION_ANALYSIS': 'Analyzing perception',
      'PROPOSAL_PRICE_QUOTE': 'Sent proposal/quote',
      'NEGOTIATION_REVIEW': 'In negotiation',
      'CLOSED_WON': 'Won opportunity',
      'CLOSED_LOST': 'Lost opportunity',
    }

    const subject = `Opportunity moved from ${stageLabels[oldStage] || oldStage} to ${stageLabels[newStage] || newStage}`
    
    // Find first contact ID if available
    const contactId = opp.contacts?.[0]?.contactId || null

    await prisma.salesActivity.create({
      data: {
        tenantId: context.tenantId,
        type: 'NOTE',
        subject,
        description: `Stage changed from ${oldStage} to ${newStage}`,
        status: 'COMPLETED',
        completedDate: new Date(),
        opportunityId,
        accountId: opp.accountId || null,
        contactId,
        assignedToId: opp.ownerId || context.userId,
        createdById: context.userId,
      },
    })
  }

  /**
   * Capture activity when quote is sent
   */
  private static async captureQuoteSent(context: ActivityCaptureContext) {
    const { quoteId, quote } = context.data

    if (!quoteId) return

    const quoteData = quote || await prisma.salesQuote.findUnique({
      where: { id: quoteId },
      select: {
        name: true,
        quoteNumber: true,
        opportunityId: true,
        accountId: true,
        createdById: true,
        opportunity: {
          select: { ownerId: true }
        }
      }
    })

    if (!quoteData) return

    await prisma.salesActivity.create({
      data: {
        tenantId: context.tenantId,
        type: 'EMAIL',
        subject: `Quote ${quoteData.quoteNumber} sent to customer`,
        description: `Quote "${quoteData.name}" (${quoteData.quoteNumber}) has been sent to the customer`,
        status: 'COMPLETED',
        completedDate: new Date(),
        opportunityId: quoteData.opportunityId || null,
        accountId: quoteData.accountId || null,
        assignedToId: quoteData.opportunity?.ownerId || quoteData.createdById || context.userId,
        createdById: context.userId,
      },
    })
  }

  /**
   * Capture activity when quote is accepted
   */
  private static async captureQuoteAccepted(context: ActivityCaptureContext) {
    const { quoteId, quote } = context.data

    if (!quoteId) return

    const quoteData = quote || await prisma.salesQuote.findUnique({
      where: { id: quoteId },
      select: {
        name: true,
        quoteNumber: true,
        opportunityId: true,
        accountId: true,
        opportunity: {
          select: { ownerId: true }
        }
      }
    })

    if (!quoteData) return

    await prisma.salesActivity.create({
      data: {
        tenantId: context.tenantId,
        type: 'NOTE',
        subject: `Quote ${quoteData.quoteNumber} accepted by customer`,
        description: `Quote "${quoteData.name}" (${quoteData.quoteNumber}) has been accepted by the customer`,
        status: 'COMPLETED',
        completedDate: new Date(),
        opportunityId: quoteData.opportunityId || null,
        accountId: quoteData.accountId || null,
        assignedToId: quoteData.opportunity?.ownerId || context.userId,
        createdById: context.userId,
      },
    })
  }

  /**
   * Capture activity when order is created
   */
  private static async captureOrderCreated(context: ActivityCaptureContext) {
    const { orderId, order } = context.data

    if (!orderId) return

    const orderData = order || await prisma.salesOrder.findUnique({
      where: { id: orderId },
      select: {
        name: true,
        orderNumber: true,
        opportunityId: true,
        accountId: true,
        totalAmount: true,
        createdById: true,
        opportunity: {
          select: { ownerId: true }
        }
      }
    })

    if (!orderData) return

    await prisma.salesActivity.create({
      data: {
        tenantId: context.tenantId,
        type: 'NOTE',
        subject: `Order ${orderData.orderNumber} created`,
        description: `Order "${orderData.name}" (${orderData.orderNumber}) for $${(orderData.totalAmount / 1000).toFixed(1)}K has been created`,
        status: 'COMPLETED',
        completedDate: new Date(),
        opportunityId: orderData.opportunityId || null,
        accountId: orderData.accountId || null,
        assignedToId: orderData.opportunity?.ownerId || orderData.createdById || context.userId,
        createdById: context.userId,
      },
    })
  }

  /**
   * Capture activity when lead is converted to opportunity
   */
  private static async captureLeadConverted(context: ActivityCaptureContext) {
    const { leadId, opportunityId, lead, opportunity } = context.data

    if (!leadId || !opportunityId) return

    const leadData = lead || await prisma.salesLead.findUnique({
      where: { id: leadId },
      select: {
        firstName: true,
        lastName: true,
        company: true,
        ownerId: true,
      }
    })

    const oppData = opportunity || await prisma.salesOpportunity.findUnique({
      where: { id: opportunityId },
      select: {
        name: true,
        ownerId: true,
        accountId: true,
      }
    })

    if (!leadData || !oppData) return

    await prisma.salesActivity.create({
      data: {
        tenantId: context.tenantId,
        type: 'NOTE',
        subject: `Lead converted to opportunity: ${oppData.name}`,
        description: `Lead "${leadData.firstName} ${leadData.lastName}" from ${leadData.company || 'Unknown Company'} has been converted to opportunity "${oppData.name}"`,
        status: 'COMPLETED',
        completedDate: new Date(),
        leadId,
        opportunityId,
        accountId: oppData.accountId || null,
        assignedToId: oppData.ownerId || leadData.ownerId || context.userId,
        createdById: context.userId,
      },
    })
  }

  /**
   * Capture activity when contact is created
   */
  private static async captureContactCreated(context: ActivityCaptureContext) {
    const { contactId, contact } = context.data

    if (!contactId) return

    const contactData = contact || await prisma.salesContact.findUnique({
      where: { id: contactId },
      select: {
        firstName: true,
        lastName: true,
        accountId: true,
        ownerId: true,
      }
    })

    if (!contactData) return

    await prisma.salesActivity.create({
      data: {
        tenantId: context.tenantId,
        type: 'NOTE',
        subject: `New contact created: ${contactData.firstName} ${contactData.lastName}`,
        description: `Contact "${contactData.firstName} ${contactData.lastName}" has been added to the system`,
        status: 'COMPLETED',
        completedDate: new Date(),
        contactId,
        accountId: contactData.accountId || null,
        assignedToId: contactData.ownerId || context.userId,
        createdById: context.userId,
      },
    })
  }

  /**
   * Capture activity when account is created
   */
  private static async captureAccountCreated(context: ActivityCaptureContext) {
    const { accountId, account } = context.data

    if (!accountId) return

    const accountData = account || await prisma.salesAccount.findUnique({
      where: { id: accountId },
      select: {
        name: true,
        ownerId: true,
      }
    })

    if (!accountData) return

    await prisma.salesActivity.create({
      data: {
        tenantId: context.tenantId,
        type: 'NOTE',
        subject: `New account created: ${accountData.name}`,
        description: `Account "${accountData.name}" has been added to the system`,
        status: 'COMPLETED',
        completedDate: new Date(),
        accountId,
        assignedToId: accountData.ownerId || context.userId,
        createdById: context.userId,
      },
    })
  }
}

