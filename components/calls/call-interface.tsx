/**
 * Main Call Interface Component
 * Displays video/audio streams and controls for WebRTC calls
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { useCall } from '@/hooks/useCall'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Users, MessageCircle, Circle, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CallChatPanel } from './call-chat-panel'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CallInterfaceProps {
  callId: string | null
  open: boolean
  onClose: () => void
  onCallEnd?: () => void
}

export function CallInterface({ callId, open, onClose, onCallEnd }: CallInterfaceProps) {
  const user = useAuthStore((state) => state.user)
  const [showChat, setShowChat] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const {
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
  } = useCall()

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())

  // Format recording duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Join call when callId changes
  useEffect(() => {
    if (open && callId && !call) {
      joinCall(callId).catch(console.error)
    }
  }, [open, callId, call, joinCall])

  // Set local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Set screen share stream
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream
    } else if (screenVideoRef.current && !screenStream) {
      screenVideoRef.current.srcObject = null
    }
  }, [screenStream])

  // Set remote video streams
  useEffect(() => {
    remoteStreams.forEach((stream, userId) => {
      const videoElement = remoteVideoRefs.current.get(userId)
      if (videoElement) {
        videoElement.srcObject = stream
      }
    })
  }, [remoteStreams])

  // Handle close
  const handleClose = async () => {
    if (call) {
      await leaveCall()
    }
    onClose()
    if (onCallEnd) {
      onCallEnd()
    }
  }

  const currentParticipant = call?.participants.find((p) => p.userId === user?.id)
  const isMuted = currentParticipant?.isMuted ?? false
  const isVideoOn = currentParticipant?.isVideoOn ?? (localStream?.getVideoTracks().length > 0 && localStream.getVideoTracks()[0].enabled)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>{call?.title || 'Call'}</span>
              {call && (
                <span className="text-sm text-muted-foreground font-normal">
                  {call.participants.length} {call.participants.length === 1 ? 'participant' : 'participants'}
                </span>
              )}
              {isRecording && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <Circle className="h-2 w-2 fill-destructive animate-pulse" />
                  <span>Recording {formatDuration(recordingDuration)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {call && (
                <Button
                  variant={showParticipants ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowParticipants(!showParticipants)}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  {call.participants.filter((p) => p.userId !== user?.id).length}
                </Button>
              )}
              <Button
                variant={showChat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowChat(!showChat)}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Chat
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-4 m-6 min-h-0">
          {/* Main Video Area */}
          <div className={cn(
            "flex-1 relative bg-black rounded-lg overflow-hidden transition-all",
            (showChat || showParticipants) && "flex-[2]"
          )}>
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 z-50">
              <div className="text-center text-white p-4">
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Connecting...</p>
              </div>
            </div>
          )}

          {/* Screen Share Display */}
          {isActive && isScreenSharing && screenStream && (
            <div className="absolute inset-0 p-4 z-10">
              <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded text-sm flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span>Screen Sharing</span>
                </div>
              </div>
            </div>
          )}

          {/* Remote Video Streams Grid */}
          {isActive && (
            <div className={cn(
              "grid grid-cols-1 md:grid-cols-2 gap-4 p-4 h-full",
              isScreenSharing && "opacity-30"
            )}>
              {call?.participants
                .filter((p) => p.userId !== user?.id)
                .map((participant) => (
                  <div
                    key={participant.id}
                    className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video"
                  >
                    <video
                      ref={(el) => {
                        if (el) {
                          remoteVideoRefs.current.set(participant.userId, el)
                        } else {
                          remoteVideoRefs.current.delete(participant.userId)
                        }
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {!participant.isVideoOn && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={participant.avatar} />
                          <AvatarFallback>
                            {participant.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white px-3 py-1 rounded text-sm flex items-center gap-2">
                      {participant.isMuted && <MicOff className="h-3 w-3" />}
                      <span>{participant.name}</span>
                    </div>
                  </div>
                ))}

              {/* Show placeholder if no remote participants yet */}
              {call && call.participants.filter((p: any) => p.userId !== user?.id).length === 0 && (
                <div className="col-span-full flex items-center justify-center text-white/50">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Waiting for participants to join...</p>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>

          {/* Sidebar: Chat or Participants */}
          {(showChat || showParticipants) && (
            <div className="w-80 flex-shrink-0 border rounded-lg overflow-hidden bg-card">
              {showChat && (
                <CallChatPanel callId={callId} open={showChat} onClose={() => setShowChat(false)} />
              )}
              {showParticipants && !showChat && (
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Participants ({call?.participants.length || 0})
                    </h3>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {call?.participants.map((participant) => {
                        const isCurrentUser = participant.userId === user?.id
                        return (
                          <div
                            key={participant.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg",
                              isCurrentUser && "bg-primary/10"
                            )}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={participant.avatar} />
                              <AvatarFallback>
                                {participant.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {isCurrentUser ? 'You' : participant.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {participant.role === 'HOST' && (
                                  <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
                                    Host
                                  </span>
                                )}
                                {participant.isMuted && (
                                  <MicOff className="h-3 w-3 text-muted-foreground" />
                                )}
                                {!participant.isVideoOn && (
                                  <VideoOff className="h-3 w-3 text-muted-foreground" />
                                )}
                                {participant.isScreenSharing && (
                                  <Monitor className="h-3 w-3 text-primary" />
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Local Video (Small Picture-in-Picture) */}
        {isActive && localStream && (
          <div className={cn(
            "absolute bottom-24 bg-gray-900 rounded-lg overflow-hidden border-2 border-white shadow-lg z-30 w-48 h-36",
            (showChat || showParticipants) ? "right-[22rem]" : "right-6"
          )}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isVideoOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
              </div>
            )}
            <div className="absolute bottom-1 left-1 bg-black/60 text-white px-2 py-0.5 rounded text-xs">
              {isMuted && <MicOff className="h-3 w-3 inline mr-1" />}
              You
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="px-6 pb-6 border-t pt-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isMuted ? 'destructive' : 'outline'}
              size="icon"
              onClick={toggleMute}
              disabled={!isActive || isConnecting}
              className="h-12 w-12 rounded-full"
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            <Button
              variant={isVideoOn ? 'outline' : 'destructive'}
              size="icon"
              onClick={toggleVideo}
              disabled={!isActive || isConnecting}
              className="h-12 w-12 rounded-full"
            >
              {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>

            <Button
              variant={isScreenSharing ? 'default' : 'outline'}
              size="icon"
              onClick={toggleScreenShare}
              disabled={!isActive || isConnecting}
              className={cn(
                "h-12 w-12 rounded-full",
                isScreenSharing && "bg-primary text-primary-foreground"
              )}
              title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
            >
              <Monitor className="h-5 w-5" />
            </Button>

            <Button
              variant={isRecording ? 'destructive' : 'outline'}
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!isActive || isConnecting}
              className={cn(
                "h-12 w-12 rounded-full",
                isRecording && "bg-destructive text-destructive-foreground"
              )}
              title={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? (
                <Square className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5 fill-current" />
              )}
            </Button>

            <Button
              variant="destructive"
              size="icon"
              onClick={handleClose}
              className="h-12 w-12 rounded-full"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
