/**
 * DocuSign Integration
 * 
 * Electronic signature and document management
 */

import { BaseIntegration, SyncResult } from '../base-integration'

export class DocuSignIntegration extends BaseIntegration {
  private accessToken?: string
  private accountId?: string
  private baseUrl?: string

  async testConnection(): Promise<boolean> {
    try {
      const credentials = this.decryptCredentials()
      this.accessToken = credentials.accessToken
      this.accountId = credentials.accountId
      this.baseUrl = credentials.baseUrl || 'https://demo.docusign.net'

      if (!this.accessToken || !this.accountId) {
        throw new Error('DocuSign credentials not configured')
      }

      // Test connection by getting account info
      const response = await fetch(`${this.baseUrl}/restapi/v2.1/accounts/${this.accountId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`DocuSign API error: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('DocuSign connection test failed:', error)
      await this.updateStatus('ERROR', (error as Error).message)
      return false
    }
  }

  async syncFromExternal(): Promise<SyncResult> {
    // DocuSign is primarily for sending documents, not syncing data
    return {
      success: true,
      recordsSynced: 0,
      errors: [],
      lastSyncAt: new Date(),
    }
  }

  async syncToExternal(data: any[]): Promise<SyncResult> {
    // Not applicable for DocuSign
    return {
      success: true,
      recordsSynced: 0,
      errors: [],
      lastSyncAt: new Date(),
    }
  }

  /**
   * Send envelope for signature
   */
  async sendEnvelope(
    documentBase64: string,
    documentName: string,
    signerEmail: string,
    signerName: string,
    subject?: string,
    emailBlurb?: string
  ): Promise<any> {
    try {
      if (!this.accessToken || !this.accountId || !this.baseUrl) {
        await this.testConnection()
      }

      const envelopeDefinition = {
        emailSubject: subject || `Please sign: ${documentName}`,
        emailBlurb: emailBlurb || 'Please review and sign this document.',
        documents: [
          {
            documentBase64,
            name: documentName,
            fileExtension: 'pdf',
            documentId: '1',
          },
        ],
        recipients: {
          signers: [
            {
              email: signerEmail,
              name: signerName,
              recipientId: '1',
              routingOrder: '1',
              tabs: {
                signHereTabs: [
                  {
                    documentId: '1',
                    pageNumber: '1',
                    xPosition: '100',
                    yPosition: '100',
                  },
                ],
              },
            },
          ],
        },
        status: 'sent',
      }

      const response = await fetch(
        `${this.baseUrl}/restapi/v2.1/accounts/${this.accountId}/envelopes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(envelopeDefinition),
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`DocuSign API error: ${error}`)
      }

      const envelope = await response.json()
      return {
        envelopeId: envelope.envelopeId,
        status: envelope.status,
        statusDateTime: envelope.statusDateTime,
      }
    } catch (error) {
      console.error('Error sending DocuSign envelope:', error)
      throw error
    }
  }

  /**
   * Get envelope status
   */
  async getEnvelopeStatus(envelopeId: string): Promise<any> {
    try {
      if (!this.accessToken || !this.accountId || !this.baseUrl) {
        await this.testConnection()
      }

      const response = await fetch(
        `${this.baseUrl}/restapi/v2.1/accounts/${this.accountId}/envelopes/${envelopeId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`DocuSign API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting DocuSign envelope status:', error)
      throw error
    }
  }

  /**
   * Download signed document
   */
  async downloadDocument(envelopeId: string, documentId: string = 'combined'): Promise<Buffer> {
    try {
      if (!this.accessToken || !this.accountId || !this.baseUrl) {
        await this.testConnection()
      }

      const response = await fetch(
        `${this.baseUrl}/restapi/v2.1/accounts/${this.accountId}/envelopes/${envelopeId}/documents/${documentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`DocuSign API error: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error('Error downloading DocuSign document:', error)
      throw error
    }
  }
}

