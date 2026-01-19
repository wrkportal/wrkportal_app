'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { FileDown, Loader2 } from 'lucide-react'

interface DashboardExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dashboardName: string
  visualizations: any[]
  textWidgets: any[]
  pages?: Array<{ id: string; name: string; order: number }>
  onExport: (format: 'pdf' | 'ppt', slides: Slide[]) => Promise<void>
}

interface Slide {
  id: string
  number: number
  title: string
  items: Array<{
    id: string
    type: 'visualization' | 'text'
    name: string
    order: number
  }>
}

export function DashboardExportDialog({
  open,
  onOpenChange,
  dashboardName,
  visualizations,
  textWidgets,
  pages = [],
  onExport,
}: DashboardExportDialogProps) {
  const [format, setFormat] = useState<'pdf' | 'ppt'>('pdf')
  const [slides, setSlides] = useState<Slide[]>([])
  const [exporting, setExporting] = useState(false)

  // Initialize slides from pages - automatically organize by pages
  useEffect(() => {
    if (open && pages.length > 0) {
      const firstPageId = pages[0].id
      const pageSlides: Slide[] = pages
        .sort((a, b) => a.order - b.order)
        .map((page, index) => {
          // Get items for this page
          const pageVisualizations = visualizations.filter((viz: any) => {
            if (!viz.pageId) {
              return page.id === firstPageId
            }
            return viz.pageId === page.id
          })

          const pageTextWidgets = textWidgets.filter((widget: any) => {
            if (!widget.pageId) {
              return page.id === firstPageId
            }
            return widget.pageId === page.id
          })

          const items: Slide['items'] = [
            ...pageVisualizations.map((viz, idx) => ({
              id: viz.id,
              type: 'visualization' as const,
              name: viz.name || viz.title || `Visualization ${idx + 1}`,
              order: idx,
            })),
            ...pageTextWidgets.map((widget, idx) => ({
              id: widget.id,
              type: 'text' as const,
              name: widget.content ? `Text Widget ${idx + 1}` : 'Text Widget',
              order: pageVisualizations.length + idx,
            })),
          ]

          return {
            id: page.id,
            number: index + 1,
            title: page.name,
            items,
          }
        })

      setSlides(pageSlides)
    } else if (open && visualizations.length > 0) {
      // Fallback: if no pages, put everything on one slide
      const initialItems: Slide['items'] = [
        ...visualizations.map((viz, idx) => ({
          id: viz.id,
          type: 'visualization' as const,
          name: viz.name || viz.title || `Visualization ${idx + 1}`,
          order: idx,
        })),
        ...textWidgets.map((widget, idx) => ({
          id: widget.id,
          type: 'text' as const,
          name: widget.content ? `Text Widget ${idx + 1}` : 'Text Widget',
          order: visualizations.length + idx,
        })),
      ]

      if (initialItems.length > 0) {
        setSlides([
          {
            id: 'slide-1',
            number: 1,
            title: 'Slide 1',
            items: initialItems,
          },
        ])
      }
    }
  }, [open, visualizations, textWidgets, pages])

  const handleExport = async () => {
    setExporting(true)
    try {
      // Automatically export all pages
      await onExport(format, slides)
      onOpenChange(false)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Dashboard</DialogTitle>
          <DialogDescription>
            Export all {pages.length > 0 ? `${pages.length} page${pages.length > 1 ? 's' : ''}` : 'pages'} from your dashboard as {format.toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={(value: 'pdf' | 'ppt') => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="ppt">PowerPoint (PPT)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pages Preview */}
          {pages.length > 0 && (
            <div className="space-y-2">
              <Label>Pages to Export ({slides.length})</Label>
              <ScrollArea className="h-[200px] border rounded-md p-4">
                <div className="space-y-2">
                  {slides.map((slide) => (
                    <div key={slide.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{slide.number}</Badge>
                        <span className="text-sm font-medium">{slide.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {slide.items.length} item{slide.items.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Export Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting || slides.length === 0}>
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export as {format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
