/**
 * Webex Integration
 * 
 * Schedule and join Webex meetings from sales activities
 */

import { BaseIntegration, SyncResult } from '../base-integration'

export class WebexIntegration extends BaseIntegration {
  private accessToken?: string
  private siteUrl?: string

  async testConnection(): Promise<boolean> {
    try {
      const credentials = this.decryptCredentials()
      this.accessToken = credentials.accessToken
      this.siteUrl = credentials.siteUrl || credentials.instanceUrl

      if (!this.accessToken) {
        throw new Error('Webex credentials not configured')
      }

      // Test connection by getting user info
      const response = await fetch('https://webexapis.com/v1/people/me', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Webex API error: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('Webex connection test failed:', error)
      await this.updateStatus('ERROR', (error as Error).message)
      return false
    }
  }

  async syncFromExternal(): Promise<SyncResult> {
    // Webex is primarily one-way (we create meetings)
    return {
      success: true,
      recordsSynced: 0,
      errors: [],
      lastSyncAt: new Date(),
    }
  }

  async syncToExternal(data: any[]): Promise<SyncResult> {
    // Not applicable for Webex
    return {
      success: true,
      recordsSynced: 0,
      errors: [],
      lastSyncAt: new Date(),
    }
  }

  /**
   * Generate OAuth access token from client credentials
   */
  private async generateAccessToken(): Promise<string> {
    const credentials = this.decryptCredentials()
    const clientId = credentials.clientId
    const clientSecret = credentials.clientSecret

    if (!clientId || !clientSecret) {
      throw new Error('Webex client ID and secret required')
    }

    const response = await fetch('https://webexapis.com/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate Webex access token: ${response.statusText}`)
    }

    const data = await response.json()
    this.accessToken = data.access_token
    return data.access_token
  }

  /**
   * Get access token (use existing or generate new)
   */
  private async getAccessToken(): Promise<string> {
    const credentials = this.decryptCredentials()
    if (credentials.accessToken) {
      return credentials.accessToken
    }

    if (this.accessToken) {
      return this.accessToken
    }

    // Generate new token
    return await this.generateAccessToken()
  }

  /**
   * Create a Webex meeting
   */
  async createMeeting(
    topic: string,
    startTime: Date,
    duration: number,
    attendees?: string[]
  ): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()

      const meetingData: any = {
        title: topic,
        start: startTime.toISOString(),
        end: new Date(startTime.getTime() + duration * 60000).toISOString(),
        enabledAutoRecordMeeting: false,
        allowAnyUserToBeCoHost: false,
        enableJoinBeforeHost: true,
        enableConnectAudioBeforeHost: true,
        joinBeforeHostMinutes: 5,
        publicMeeting: false,
        reminderTime: 15,
        agenda: `Sales meeting: ${topic}`,
      }

      if (attendees && attendees.length > 0) {
        meetingData.invitees = attendees.map(email => ({ email }))
      }

      const response = await fetch('https://webexapis.com/v1/meetings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Webex API error: ${error}`)
      }

      const meeting = await response.json()
      return {
        id: meeting.id,
        joinUrl: meeting.webLink,
        startUrl: meeting.webLink,
        password: meeting.password,
        topic: meeting.title,
        startTime: meeting.start,
        duration: duration,
        sipAddress: meeting.sipAddress,
      }
    } catch (error) {
      console.error('Error creating Webex meeting:', error)
      throw error
    }
  }

  /**
   * Update meeting
   */
  async updateMeeting(meetingId: string, updates: any): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken()

      const response = await fetch(`https://webexapis.com/v1/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Webex API error: ${error}`)
      }

      return true
    } catch (error) {
      console.error('Error updating Webex meeting:', error)
      return false
    }
  }

  /**
   * Delete meeting
   */
  async deleteMeeting(meetingId: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken()

      const response = await fetch(`https://webexapis.com/v1/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      return response.ok || response.status === 204
    } catch (error) {
      console.error('Error deleting Webex meeting:', error)
      return false
    }
  }

  /**
   * Send notification to Webex space
   */
  async sendNotification(spaceId: string, message: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken()

      const response = await fetch('https://webexapis.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: spaceId,
          text: message,
        }),
      })

      return response.ok
    } catch (error) {
      console.error('Error sending Webex notification:', error)
      return false
    }
  }
}

