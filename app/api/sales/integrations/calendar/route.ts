import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'
import { Client } from '@microsoft/microsoft-graph-client'
import 'isomorphic-fetch'

/**
 * Calendar Sync Integration
 * Syncs Gmail/Outlook calendars with sales activities
 */

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, provider, config } = body

    if (action === 'connect') {
      return await connectCalendar(provider, config, session.user.tenantId!, session.user.id)
    } else if (action === 'sync') {
      return await syncCalendar(provider, session.user.tenantId!, session.user.id)
    } else if (action === 'disconnect') {
      return await disconnectCalendar(provider, session.user.tenantId!, session.user.id)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Calendar sync error:', error)
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    )
  }
}

async function connectCalendar(
  provider: 'gmail' | 'outlook',
  config: any,
  tenantId: string,
  userId: string
) {
  try {
    // Store calendar configuration
    await prisma.user.update({
      where: { id: userId },
      data: {
        workflowSettings: {
          ...((await prisma.user.findUnique({ where: { id: userId } }))?.workflowSettings as any || {}),
          calendarSync: {
            provider,
            enabled: true,
            config: {
              accessToken: config.accessToken,
              refreshToken: config.refreshToken,
              email: config.email,
            },
            connectedAt: new Date().toISOString(),
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Calendar connected successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to connect calendar', details: error.message },
      { status: 500 }
    )
  }
}

async function syncCalendar(provider: 'gmail' | 'outlook', tenantId: string, userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { workflowSettings: true },
    })

    const calendarConfig = (user?.workflowSettings as any)?.calendarSync

    if (!calendarConfig || !calendarConfig.enabled) {
      return NextResponse.json(
        { error: 'Calendar not connected' },
        { status: 400 }
      )
    }

    let events: any[] = []

    if (provider === 'gmail') {
      events = await syncGoogleCalendar(calendarConfig.config)
    } else if (provider === 'outlook') {
      events = await syncOutlookCalendar(calendarConfig.config)
    }

    // Create activities from calendar events
    const createdActivities = []
    for (const event of events) {
      // Check if activity already exists (check both CALL and MEETING types)
      const existing = await prisma.salesActivity.findFirst({
        where: {
          tenantId,
          OR: [
            { type: 'MEETING' },
            { type: 'CALL' },
          ],
          subject: event.summary || event.subject,
          dueDate: event.start ? new Date(event.start) : null,
        },
      })

      if (!existing) {
        // Try to find related lead/contact/opportunity by email
        const attendeeEmails = event.attendees?.map((a: any) => a.email || a.address) || []
        let relatedLeadId = null
        let relatedContactId = null
        let relatedOpportunityId = null

        if (attendeeEmails.length > 0) {
          const lead = await prisma.salesLead.findFirst({
            where: {
              tenantId,
              email: { in: attendeeEmails },
            },
          })
          if (lead) relatedLeadId = lead.id

          const contact = await prisma.salesContact.findFirst({
            where: {
              tenantId,
              email: { in: attendeeEmails },
            },
          })
          if (contact) relatedContactId = contact.id

          if (contact) {
            const opportunity = await prisma.salesOpportunity.findFirst({
              where: {
                tenantId,
                contacts: {
                  some: {
                    contactId: contact.id,
                  },
                },
              },
            })
            if (opportunity) relatedOpportunityId = opportunity.id
          }
        }

        // Detect if this is a video call (Google Meet or Microsoft Teams)
        const eventDescription = event.description || event.body?.content || ''
        const eventLocation = event.location?.displayName || event.location || ''
        const combinedText = `${eventDescription} ${eventLocation}`.toLowerCase()
        
        // Check for video call indicators
        const isGoogleMeet = combinedText.includes('meet.google.com') || 
                            combinedText.includes('google meet') ||
                            event.videoCallLink?.includes('meet.google.com')
        
        const isTeamsCall = combinedText.includes('teams.microsoft.com') || 
                           combinedText.includes('msteams') ||
                           combinedText.includes('teams meeting') ||
                           event.onlineMeeting?.joinUrl?.includes('teams.microsoft.com')
        
        // Determine activity type: CALL for video calls, MEETING for in-person
        const activityType = (isGoogleMeet || isTeamsCall) ? 'CALL' : 'MEETING'
        
        // Extract meeting link for video calls
        let meetingLink = null
        if (isGoogleMeet) {
          // Extract Google Meet link from description or use provided link
          const meetLinkMatch = combinedText.match(/https?:\/\/meet\.google\.com\/[a-z-]+/i) ||
                               event.videoCallLink?.match(/https?:\/\/meet\.google\.com\/[a-z-]+/i)
          meetingLink = meetLinkMatch ? meetLinkMatch[0] : event.videoCallLink
        } else if (isTeamsCall) {
          // Extract Teams link from description or use provided link
          const teamsLinkMatch = combinedText.match(/https?:\/\/teams\.microsoft\.com\/[^\s<>"]+/i) ||
                                event.onlineMeeting?.joinUrl?.match(/https?:\/\/teams\.microsoft\.com\/[^\s<>"]+/i)
          meetingLink = teamsLinkMatch ? teamsLinkMatch[0] : event.onlineMeeting?.joinUrl
        }
        
        // Build description with meeting link if it's a video call
        let finalDescription = eventDescription || event.body?.content || null
        if (meetingLink && activityType === 'CALL') {
          finalDescription = finalDescription 
            ? `${finalDescription}\n\nVideo Call Link: ${meetingLink}`
            : `Video Call Link: ${meetingLink}`
        }

        const activity = await prisma.salesActivity.create({
          data: {
            tenantId,
            type: activityType,
            subject: event.summary || event.subject || (activityType === 'CALL' ? 'Video Call' : 'Calendar Meeting'),
            description: finalDescription,
            status: event.start && new Date(event.start) < new Date() ? 'COMPLETED' : 'PLANNED',
            dueDate: event.start ? new Date(event.start) : null,
            completedDate: event.start && new Date(event.start) < new Date() ? new Date(event.start) : null,
            duration: event.duration ? Math.round(event.duration / 60000) : null, // Convert to minutes
            location: activityType === 'CALL' ? (isGoogleMeet ? 'Google Meet' : 'Microsoft Teams') : (event.location?.displayName || event.location || null),
            leadId: relatedLeadId,
            contactId: relatedContactId,
            opportunityId: relatedOpportunityId,
            assignedToId: userId,
            createdById: userId,
          },
        })

        createdActivities.push(activity.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${events.length} events, created ${createdActivities.length} activities`,
      eventsSynced: events.length,
      activitiesCreated: createdActivities.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to sync calendar', details: error.message },
      { status: 500 }
    )
  }
}

async function syncGoogleCalendar(config: any) {
  try {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Get events from last 7 days and next 30 days
    const timeMin = new Date()
    timeMin.setDate(timeMin.getDate() - 7)
    const timeMax = new Date()
    timeMax.setDate(timeMax.getDate() + 30)

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    })

    return (response.data.items || []).map((event) => {
      // Extract Google Meet link from conferenceData or description
      let videoCallLink = null
      if (event.conferenceData?.entryPoints) {
        const meetEntry = event.conferenceData.entryPoints.find(
          (ep: any) => ep.entryPointType === 'video' && ep.uri?.includes('meet.google.com')
        )
        videoCallLink = meetEntry?.uri || null
      }
      
      // Also check description for meet link if not in conferenceData
      if (!videoCallLink && event.description) {
        const meetLinkMatch = event.description.match(/https?:\/\/meet\.google\.com\/[a-z-]+/i)
        if (meetLinkMatch) videoCallLink = meetLinkMatch[0]
      }

      return {
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        location: event.location,
        attendees: event.attendees?.map((a) => ({
          email: a.email,
          name: a.displayName,
        })),
        duration: event.start && event.end
          ? new Date(event.end.dateTime || event.end.date).getTime() -
            new Date(event.start.dateTime || event.start.date).getTime()
          : null,
        videoCallLink, // Google Meet link
        conferenceData: event.conferenceData, // Full conference data for reference
      }
    })
  } catch (error: any) {
    console.error('Google Calendar sync error:', error)
    throw error
  }
}

async function syncOutlookCalendar(config: any) {
  try {
    const client = Client.init({
      authProvider: (done) => {
        done(null, config.accessToken)
      },
    })

    // Get events from last 7 days and next 30 days
    const timeMin = new Date()
    timeMin.setDate(timeMin.getDate() - 7)
    const timeMax = new Date()
    timeMax.setDate(timeMax.getDate() + 30)

    const response = await client
      .api('/me/calendar/events')
      .filter(`start/dateTime ge '${timeMin.toISOString()}' and start/dateTime le '${timeMax.toISOString()}'`)
      .top(100)
      .orderby('start/dateTime')
      .get()

    return (response.value || []).map((event: any) => {
      // Extract Teams meeting link from onlineMeeting
      const teamsJoinUrl = event.onlineMeeting?.joinUrl || null

      return {
        id: event.id,
        subject: event.subject,
        body: event.body,
        start: event.start?.dateTime,
        end: event.end?.dateTime,
        location: event.location,
        attendees: event.attendees?.map((a: any) => ({
          email: a.emailAddress?.address,
          name: a.emailAddress?.name,
        })),
        duration: event.start && event.end
          ? new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime()
          : null,
        onlineMeeting: event.onlineMeeting, // Teams meeting data
      }
    })
  } catch (error: any) {
    console.error('Outlook Calendar sync error:', error)
    throw error
  }
}

async function disconnectCalendar(provider: 'gmail' | 'outlook', tenantId: string, userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        workflowSettings: {
          ...((await prisma.user.findUnique({ where: { id: userId } }))?.workflowSettings as any || {}),
          calendarSync: {
            provider,
            enabled: false,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Calendar disconnected',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to disconnect calendar', details: error.message },
      { status: 500 }
    )
  }
}

