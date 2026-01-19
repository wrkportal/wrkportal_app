/**
 * Participant List Component
 * Displays list of participants in a call
 */

'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Mic, MicOff, Video, VideoOff, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Participant {
  id: string
  userId: string
  name: string
  avatar?: string
  isMuted: boolean
  isVideoOn: boolean
  role: 'HOST' | 'PARTICIPANT' | 'MODERATOR'
}

interface ParticipantListProps {
  participants: Participant[]
  className?: string
}

export function ParticipantList({ participants, className }: ParticipantListProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {participants.map((participant) => (
        <div
          key={participant.id}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={participant.avatar} />
            <AvatarFallback>
              {participant.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{participant.name}</span>
              {participant.role === 'HOST' && (
                <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {participant.isMuted ? (
                <MicOff className="h-3 w-3" />
              ) : (
                <Mic className="h-3 w-3" />
              )}
              {participant.isVideoOn ? (
                <Video className="h-3 w-3" />
              ) : (
                <VideoOff className="h-3 w-3" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
