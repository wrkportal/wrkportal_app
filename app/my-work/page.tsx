'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SkeletonList } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/empty-state'
import {
  CheckCircle2, Clock, AlertTriangle, Calendar, ListTodo,
  FolderKanban, ChevronRight, Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, isToday, isPast, isThisWeek, isFuture } from 'date-fns'

interface WorkItem {
  id: string
  title: string
  type: 'task' | 'review' | 'approval'
  project: string
  dueDate: string
  status: string
  priority: 'critical' | 'high' | 'medium' | 'low'
}

const priorityColors: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  low: 'bg-green-500/10 text-green-500 border-green-500/20',
}

const typeIcons: Record<string, React.ReactNode> = {
  task: <ListTodo className="h-4 w-4" />,
  review: <CheckCircle2 className="h-4 w-4" />,
  approval: <Clock className="h-4 w-4" />,
}

function WorkItemRow({ item }: { item: WorkItem }) {
  const due = new Date(item.dueDate)
  const isOverdue = isPast(due) && item.status !== 'DONE'

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/30 transition-colors cursor-pointer group">
      <div className="text-muted-foreground">{typeIcons[item.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <FolderKanban className="h-3 w-3" />
            {item.project}
          </span>
        </div>
      </div>
      <Badge variant="outline" className={cn('text-xs', priorityColors[item.priority])}>
        {item.priority}
      </Badge>
      <span className={cn(
        'text-xs whitespace-nowrap',
        isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'
      )}>
        {isOverdue && <AlertTriangle className="h-3 w-3 inline mr-1" />}
        {format(due, 'MMM d')}
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}

export default function MyWorkPage() {
  const [items, setItems] = React.useState<WorkItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState('all')

  React.useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch('/api/tasks?assignee=me&limit=50')
        if (res.ok) {
          const data = await res.json()
          setItems(data.tasks || [])
        }
      } catch {
        // Fall through to empty state
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">My Work</h1>
        <SkeletonList items={8} />
      </div>
    )
  }

  const filteredItems = activeTab === 'all' ? items : items.filter((i) => i.type === activeTab)

  const overdue = filteredItems.filter((i) => isPast(new Date(i.dueDate)) && i.status !== 'DONE')
  const dueToday = filteredItems.filter((i) => isToday(new Date(i.dueDate)))
  const thisWeek = filteredItems.filter((i) => isThisWeek(new Date(i.dueDate)) && !isToday(new Date(i.dueDate)) && !isPast(new Date(i.dueDate)))
  const upcoming = filteredItems.filter((i) => isFuture(new Date(i.dueDate)) && !isThisWeek(new Date(i.dueDate)))

  const sections = [
    { title: 'Overdue', items: overdue, icon: <AlertTriangle className="h-4 w-4 text-red-500" /> },
    { title: 'Due Today', items: dueToday, icon: <Calendar className="h-4 w-4 text-orange-500" /> },
    { title: 'This Week', items: thisWeek, icon: <Clock className="h-4 w-4 text-blue-500" /> },
    { title: 'Upcoming', items: upcoming, icon: <Calendar className="h-4 w-4 text-muted-foreground" /> },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Work</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ListTodo className="h-4 w-4" />
          {filteredItems.length} items
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="task">Tasks</TabsTrigger>
          <TabsTrigger value="review">Reviews</TabsTrigger>
          <TabsTrigger value="approval">Approvals</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-12 w-12" />}
          title="You're all caught up!"
          description="No tasks, reviews, or approvals assigned to you right now. Enjoy the calm."
          tip="Items assigned to you across all modules will appear here automatically"
        />
      ) : (
        <div className="space-y-6">
          {sections.map((section) => {
            if (section.items.length === 0) return null
            return (
              <div key={section.title}>
                <div className="flex items-center gap-2 mb-3">
                  {section.icon}
                  <h2 className="text-sm font-semibold">{section.title}</h2>
                  <Badge variant="secondary" className="text-xs">{section.items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <WorkItemRow key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
