'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  FolderKanban, UserPlus, Target, Brain, Clock,
  CheckCircle2, Circle, X, ChevronRight, Trophy
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface ChecklistItem {
  id: string
  label: string
  description: string
  href: string
  icon: React.ReactNode
}

const checklistItems: ChecklistItem[] = [
  {
    id: 'create-project',
    label: 'Create your first project',
    description: 'Set up a project to organize your work',
    href: '/projects/new',
    icon: <FolderKanban className="h-4 w-4" />,
  },
  {
    id: 'invite-member',
    label: 'Invite a team member',
    description: 'Collaboration starts with your team',
    href: '/admin/organization',
    icon: <UserPlus className="h-4 w-4" />,
  },
  {
    id: 'create-okr',
    label: 'Set up an OKR',
    description: 'Align your team with clear objectives',
    href: '/okrs',
    icon: <Target className="h-4 w-4" />,
  },
  {
    id: 'try-ai',
    label: 'Explore AI Assistant',
    description: 'Ask AI to analyze your data or generate reports',
    href: '/ai-assistant',
    icon: <Brain className="h-4 w-4" />,
  },
  {
    id: 'log-time',
    label: 'Log your first timesheet',
    description: 'Track time for accurate reporting',
    href: '/timesheets',
    icon: <Clock className="h-4 w-4" />,
  },
]

const STORAGE_KEY = 'wrkportal_quickwins'
const DISMISSED_KEY = 'wrkportal_quickwins_dismissed'

export function QuickWinsChecklist() {
  const router = useRouter()
  const [completed, setCompleted] = React.useState<string[]>([])
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setCompleted(JSON.parse(stored))
    setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true')
  }, [])

  const toggleItem = (id: string) => {
    const next = completed.includes(id)
      ? completed.filter((c) => c !== id)
      : [...completed, id]
    setCompleted(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem(DISMISSED_KEY, 'true')
  }

  if (dismissed) return null

  const progress = Math.round((completed.length / checklistItems.length) * 100)
  const allDone = completed.length === checklistItems.length

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">
              {allDone ? 'All done! Great start!' : 'Quick Wins'}
            </CardTitle>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-xs font-medium text-muted-foreground">
            {completed.length}/{checklistItems.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {checklistItems.map((item) => {
          const isDone = completed.includes(item.id)
          return (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-lg transition-colors group',
                isDone ? 'opacity-60' : 'hover:bg-accent/50 cursor-pointer'
              )}
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="shrink-0"
              >
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </button>
              <div className="flex-1 min-w-0" onClick={() => !isDone && router.push(item.href)}>
                <p className={cn('text-sm font-medium', isDone && 'line-through')}>
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
              </div>
              {!isDone && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => router.push(item.href)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
