/**
 * Join Call Button Component
 * Button to join an existing call
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Phone } from 'lucide-react'
import { CallInterface } from './call-interface'

interface JoinCallButtonProps {
  callId: string
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  disabled?: boolean
}

export function JoinCallButton({
  callId,
  variant = 'default',
  size = 'default',
  className,
  disabled = false,
}: JoinCallButtonProps) {
  const [callOpen, setCallOpen] = useState(false)

  const handleJoin = () => {
    setCallOpen(true)
  }

  const handleClose = () => {
    setCallOpen(false)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleJoin}
        className={className}
        disabled={disabled || !callId}
      >
        <Phone className="h-4 w-4 mr-2" />
        Join Call
      </Button>

      <CallInterface
        callId={callId}
        open={callOpen}
        onClose={handleClose}
      />
    </>
  )
}
