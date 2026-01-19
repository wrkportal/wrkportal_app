/**
 * Zoom Integration
 * 
 * Schedule and join Zoom meetings from sales activities
 */

import { BaseIntegration, SyncResult } from '../base-integration'

export class ZoomIntegration extends BaseIntegration {
  private apiKey?: string
  private apiSecret?: string
  private accessToken?: string
  private accountId?: string

  async testConnection(): Promise<boolean> {
    try {
      const credentials = this.decryptCredentials()
      this.apiKey = credentials.apiKey
      this.apiSecret = credentials.apiSecret
      this.accessToken = credentials.accessToken
      this.accountId = credentials.accountId

      if (!this.accessToken && (!this.apiKey || !this.apiSecret)) {
        throw new Error('Zoom credentials not configured')
      }

      // If we have access token, test it
      if (this.accessToken) {
        const response = await fetch('https://api.zoom.us/v2/users/me', {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Zoom API error: ${response.statusText}`)
        }

        return true
      }

      // Otherwise, we'll need to generate an access token from API key/secret
      // For now, return true if credentials exist
      return !!(this.apiKey && this.apiSecret)
    } catch (error) {
      console.error('Zoom connection test failed:', error)
      await this.updateStatus('ERROR', (error as Error).message)
      return false
    }
  }

  async syncFromExternal(): Promise<SyncResult> {
    return {
      success: true,
      recordsSynced: 0,
      errors: [],
      lastSyncAt: new Date(),
    }
  }

  async syncToExternal(data: any[]): Promise<SyncResult> {
    return {
      success: true,
      recordsSynced: 0,
      errors: [],
      lastSyncAt: new Date(),
    }
  }

  /**
   * Generate OAuth access token from API key/secret
   */
  private async generateAccessToken(): Promise<string> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Zoom API key and secret required')
    }

    // Zoom uses Account-level OAuth (Server-to-Server)
    const accountId = this.decryptCredentials().accountId
    if (!accountId) {
      throw new Error('Zoom account ID required for OAuth')
    }

    // For Server-to-Server OAuth, we need to make a token request
    // This is a simplified version - in production, you'd want to cache tokens
    const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')
    
    const response = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to generate Zoom access token: ${response.statusText}`)
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
   * Create a Zoom meeting
   */
  async createMeeting(topic: string, startTime: Date, duration: number, attendees?: string[]): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()

      const meetingData: any = {
        topic,
        type: 2, // Scheduled meeting
        start_time: startTime.toISOString().replace(/\.\d{3}Z$/, 'Z'), // Zoom format
        duration,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        settings: {
          join_before_host: true,
          participant_video: true,
          host_video: true,
          mute_upon_entry: false,
        },
      }

      if (attendees && attendees.length > 0) {
        meetingData.settings.approval_type = 0 // Automatically approve
      }

      const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Zoom API error: ${error}`)
      }

      const meeting = await response.json()
      return {
        id: meeting.id.toString(),
        join_url: meeting.join_url,
        start_url: meeting.start_url,
        password: meeting.password,
        topic: meeting.topic,
        start_time: meeting.start_time,
        duration: meeting.duration,
      }
    } catch (error) {
      console.error('Error creating Zoom meeting:', error)
      throw error
    }
  }

  /**
   * Update meeting
   */
  async updateMeeting(meetingId: string, updates: any): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken()

      const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Zoom API error: ${error}`)
      }

      return true
    } catch (error) {
      console.error('Error updating Zoom meeting:', error)
      return false
    }
  }

  /**
   * Delete meeting
   */
  async deleteMeeting(meetingId: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken()

      const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      return response.ok || response.status === 204
    } catch (error) {
      console.error('Error deleting Zoom meeting:', error)
      return false
    }
  }
}

