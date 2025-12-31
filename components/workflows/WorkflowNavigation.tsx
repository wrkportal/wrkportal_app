'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
}

interface WorkflowNavigationProps {
  items: NavItem[]
  workflowName?: string
  greeting?: string
}

export function WorkflowNavigation({ items, workflowName, greeting }: WorkflowNavigationProps) {
  const pathname = usePathname()

  // Safety check: ensure items is an array
  if (!items || !Array.isArray(items)) {
    console.error('WorkflowNavigation: items prop is required and must be an array', { items })
    return null
  }

  return (
    <header className="sticky top-16 z-10 border-b border-border bg-background/80 backdrop-blur px-4 lg:px-8 py-3 flex items-center gap-6 flex-wrap">
      {workflowName && greeting && (
        <div className="flex flex-col gap-1 mr-auto">
          <div className="text-xs text-muted-foreground">{greeting}</div>
          <div className="text-base font-semibold tracking-tight">{workflowName}</div>
        </div>
      )}
      <nav className="flex items-center gap-4 text-sm overflow-x-auto pb-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-1.5 rounded-xl whitespace-nowrap border transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted text-muted-foreground border-border"
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
