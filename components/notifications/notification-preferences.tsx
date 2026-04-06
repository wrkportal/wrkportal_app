'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Bell, BellOff, Mail, Clock, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationCategory {
  id: string
  label: string
  inApp: boolean
  email: boolean
}

const defaultCategories: NotificationCategory[] = [
  { id: 'tasks', label: 'Task assignments & updates', inApp: true, email: true },
  { id: 'projects', label: 'Project status changes', inApp: true, email: false },
  { id: 'approvals', label: 'Approval requests', inApp: true, email: true },
  { id: 'mentions', label: 'Mentions & comments', inApp: true, email: true },
  { id: 'sales', label: 'Sales pipeline updates', inApp: true, email: false },
  { id: 'finance', label: 'Budget alerts', inApp: true, email: true },
  { id: 'hr', label: 'Recruitment updates', inApp: true, email: false },
  { id: 'it', label: 'IT ticket updates', inApp: true, email: false },
  { id: 'system', label: 'System announcements', inApp: true, email: false },
]

export function NotificationPreferences() {
  const [categories, setCategories] = React.useState(defaultCategories)
  const [dndEnabled, setDndEnabled] = React.useState(false)
  const [dndFrom, setDndFrom] = React.useState('22:00')
  const [dndTo, setDndTo] = React.useState('08:00')
  const [digestMode, setDigestMode] = React.useState(false)

  const toggleChannel = (catId: string, channel: 'inApp' | 'email') => {
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, [channel]: !c[channel] } : c))
    )
  }

  return (
    <div className="space-y-6">
      {/* DND & Digest */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BellOff className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">Do Not Disturb</Label>
              </div>
              <button
                onClick={() => setDndEnabled(!dndEnabled)}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                  dndEnabled ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span className={cn(
                  'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                  dndEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                )} />
              </button>
            </div>
            {dndEnabled && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="time"
                  value={dndFrom}
                  onChange={(e) => setDndFrom(e.target.value)}
                  className="h-7 rounded border bg-background px-2 text-xs"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="time"
                  value={dndTo}
                  onChange={(e) => setDndTo(e.target.value)}
                  className="h-7 rounded border bg-background px-2 text-xs"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Silence notifications during these hours. You'll get a summary after.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">Daily Digest</Label>
              </div>
              <button
                onClick={() => setDigestMode(!digestMode)}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                  digestMode ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span className={cn(
                  'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                  digestMode ? 'translate-x-4.5' : 'translate-x-0.5'
                )} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {digestMode
                ? 'You\'ll receive a single daily email at 8 AM with all notifications.'
                : 'Turn on to batch notifications into a daily email digest.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-category preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notification Channels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {/* Header */}
            <div className="flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground font-medium">
              <span className="flex-1">Category</span>
              <span className="w-16 text-center">In-App</span>
              <span className="w-16 text-center">Email</span>
            </div>

            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/30">
                <span className="flex-1 text-sm">{cat.label}</span>
                <div className="w-16 flex justify-center">
                  <button
                    onClick={() => toggleChannel(cat.id, 'inApp')}
                    className={cn(
                      'w-8 h-4.5 rounded-full transition-colors relative',
                      cat.inApp ? 'bg-primary' : 'bg-muted'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-transform',
                      cat.inApp ? 'left-4' : 'left-0.5'
                    )} />
                  </button>
                </div>
                <div className="w-16 flex justify-center">
                  <button
                    onClick={() => toggleChannel(cat.id, 'email')}
                    className={cn(
                      'w-8 h-4.5 rounded-full transition-colors relative',
                      cat.email ? 'bg-primary' : 'bg-muted'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-transform',
                      cat.email ? 'left-4' : 'left-0.5'
                    )} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-4">
            <Button size="sm">
              <Save className="h-4 w-4 mr-1" />
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
