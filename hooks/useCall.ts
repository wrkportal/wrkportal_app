/**
 * Hook for managing WebRTC calls
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

export interface CallParticipant {
  id: string
  userId: string
  name: string
  avatar?: string
  isMuted: boolean
  isVideoOn: boolean
  isScreenSharing: boolean
  role: 'HOST' | 'PARTICIPANT' | 'MODERATOR'
}

export interface CallData {
  id: string
  roomId: string
  type: 'ONE_ON_ONE' | 'GROUP' | 'SCHEDULED'
  status: 'INITIATED' | 'RINGING' | 'ACTIVE' | 'ENDED' | 'CANCELLED'
  title?: string
  description?: string
  participants: CallParticipant[]
  createdBy: {
    id: string
    name: string
    avatar?: string
  }
}

export interface UseCallReturn {
  call: CallData | null
  localStream: MediaStream | null
  screenStream: MediaStream | null
  remoteStreams: Map<string, MediaStream>
  isConnecting: boolean
  isActive: boolean
  isScreenSharing: boolean
  isRecording: boolean
  recordingDuration: number
  error: string | null
  joinCall: (callId: string) => Promise<void>
  leaveCall: () => Promise<void>
  toggleMute: () => Promise<void>
  toggleVideo: () => Promise<void>
  toggleScreenShare: () => Promise<void>
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  startCall: (participantIds?: string[], title?: string) => Promise<string>
}

export function useCall(): UseCallReturn {
  const user = useAuthStore((state) => state.user)
  const [call, setCall] = useState<CallData | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())
  const [isConnecting, setIsConnecting] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingStartTimeRef = useRef<number>(0)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const isActive = call?.status === 'ACTIVE'

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup streams
      localStreamRef.current?.getTracks().forEach((track) => track.stop())
      screenStreamRef.current?.getTracks().forEach((track) => track.stop())
      peerConnectionsRef.current.forEach((pc) => pc.close())
      peerConnectionsRef.current.clear()
      
      // Stop recording if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [])

  // Get user media with fallback to audio-only if video fails
  const getUserMedia = useCallback(async (constraints: MediaStreamConstraints) => {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices API not supported in this browser')
      }

      // Try to get both audio and video
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        localStreamRef.current = stream
        setLocalStream(stream)
        return stream
      } catch (videoError: any) {
        // If video fails, try audio-only
        if (constraints.video) {
          console.warn('Video access failed, trying audio-only:', videoError)
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
            localStreamRef.current = audioStream
            setLocalStream(audioStream)
            setError('Camera not available. Using audio-only mode.')
            return audioStream
          } catch (audioError: any) {
            // If audio also fails, check error type
            if (audioError.name === 'NotFoundError' || audioError.name === 'NotReadableError') {
              throw new Error('No microphone or camera found. Please check your device settings.')
            } else if (audioError.name === 'NotAllowedError' || audioError.name === 'PermissionDeniedError') {
              throw new Error('Camera and microphone permissions were denied. Please allow access and try again.')
            } else {
              throw new Error('Unable to access camera or microphone. Please check your device settings.')
            }
          }
        } else {
          // Audio-only request failed
          if (videoError.name === 'NotFoundError' || videoError.name === 'NotReadableError') {
            throw new Error('No microphone found. Please check your device settings.')
          } else if (videoError.name === 'NotAllowedError' || videoError.name === 'PermissionDeniedError') {
            throw new Error('Microphone permission was denied. Please allow access and try again.')
          } else {
            throw new Error('Unable to access microphone. Please check your device settings.')
          }
        }
      }
    } catch (err: any) {
      console.error('Error getting user media:', err)
      const errorMessage = err.message || 'Failed to access camera/microphone'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  // Start a new call
  const startCall = useCallback(async (participantIds?: string[], title?: string) => {
    try {
      setIsConnecting(true)
      setError(null)

      // Get user media
      await getUserMedia({ video: true, audio: true })

      // Create call via API
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: participantIds && participantIds.length > 1 ? 'GROUP' : 'ONE_ON_ONE',
          title,
          participantIds,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create call')
      }

      const data = await response.json()
      setCall(data.call)

      // Update call status to ACTIVE
      await fetch(`/api/calls/${data.call.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      })

      return data.call.id
    } catch (err: any) {
      console.error('Error starting call:', err)
      setError(err.message || 'Failed to start call')
      throw err
    } finally {
      setIsConnecting(false)
    }
  }, [getUserMedia])

  // Join an existing call
  const joinCall = useCallback(async (callId: string) => {
    try {
      setIsConnecting(true)
      setError(null)

      // Get user media
      await getUserMedia({ video: true, audio: true })

      // Fetch call details
      const response = await fetch(`/api/calls/${callId}`)
      if (!response.ok) {
        throw new Error('Call not found')
      }

      const data = await response.json()
      setCall(data.call)

      // Add self as participant (if not already added)
      if (user?.id && !data.call.participants.some((p: any) => p.userId === user.id)) {
        await fetch(`/api/calls/${callId}/participants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
      }

      // Update call status to ACTIVE if not already
      if (data.call.status !== 'ACTIVE') {
        await fetch(`/api/calls/${callId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ACTIVE' }),
        })
      }
    } catch (err: any) {
      console.error('Error joining call:', err)
      setError(err.message || 'Failed to join call')
      throw err
    } finally {
      setIsConnecting(false)
    }
  }, [getUserMedia])

  // Leave call
  const leaveCall = useCallback(async () => {
    try {
      if (!call) return

      // Stop local stream
      localStreamRef.current?.getTracks().forEach((track) => track.stop())
      setLocalStream(null)
      localStreamRef.current = null

      // Close peer connections
      peerConnectionsRef.current.forEach((pc) => pc.close())
      peerConnectionsRef.current.clear()
      setRemoteStreams(new Map())

      // Remove participant
      await fetch(`/api/calls/${call.id}/participants`, {
        method: 'DELETE',
      })

      // Update call status
      await fetch(`/api/calls/${call.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ENDED' }),
      })

      setCall(null)
    } catch (err: any) {
      console.error('Error leaving call:', err)
      setError(err.message || 'Failed to leave call')
    }
  }, [call])

  // Toggle mute
  const toggleMute = useCallback(async () => {
    try {
      if (!call || !localStreamRef.current) return

      const audioTracks = localStreamRef.current.getAudioTracks()
      const isMuted = audioTracks[0]?.enabled ?? false

      audioTracks.forEach((track) => {
        track.enabled = !isMuted
      })

      // Update participant status
      await fetch(`/api/calls/${call.id}/participants`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMuted: !isMuted }),
      })
    } catch (err: any) {
      console.error('Error toggling mute:', err)
    }
  }, [call])

  // Toggle video
  const toggleVideo = useCallback(async () => {
    try {
      if (!call || !localStreamRef.current) return

      const videoTracks = localStreamRef.current.getVideoTracks()
      const isVideoOn = videoTracks[0]?.enabled ?? false

      videoTracks.forEach((track) => {
        track.enabled = !isVideoOn
      })

      // Update participant status
      await fetch(`/api/calls/${call.id}/participants`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVideoOn: !isVideoOn }),
      })
    } catch (err: any) {
      console.error('Error toggling video:', err)
    }
  }, [call])

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    try {
      if (!call) return

      if (isScreenSharing && screenStreamRef.current) {
        // Stop screen sharing
        screenStreamRef.current.getTracks().forEach((track) => {
          track.stop()
        })
        screenStreamRef.current = null
        setScreenStream(null)
        setIsScreenSharing(false)

        // Update participant status
        await fetch(`/api/calls/${call.id}/participants`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isScreenSharing: false }),
        })
      } else {
        // Start screen sharing
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          })

          screenStreamRef.current = screenStream
          setScreenStream(screenStream)
          setIsScreenSharing(true)

          // Handle screen sharing stop (user clicks stop sharing in browser)
          screenStream.getVideoTracks()[0].addEventListener('ended', () => {
            toggleScreenShare()
          })

          // Update participant status
          await fetch(`/api/calls/${call.id}/participants`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isScreenSharing: true }),
          })
        } catch (err: any) {
          if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
            console.error('Error starting screen share:', err)
            setError('Failed to start screen sharing')
          }
        }
      }
    } catch (err: any) {
      console.error('Error toggling screen share:', err)
      setError(err.message || 'Failed to toggle screen sharing')
    }
  }, [call, isScreenSharing])

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      if (!call || !localStreamRef.current) {
        throw new Error('No active call or stream')
      }

      // Combine local stream with screen share if available
      const streamToRecord = screenStreamRef.current || localStreamRef.current

      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder API not supported in this browser')
      }

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4'

      const mediaRecorder = new MediaRecorder(streamToRecord, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      })

      recordedChunksRef.current = []
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(recordedChunksRef.current, { type: mimeType })
          const duration = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000)

          // Create object URL for download
          const url = URL.createObjectURL(blob)
          
          // In production, you'd upload this to a storage service (S3, Azure Blob, etc.)
          // For now, we'll save the metadata and the blob URL
          const fileUrl = url // In production, this would be the uploaded file URL
          const fileSize = blob.size

          // Save recording metadata
          await fetch(`/api/calls/${call.id}/recordings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileUrl,
              fileSize,
              duration,
              format: mimeType.split(';')[0].split('/')[1], // Extract format (webm, mp4)
            }),
          })

          // Reset state
          setRecordingDuration(0)
          recordedChunksRef.current = []
        } catch (err: any) {
          console.error('Error saving recording:', err)
          setError('Failed to save recording')
        }
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      recordingStartTimeRef.current = Date.now()

      // Update duration every second
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - recordingStartTimeRef.current) / 1000))
      }, 1000)
    } catch (err: any) {
      console.error('Error starting recording:', err)
      setError(err.message || 'Failed to start recording')
    }
  }, [call])

  // Stop recording
  const stopRecording = useCallback(async () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
        setIsRecording(false)
        
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current)
          recordingIntervalRef.current = null
        }
      }
    } catch (err: any) {
      console.error('Error stopping recording:', err)
      setError(err.message || 'Failed to stop recording')
    }
  }, [])

  return {
    call,
    localStream,
    screenStream,
    remoteStreams,
    isConnecting,
    isActive,
    isScreenSharing,
    isRecording,
    recordingDuration,
    error,
    joinCall,
    leaveCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    startRecording,
    stopRecording,
    startCall,
  }
}
