/**
 * Calls Page - Demo/Test page for call functionality
 * Accessible at /calls
 */

'use client'

import { useState } from 'react'
import { StartCallButton, JoinCallButton, ScheduleCallDialog } from '@/components/calls'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Phone, Users, Calendar, Video } from 'lucide-react'
import { useCall } from '@/hooks/useCall'

export default function CallsPage() {
  const [callId, setCallId] = useState('')
  const [participantIds, setParticipantIds] = useState('')
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const { startCall } = useCall()

  const handleSchedule = async (data: {
    title: string
    description?: string
    participantIds: string[]
    scheduledAt?: Date
  }) => {
    try {
      // Create scheduled call
      const requestBody: any = {
        type: data.participantIds.length > 1 ? 'GROUP' : 'ONE_ON_ONE',
        title: data.title,
        participantIds: data.participantIds,
      }

      if (data.description) {
        requestBody.description = data.description
      }

      if (data.scheduledAt) {
        requestBody.scheduledAt = data.scheduledAt.toISOString()
      }

      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = errorData.error || errorData.details?.[0]?.message || 'Failed to schedule call'
        throw new Error(errorMessage)
      }

      const result = await response.json()
      return result
    } catch (error: any) {
      console.error('Error scheduling call:', error)
      throw error
    }
  }

  const handleStartNow = async (data: {
    title: string
    description?: string
    participantIds: string[]
  }) => {
    await startCall(data.participantIds, data.title)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calls & Meetings</h1>
          <p className="text-muted-foreground mt-2">
            Start or join video/audio calls with your team
          </p>
        </div>
        <Button onClick={() => setScheduleDialogOpen(true)}>
          <Calendar className="h-4 w-4 mr-2" />
          New Meeting
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Start New Call */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Start New Call
            </CardTitle>
            <CardDescription>
              Initiate a new video/audio call with team members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="participants">Participant IDs (comma-separated)</Label>
              <Input
                id="participants"
                placeholder="user-id-1, user-id-2"
                value={participantIds}
                onChange={(e) => setParticipantIds(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for one-on-one call, or enter user IDs separated by commas
              </p>
            </div>
            <StartCallButton
              participantIds={participantIds ? participantIds.split(',').map(id => id.trim()).filter(Boolean) : undefined}
              title="Team Call"
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Join Existing Call */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Join Call
            </CardTitle>
            <CardDescription>
              Join an existing call using the call ID
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="callId">Call ID</Label>
              <Input
                id="callId"
                placeholder="Enter call ID"
                value={callId}
                onChange={(e) => setCallId(e.target.value)}
              />
            </div>
            <JoinCallButton
              callId={callId}
              className="w-full"
              disabled={!callId}
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common call scenarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <StartCallButton
            title="Quick Call"
            variant="outline"
            className="w-full justify-start"
          />
          <p className="text-xs text-muted-foreground">
            Start a call without specifying participants (you can add them later)
          </p>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <strong>Starting a Call:</strong>
            <ul className="list-disc list-inside ml-2 mt-1 space-y-1 text-muted-foreground">
              <li>Click "Start New Call" to initiate a video/audio call</li>
              <li>Grant camera and microphone permissions when prompted</li>
              <li>Add participants by entering their user IDs</li>
              <li>Use the controls to mute/unmute, toggle video, or share screen</li>
            </ul>
          </div>
          <div className="mt-4">
            <strong>Joining a Call:</strong>
            <ul className="list-disc list-inside ml-2 mt-1 space-y-1 text-muted-foreground">
              <li>Get the call ID from the call organizer</li>
              <li>Enter the call ID and click "Join Call"</li>
              <li>Grant camera and microphone permissions</li>
            </ul>
          </div>
          <div className="mt-4">
            <strong>Note:</strong>
            <p className="text-muted-foreground mt-1">
              The call interface will open in a dialog. You can see all participants, 
              control your audio/video, and manage the call from there.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Call Dialog */}
      <ScheduleCallDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        onSchedule={handleSchedule}
        onStartNow={handleStartNow}
      />
    </div>
  )
}
