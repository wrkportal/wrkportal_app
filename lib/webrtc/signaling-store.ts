/**
 * Signaling Message Store
 * Temporary in-memory store for signaling messages
 * In production, replace with Redis or a message queue
 */

import { SignalingMessage } from './signaling'

interface StoredSignal extends SignalingMessage {
  timestamp: number
  id: string
}

class SignalingStore {
  private signals: Map<string, StoredSignal[]> = new Map()
  private readonly TTL = 60000 // 60 seconds

  /**
   * Store a signaling message
   */
  store(callId: string, message: SignalingMessage): string {
    const signalId = `${callId}:${Date.now()}:${Math.random().toString(36)}`
    const stored: StoredSignal = {
      ...message,
      timestamp: Date.now(),
      id: signalId,
    }

    if (!this.signals.has(callId)) {
      this.signals.set(callId, [])
    }

    this.signals.get(callId)!.push(stored)
    this.cleanup(callId)

    return signalId
  }

  /**
   * Get signaling messages for a call since a timestamp
   */
  getSince(callId: string, since: number, excludeUserId?: string): SignalingMessage[] {
    const callSignals = this.signals.get(callId) || []
    const filtered = callSignals.filter(
      (signal) => signal.timestamp > since && signal.fromUserId !== excludeUserId
    )
    this.cleanup(callId)
    return filtered.map(({ id, timestamp, ...signal }) => signal)
  }

  /**
   * Clean up old signals
   */
  private cleanup(callId: string) {
    const callSignals = this.signals.get(callId)
    if (!callSignals) return

    const now = Date.now()
    const filtered = callSignals.filter((signal) => now - signal.timestamp < this.TTL)
    this.signals.set(callId, filtered)
  }

  /**
   * Clear all signals for a call
   */
  clear(callId: string) {
    this.signals.delete(callId)
  }
}

// Singleton instance
export const signalingStore = new SignalingStore()
