/**
 * Start Call Button Component
 * Button to initiate a new call
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Phone } from 'lucide-react'
import { CallInterface } from './call-interface'
import { useCall } from '@/hooks/useCall'
import { useToast } from '@/hooks/use-toast'

interface StartCallButtonProps {
  participantIds?: string[]
  title?: string
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function StartCallButton({
  participantIds,
  title,
  variant = 'default',
  size = 'default',
  className,
}: StartCallButtonProps) {
  const [callOpen, setCallOpen] = useState(false)
  const [callId, setCallId] = useState<string | null>(null)
  const { startCall } = useCall()
  const { toast } = useToast()

  const handleStartCall = async () => {
    try {
      const id = await startCall(participantIds, title)
      setCallId(id)
      setCallOpen(true)
    } catch (error: any) {
      toast({
        title: 'Failed to start call',
        description: error.message || 'Please check your camera and microphone permissions.',
        variant: 'destructive',
      })
    }
  }

  const handleClose = () => {
    setCallOpen(false)
    setCallId(null)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleStartCall}
        className={className}
        title={size === 'icon' ? 'Start Call' : undefined}
      >
        {size === 'icon' ? (
          <Phone className="h-3.5 w-3.5" />
        ) : (
          <>
            <Phone className="h-4 w-4 mr-2" />
            Start Call
          </>
        )}
      </Button>

      <CallInterface
        callId={callId}
        open={callOpen}
        onClose={handleClose}
      />
    </>
  )
}
