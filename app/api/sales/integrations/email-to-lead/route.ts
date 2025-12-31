import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Imap from 'imap'
import { simpleParser } from 'mailparser'

/**
 * Email-to-Lead Integration
 * Monitors sales inbox and automatically creates leads from emails
 * Supports Gmail and Outlook
 */

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  password: string
  tenantId: string
  userId: string
  filters?: {
    from?: string[]
    subject?: string[]
    ignore?: string[]
  }
}

// Store active connections
const activeConnections = new Map<string, Imap>()

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, config } = body

    if (action === 'connect') {
      return await connectEmail(config, session.user.tenantId!, session.user.id)
    } else if (action === 'disconnect') {
      return await disconnectEmail(session.user.tenantId!, session.user.id)
    } else if (action === 'status') {
      return await getConnectionStatus(session.user.tenantId!, session.user.id)
    } else if (action === 'test') {
      return await testConnection(config)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Email-to-Lead error:', error)
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    )
  }
}

async function connectEmail(config: EmailConfig, tenantId: string, userId: string) {
  try {
    const connectionKey = `${tenantId}-${userId}`

    // Disconnect existing connection if any
    if (activeConnections.has(connectionKey)) {
      const existing = activeConnections.get(connectionKey)
      existing?.end()
      activeConnections.delete(connectionKey)
    }

    // Determine IMAP settings based on email provider
    const imapConfig = getImapConfig(config)

    const imap = new Imap(imapConfig)

    imap.once('ready', () => {
      console.log('Email connection ready:', connectionKey)
      activeConnections.set(connectionKey, imap)

      // Open INBOX
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error('Error opening inbox:', err)
          return
        }

        // Search for unread emails
        imap.search(['UNSEEN'], (err, results) => {
          if (err) {
            console.error('Error searching emails:', err)
            return
          }

          if (results.length === 0) {
            console.log('No unread emails')
            return
          }

          // Process each email
          const fetch = imap.fetch(results, { bodies: '' })
          fetch.on('message', (msg) => {
            processEmail(msg, config, tenantId, userId)
          })
        })

        // Set up IDLE to monitor new emails
        imap.on('mail', () => {
          imap.search(['UNSEEN'], (err, results) => {
            if (err || !results.length) return

            const fetch = imap.fetch(results, { bodies: '' })
            fetch.on('message', (msg) => {
              processEmail(msg, config, tenantId, userId)
            })
          })
        })
      })
    })

    imap.once('error', (err) => {
      console.error('IMAP error:', err)
      activeConnections.delete(connectionKey)
    })

    imap.once('end', () => {
      console.log('IMAP connection ended')
      activeConnections.delete(connectionKey)
    })

    imap.connect()

    // Store configuration
    await prisma.user.update({
      where: { id: userId },
      data: {
        workflowSettings: {
          ...((await prisma.user.findUnique({ where: { id: userId } }))?.workflowSettings as any || {}),
          emailToLead: {
            enabled: true,
            config: {
              host: config.host,
              user: config.user,
              filters: config.filters,
            },
            connectedAt: new Date().toISOString(),
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Email connection established',
      status: 'connected',
    })
  } catch (error: any) {
    console.error('Connection error:', error)
    return NextResponse.json(
      { error: 'Failed to connect', details: error.message },
      { status: 500 }
    )
  }
}

async function disconnectEmail(tenantId: string, userId: string) {
  try {
    const connectionKey = `${tenantId}-${userId}`
    const imap = activeConnections.get(connectionKey)

    if (imap) {
      imap.end()
      activeConnections.delete(connectionKey)
    }

    // Update user settings
    await prisma.user.update({
      where: { id: userId },
      data: {
        workflowSettings: {
          ...((await prisma.user.findUnique({ where: { id: userId } }))?.workflowSettings as any || {}),
          emailToLead: {
            enabled: false,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Email connection disconnected',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to disconnect', details: error.message },
      { status: 500 }
    )
  }
}

async function getConnectionStatus(tenantId: string, userId: string) {
  const connectionKey = `${tenantId}-${userId}`
  const isConnected = activeConnections.has(connectionKey)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { workflowSettings: true },
  })

  const emailToLead = (user?.workflowSettings as any)?.emailToLead

  return NextResponse.json({
    connected: isConnected,
    config: emailToLead?.config || null,
    connectedAt: emailToLead?.connectedAt || null,
  })
}

async function testConnection(config: EmailConfig) {
  try {
    const imapConfig = getImapConfig(config)
    const imap = new Imap(imapConfig)

    return new Promise((resolve, reject) => {
      imap.once('ready', () => {
        imap.end()
        resolve(
          NextResponse.json({
            success: true,
            message: 'Connection test successful',
          })
        )
      })

      imap.once('error', (err) => {
        imap.end()
        reject(
          NextResponse.json(
            { error: 'Connection test failed', details: err.message },
            { status: 400 }
          )
        )
      })

      imap.connect()
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Connection test failed', details: error.message },
      { status: 500 }
    )
  }
}

function getImapConfig(config: EmailConfig) {
  const isGmail = config.host.includes('gmail.com')
  const isOutlook = config.host.includes('outlook.com') || config.host.includes('office365.com')

  if (isGmail) {
    return {
      user: config.user,
      password: config.password,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    }
  } else if (isOutlook) {
    return {
      user: config.user,
      password: config.password,
      host: 'outlook.office365.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    }
  } else {
    return {
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port || 993,
      secure: config.secure,
      tls: config.secure,
    }
  }
}

async function processEmail(msg: any, config: EmailConfig, tenantId: string, userId: string) {
  msg.on('body', async (stream: any) => {
    try {
      const parsed = await simpleParser(stream)
      const from = parsed.from?.value[0]
      const email = from?.address || ''
      const name = from?.name || email.split('@')[0]

      // Apply filters
      if (config.filters?.ignore?.some((pattern) => email.includes(pattern))) {
        return // Ignore this email
      }

      if (config.filters?.from && !config.filters.from.some((pattern) => email.includes(pattern))) {
        return // Not in allowed list
      }

      // Check if lead already exists
      const existingLead = await prisma.salesLead.findUnique({
        where: {
          tenantId_email: {
            tenantId,
            email,
          },
        },
      })

      if (existingLead) {
        // Update existing lead with email content
        await prisma.salesActivity.create({
          data: {
            tenantId,
            type: 'EMAIL',
            subject: parsed.subject || 'Email from ' + name,
            description: parsed.text || parsed.html || null,
            status: 'COMPLETED',
            completedDate: parsed.date || new Date(),
            leadId: existingLead.id,
            assignedToId: userId,
            createdById: userId,
          },
        })
        return
      }

      // Extract company from email domain
      const company = email.split('@')[1]?.split('.')[0] || null

      // Calculate lead score
      let score = 5 // Base score for email leads
      if (company) score += 10
      if (parsed.subject?.toLowerCase().includes('demo') || parsed.subject?.toLowerCase().includes('trial')) {
        score += 15
      }
      if (parsed.text?.length && parsed.text.length > 100) score += 5

      // Create new lead
      const lead = await prisma.salesLead.create({
        data: {
          tenantId,
          firstName: name.split(' ')[0] || 'Unknown',
          lastName: name.split(' ').slice(1).join(' ') || '',
          email,
          company: company || null,
          leadSource: 'EMAIL',
          status: 'NEW',
          rating: score >= 20 ? 'HOT' : score >= 10 ? 'WARM' : 'COLD',
          score,
          assignedToId: userId,
          ownerId: userId,
          description: `Auto-created from email: ${parsed.subject || 'No subject'}`,
        },
      })

      // Create activity for the email
      await prisma.salesActivity.create({
        data: {
          tenantId,
          type: 'EMAIL',
          subject: parsed.subject || 'Email from ' + name,
          description: parsed.text || parsed.html || null,
          status: 'COMPLETED',
          completedDate: parsed.date || new Date(),
          leadId: lead.id,
          assignedToId: userId,
          createdById: userId,
        },
      })

      // Trigger automation
      await triggerAutomation(tenantId, 'LEAD_CREATED', { leadId: lead.id })

      console.log('Lead created from email:', lead.id)
    } catch (error) {
      console.error('Error processing email:', error)
    }
  })

  msg.once('end', () => {
    // Mark email as read (optional)
  })
}

async function triggerAutomation(tenantId: string, triggerType: string, data: any) {
  // Same automation trigger as webhook
  try {
    const rules = await prisma.salesAutomationRule.findMany({
      where: {
        tenantId,
        triggerType: triggerType as any,
        isActive: true,
      },
      orderBy: {
        priority: 'desc',
      },
    })

    for (const rule of rules) {
      const conditions = rule.triggerConditions as any
      if (evaluateConditions(conditions, data)) {
        await executeAutomationAction(rule, data)
      }
    }
  } catch (error) {
    console.error('Automation trigger error:', error)
  }
}

function evaluateConditions(conditions: any, data: any): boolean {
  if (!conditions || Object.keys(conditions).length === 0) {
    return true
  }
  return true
}

async function executeAutomationAction(rule: any, data: any) {
  const actionConfig = rule.actionConfig as any

  switch (rule.actionType) {
    case 'ASSIGN_LEAD':
      if (actionConfig.userId && data.leadId) {
        await prisma.salesLead.update({
          where: { id: data.leadId },
          data: { assignedToId: actionConfig.userId },
        })
      }
      break
    case 'CREATE_TASK':
      if (data.leadId) {
        await prisma.salesActivity.create({
          data: {
            tenantId: rule.tenantId,
            type: 'TASK',
            subject: actionConfig.subject || 'Follow up with lead',
            description: actionConfig.description || null,
            status: 'PLANNED',
            priority: actionConfig.priority || 'MEDIUM',
            leadId: data.leadId,
            assignedToId: actionConfig.assignedToId || rule.createdById,
            createdById: rule.createdById,
          },
        })
      }
      break
  }
}

