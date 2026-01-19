'use client'

/**
 * UsefulLinksWidget
 * 
 * Reusable widget for managing and displaying useful links across all dashboards.
 * Supports role-based access and dashboard-specific storage keys.
 * 
 * Features:
 * - Add/remove links
 * - Dashboard-specific storage (localStorage)
 * - Role-based visibility
 * - Fullscreen support
 * - Accessible design
 */

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link as LinkIcon, Plus, X, Maximize, Minimize } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UsefulLink } from '@/types/widgets'

export interface UsefulLinksWidgetProps {
  /** Unique storage key for this dashboard (e.g., 'sales-useful-links', 'it-useful-links') */
  storageKey: string
  /** Widget ID for fullscreen functionality */
  widgetId?: string
  /** Whether widget is in fullscreen mode */
  fullscreen?: boolean
  /** Callback when fullscreen is toggled */
  onToggleFullscreen?: (widgetId: string) => void
  /** Optional role restrictions - links will only show if user has one of these roles */
  allowedRoles?: string[]
  /** Optional permission check - links will only show if user has this permission */
  requiredPermission?: { resource: string; action: string }
  /** Custom title */
  title?: string
  /** Custom description */
  description?: string
  /** Optional default links to show */
  defaultLinks?: UsefulLink[]
  /** Callback when links change */
  onLinksChange?: (links: UsefulLink[]) => void
  /** Optional CSS class */
  className?: string
}

export function UsefulLinksWidget({
  storageKey,
  widgetId = 'usefulLinks',
  fullscreen = false,
  onToggleFullscreen,
  allowedRoles,
  requiredPermission,
  title = 'Useful Links',
  description = 'Your frequently visited links',
  defaultLinks = [],
  onLinksChange,
  className,
}: UsefulLinksWidgetProps) {
  const user = useAuthStore((state) => state.user)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const [links, setLinks] = useState<UsefulLink[]>(defaultLinks)
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')

  // Check role-based access
  const hasAccess = () => {
    if (!user) return false
    
    // Check role restrictions
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        return false
      }
    }
    
    // Check permission requirements
    if (requiredPermission) {
      if (!hasPermission(requiredPermission.resource, requiredPermission.action)) {
        return false
      }
    }
    
    return true
  }

  // Load links from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          setLinks(Array.isArray(parsed) ? parsed : [])
        } else if (defaultLinks.length > 0) {
          setLinks(defaultLinks)
        }
      } catch (error) {
        console.error('Error loading useful links:', error)
        if (defaultLinks.length > 0) {
          setLinks(defaultLinks)
        }
      }
    }
  }, [storageKey, defaultLinks])

  // Save links to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && links.length >= 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(links))
        onLinksChange?.(links)
      } catch (error) {
        console.error('Error saving useful links:', error)
      }
    }
  }, [links, storageKey, onLinksChange])

  const handleAddLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return

    const url = newLinkUrl.startsWith('http') 
      ? newLinkUrl 
      : `https://${newLinkUrl}`

    const newLink: UsefulLink = {
      id: Date.now().toString(),
      title: newLinkTitle.trim(),
      url,
    }

    setLinks((prev) => [...prev, newLink])
    setNewLinkTitle('')
    setNewLinkUrl('')
  }

  const handleRemoveLink = (linkId: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== linkId))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddLink()
    }
  }

  if (!hasAccess()) {
    return null
  }

  return (
    <Card
      className={cn(
        "h-full flex flex-col overflow-hidden",
        fullscreen && "fixed inset-0 z-[9999] m-0 rounded-none",
        className
      )}
      style={
        fullscreen
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              margin: 0,
              borderRadius: 0,
            }
          : undefined
      }
    >
      <CardHeader className="pb-3 sticky top-0 z-10 bg-card border-b">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <LinkIcon className="h-4 w-4" aria-hidden="true" />
              {title}
            </CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          {onToggleFullscreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleFullscreen(widgetId)}
              title={fullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              className="h-7 w-7 p-0"
              aria-label={fullscreen ? "Exit fullscreen mode" : "Enter fullscreen mode"}
            >
              {fullscreen ? (
                <Minimize className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Maximize className="h-3 w-3" aria-hidden="true" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 pt-4">
        {/* Add Link Form */}
        <div className="space-y-2" role="form" aria-label="Add new link">
          <Input
            placeholder="Link title..."
            value={newLinkTitle}
            onChange={(e) => setNewLinkTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            className="h-8 text-xs"
            aria-label="Link title"
          />
          <div className="flex gap-2">
            <Input
              placeholder="https://..."
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-8 text-xs flex-1"
              aria-label="Link URL"
            />
            <Button
              size="sm"
              className="h-8"
              onClick={handleAddLink}
              disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}
              aria-label="Add link"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Links List */}
        <div className="flex-1 overflow-auto space-y-2" role="list" aria-label="Useful links">
          {links.length > 0 ? (
            links.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-2 p-2 border rounded-lg hover:bg-accent cursor-pointer transition-colors group"
                role="listitem"
              >
                <LinkIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm hover:underline"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Open ${link.title} in new tab`}
                >
                  <div className="font-medium truncate">{link.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{link.url}</div>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  onClick={() => handleRemoveLink(link.id)}
                  aria-label={`Remove ${link.title}`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </Button>
              </div>
            ))
          ) : (
            <div
              className="flex flex-col items-center justify-center h-full text-center py-8"
              role="status"
              aria-live="polite"
            >
              <LinkIcon className="h-12 w-12 text-muted-foreground/50 mb-3" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">No links saved yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add your frequently visited links above
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
