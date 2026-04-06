'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/common/empty-state'
import {
  BookOpen, Plus, Search, ChevronRight, ChevronDown,
  FileText, FolderOpen, Clock, Edit, Trash2, MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WikiPage {
  id: string
  title: string
  content: string
  children: WikiPage[]
  updatedAt: string
  updatedBy: string
  icon?: string
}

function TreeItem({
  page,
  level = 0,
  selectedId,
  onSelect,
}: {
  page: WikiPage
  level?: number
  selectedId: string | null
  onSelect: (page: WikiPage) => void
}) {
  const [expanded, setExpanded] = React.useState(level === 0)
  const hasChildren = page.children.length > 0

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors',
          selectedId === page.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(page)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="shrink-0"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-3.5" />
        )}
        {hasChildren ? (
          <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <span className="truncate">{page.title}</span>
      </div>
      {expanded && hasChildren && (
        <div>
          {page.children.map((child) => (
            <TreeItem
              key={child.id}
              page={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function WikiPage() {
  const [pages, setPages] = React.useState<WikiPage[]>([])
  const [selectedPage, setSelectedPage] = React.useState<WikiPage | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // Fetch wiki pages from API
    const fetchPages = async () => {
      try {
        const res = await fetch('/api/wiki')
        if (res.ok) {
          const data = await res.json()
          setPages(data.pages || [])
        }
      } catch {
        // Empty state
      } finally {
        setLoading(false)
      }
    }
    fetchPages()
  }, [])

  if (!loading && pages.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Knowledge Base
          </h1>
        </div>
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="No wiki pages yet"
          description="Create a knowledge base for your team. Add docs for processes, onboarding guides, runbooks, and more."
          actionLabel="Create First Page"
          template="Team Onboarding Guide"
          tip="Organize pages in a hierarchy — drag to nest pages under parent topics"
        />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Panel - Page Tree */}
      <div className="w-72 border-r flex flex-col">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Pages</h2>
            <Button size="sm" variant="ghost">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {pages.map((page) => (
            <TreeItem
              key={page.id}
              page={page}
              selectedId={selectedPage?.id || null}
              onSelect={setSelectedPage}
            />
          ))}
        </div>
      </div>

      {/* Right Panel - Page Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedPage ? (
          <div className="max-w-3xl mx-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">{selectedPage.title}</h1>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-8">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last updated {selectedPage.updatedAt}
              </span>
              <span>by {selectedPage.updatedBy}</span>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {selectedPage.content || (
                <p className="text-muted-foreground italic">This page is empty. Click Edit to add content.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">Select a page from the sidebar to view its content</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
