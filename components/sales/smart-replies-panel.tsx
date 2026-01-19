'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Copy, RefreshCw, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface SmartRepliesPanelProps {
  subject: string
  body: string
  from: string
  to: string
  threadHistory?: Array<{
    from: string
    to: string
    subject: string
    body: string
    date: Date
  }>
  opportunityId?: string
  leadId?: string
  accountId?: string
  onSelectReply?: (reply: string) => void
}

interface SmartReply {
  id: string
  text: string
  tone: 'PROFESSIONAL' | 'FRIENDLY' | 'FORMAL' | 'CASUAL'
  length: 'SHORT' | 'MEDIUM' | 'LONG'
  suggested: boolean
}

export function SmartRepliesPanel({
  subject,
  body,
  from,
  to,
  threadHistory,
  opportunityId,
  leadId,
  accountId,
  onSelectReply,
}: SmartRepliesPanelProps) {
  const { toast } = useToast()
  const [replies, setReplies] = useState<SmartReply[]>([])
  const [loading, setLoading] = useState(false)
  const [tone, setTone] = useState<'PROFESSIONAL' | 'FRIENDLY' | 'FORMAL' | 'CASUAL'>('PROFESSIONAL')
  const [length, setLength] = useState<'SHORT' | 'MEDIUM' | 'LONG'>('MEDIUM')

  const generateReplies = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({
        title: 'Error',
        description: 'Subject and body are required to generate replies',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/sales/smart-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          body,
          from,
          to,
          threadHistory,
          opportunityId,
          leadId,
          accountId,
          tone,
          length,
          count: 5,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setReplies(data.replies || [])
      } else {
        throw new Error('Failed to generate replies')
      }
    } catch (error) {
      console.error('Error generating smart replies:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate smart replies',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectReply = (reply: SmartReply) => {
    if (onSelectReply) {
      onSelectReply(reply.text)
    } else {
      // Copy to clipboard as fallback
      navigator.clipboard.writeText(reply.text)
      toast({
        title: 'Copied',
        description: 'Reply copied to clipboard',
      })
    }
  }

  const handleCopyReply = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Reply copied to clipboard',
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Smart Replies
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={generateReplies}
            disabled={loading || !subject.trim() || !body.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tone</Label>
            <Select value={tone} onValueChange={(v: any) => setTone(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                <SelectItem value="FRIENDLY">Friendly</SelectItem>
                <SelectItem value="FORMAL">Formal</SelectItem>
                <SelectItem value="CASUAL">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Length</Label>
            <Select value={length} onValueChange={(v: any) => setLength(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SHORT">Short</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LONG">Long</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {replies.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Click "Generate" to get AI-powered reply suggestions</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Generating replies...</p>
          </div>
        )}

        {replies.length > 0 && (
          <div className="space-y-3">
            {replies.map((reply) => (
              <Card
                key={reply.id}
                className={cn(
                  'cursor-pointer hover:bg-muted transition-colors',
                  reply.suggested && 'border-primary'
                )}
                onClick={() => handleSelectReply(reply)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex gap-2">
                      {reply.suggested && (
                        <Badge variant="default" className="text-xs">Suggested</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">{reply.tone}</Badge>
                      <Badge variant="outline" className="text-xs">{reply.length}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyReply(reply.text)
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{reply.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

