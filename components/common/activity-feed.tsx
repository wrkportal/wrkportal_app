'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Edit, MessageSquare, ArrowRight, UserPlus, Plus, Clock,
  CheckCircle2, AlertTriangle, Tag, Paperclip
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'created' | 'updated' | 'commented' | 'status_changed' | 'assigned' | 'completed' | 'tagged' | 'attached'
  user: { name: string; avatar?: string; initials: string }
  description: string
  timestamp: string
  metadata?: Record<string, string>
}

const typeIcons: Record<string, React.ReactNode> = {
  created: <Plus className="h-3.5 w-3.5" />,
  updated: <Edit className="h-3.5 w-3.5" />,
  commented: <MessageSquare className="h-3.5 w-3.5" />,
  status_changed: <ArrowRight className="h-3.5 w-3.5" />,
  assigned: <UserPlus className="h-3.5 w-3.5" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5" />,
  tagged: <Tag className="h-3.5 w-3.5" />,
  attached: <Paperclip className="h-3.5 w-3.5" />,
}

const typeColors: Record<string, string> = {
  created: 'bg-blue-500/10 text-blue-500',
  updated: 'bg-orange-500/10 text-orange-500',
  commented: 'bg-purple-500/10 text-purple-500',
  status_changed: 'bg-yellow-500/10 text-yellow-500',
  assigned: 'bg-green-500/10 text-green-500',
  completed: 'bg-emerald-500/10 text-emerald-500',
  tagged: 'bg-pink-500/10 text-pink-500',
  attached: 'bg-gray-500/10 text-gray-500',
}

interface ActivityFeedProps {
  entityType: string
  entityId: string
  className?: string
}

export function ActivityFeed({ entityType, entityId, className }: ActivityFeedProps) {
  const [activities, setActivities] = React.useState<ActivityItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [hasMore, setHasMore] = React.useState(false)

  React.useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch(`/api/activity?type=${entityType}&id=${entityId}&limit=20`)
        if (res.ok) {
          const data = await res.json()
          setActivities(data.activities || [])
          setHasMore(data.hasMore || false)
        }
      } catch {
        // Empty state
      } finally {
        setLoading(false)
      }
    }
    fetchActivities()
  }, [entityType, entityId])

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-48 bg-muted rounded" />
              <div className="h-2 w-24 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No activity yet</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      {activities.map((activity, i) => (
        <div key={activity.id} className="flex gap-3 py-2.5 relative">
          {/* Timeline line */}
          {i < activities.length - 1 && (
            <div className="absolute left-[15px] top-10 bottom-0 w-px bg-border" />
          )}

          {/* Avatar */}
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium z-10',
            typeColors[activity.type]
          )}>
            {typeIcons[activity.type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">{activity.user.name}</span>{' '}
              <span className="text-muted-foreground">{activity.description}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="pt-2">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            Load more activity
          </Button>
        </div>
      )}
    </div>
  )
}
