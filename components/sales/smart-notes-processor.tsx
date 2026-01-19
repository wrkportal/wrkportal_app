'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SmartNoteResult {
  summary: string
  keyTakeaways: string[]
  actionItems: {
    action: string
    assignedTo?: string
    dueDate?: string
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    relatedTo?: string
  }[]
  decisions: {
    decision: string
    rationale?: string
    stakeholders?: string[]
  }[]
  concerns: {
    concern: string
    severity: 'HIGH' | 'MEDIUM' | 'LOW'
    recommendedAction?: string
  }[]
  nextSteps: string[]
  tags: string[]
}

interface SmartNotesProcessorProps {
  noteContent: string
  context?: {
    type?: 'MEETING' | 'CALL' | 'EMAIL' | 'GENERAL'
    relatedToId?: string
    relatedToType?: 'OPPORTUNITY' | 'ACCOUNT' | 'CONTACT'
  }
  onProcessed?: (result: SmartNoteResult) => void
  disabled?: boolean
}

export function SmartNotesProcessor({ 
  noteContent, 
  context, 
  onProcessed,
  disabled = false 
}: SmartNotesProcessorProps) {
  const [processing, setProcessing] = useState(false)
  const [processed, setProcessed] = useState(false)
  const { toast } = useToast()

  const handleProcess = async () => {
    if (!noteContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter note content first',
        variant: 'destructive',
      })
      return
    }

    setProcessing(true)
    setProcessed(false)
    try {
      const response = await fetch('/api/ai/sales/notes/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteContent,
          context,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setProcessed(true)
        onProcessed?.(result)
        toast({
          title: 'Success',
          description: 'Note processed successfully',
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to process note',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process note',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  if (disabled) return null

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleProcess}
      disabled={processing || !noteContent.trim()}
      className="gap-2"
    >
      {processing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : processed ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          Processed
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Process with AI
        </>
      )}
    </Button>
  )
}

