'use client'

import * as React from 'react'
import { Clock } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

interface RecentItem {
  href: string
  label: string
  visitedAt: number
}

const STORAGE_KEY = 'wrkportal_recents'
const MAX_RECENTS = 5

// Map pathnames to readable labels
function pathToLabel(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return 'Home'
  const labels: Record<string, string> = {
    'wrkboard': 'Dashboard',
    'projects': 'Projects',
    'okrs': 'OKRs',
    'sprints': 'Sprints',
    'backlog': 'Backlog',
    'teams': 'Teams',
    'timesheets': 'Timesheets',
    'reports': 'Reports',
    'collaborate': 'Collaborate',
    'ai-assistant': 'AI Assistant',
    'ai-tools': 'AI Tools',
    'automations': 'Automations',
    'notifications': 'Notifications',
    'settings': 'Settings',
    'profile': 'Profile',
    'admin': 'Admin',
    'search': 'Search',
    'finance-dashboard': 'Finance',
    'sales-dashboard': 'Sales',
    'operations-dashboard': 'Operations',
    'it-dashboard': 'IT Services',
    'customer-service-dashboard': 'Customer Service',
    'developer-dashboard': 'Developer',
    'recruitment-dashboard': 'Recruitment',
    'my-work': 'My Work',
    'wiki': 'Wiki',
    'integrations': 'Integrations',
  }
  const first = segments[0]
  const base = labels[first] || first.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  if (segments.length > 1 && segments[1] !== 'dashboard') {
    return `${base} / ${segments[segments.length - 1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`
  }
  return base
}

// Skip these paths from recents
const SKIP_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/landing', '/', '/terms', '/privacy', '/security']

export function useSidebarRecents() {
  const pathname = usePathname()

  React.useEffect(() => {
    if (!pathname || SKIP_PATHS.includes(pathname)) return

    const stored = localStorage.getItem(STORAGE_KEY)
    const recents: RecentItem[] = stored ? JSON.parse(stored) : []

    // Remove existing entry for this path
    const filtered = recents.filter((r) => r.href !== pathname)

    // Add to front
    const updated = [
      { href: pathname, label: pathToLabel(pathname), visitedAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_RECENTS)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }, [pathname])
}

export function SidebarRecents() {
  const [recents, setRecents] = React.useState<RecentItem[]>([])
  const router = useRouter()

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setRecents(JSON.parse(stored))
  }, [])

  // Refresh on storage changes (when navigating)
  React.useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setRecents(JSON.parse(stored))
    }
    window.addEventListener('storage', handleStorage)
    const interval = setInterval(handleStorage, 5000)
    return () => {
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [])

  if (recents.length === 0) return null

  return (
    <div className="px-3 py-2">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
        Recent
      </p>
      <div className="space-y-0.5">
        {recents.map((item) => (
          <div
            key={item.href}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 cursor-pointer text-sm transition-colors"
            onClick={() => router.push(item.href)}
          >
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate flex-1 text-foreground/80">{item.label}</span>
            <span className="text-[10px] text-muted-foreground/60 shrink-0">
              {formatDistanceToNow(item.visitedAt, { addSuffix: false })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
