/**
 * WebRTC Signaling Client
 * Handles SDP offer/answer and ICE candidate exchange
 */

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'hangup'
  fromUserId: string
  targetUserId?: string // For direct messages, undefined for broadcast
  sdp?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
  callId: string
}

export class SignalingClient {
  private callId: string
  private userId: string
  private onMessage: (message: SignalingMessage) => void
  private pollingInterval: NodeJS.Timeout | null = null
  private lastPollTime: number = Date.now()

  constructor(
    callId: string,
    userId: string,
    onMessage: (message: SignalingMessage) => void
  ) {
    this.callId = callId
    this.userId = userId
    this.onMessage = onMessage
  }

  /**
   * Start polling for signaling messages
   */
  startPolling(interval: number = 1000) {
    if (this.pollingInterval) {
      this.stopPolling()
    }

    this.pollingInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/calls/${this.callId}/signal?since=${this.lastPollTime}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.signals && Array.isArray(data.signals)) {
            data.signals.forEach((signal: SignalingMessage) => {
              // Only process messages not from self
              if (signal.fromUserId !== this.userId) {
                this.onMessage(signal)
              }
            })
            this.lastPollTime = Date.now()
          }
        }
      } catch (error) {
        console.error('Error polling for signals:', error)
      }
    }, interval)
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
  }

  /**
   * Send signaling message
   */
  async sendMessage(message: Omit<SignalingMessage, 'fromUserId' | 'callId'>) {
    try {
      const response = await fetch(`/api/calls/${this.callId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...message,
          fromUserId: this.userId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send signaling message')
      }

      return await response.json()
    } catch (error) {
      console.error('Error sending signal:', error)
      throw error
    }
  }

  /**
   * Send SDP offer
   */
  async sendOffer(sdp: RTCSessionDescriptionInit, targetUserId?: string) {
    return this.sendMessage({
      type: 'offer',
      sdp,
      targetUserId,
    })
  }

  /**
   * Send SDP answer
   */
  async sendAnswer(sdp: RTCSessionDescriptionInit, targetUserId?: string) {
    return this.sendMessage({
      type: 'answer',
      sdp,
      targetUserId,
    })
  }

  /**
   * Send ICE candidate
   */
  async sendIceCandidate(candidate: RTCIceCandidateInit, targetUserId?: string) {
    return this.sendMessage({
      type: 'ice-candidate',
      candidate,
      targetUserId,
    })
  }

  /**
   * Send hangup signal
   */
  async sendHangup() {
    return this.sendMessage({
      type: 'hangup',
    })
  }
}
