'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Save, Loader2, CheckCircle2, AlertCircle, RotateCcw, LayoutGrid } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDefaultLayout } from '@/hooks/useDefaultLayout'
import { defaultLayouts, defaultWidgets } from '@/components/workflows/FinanceDashboardLandingPage'

interface Widget {
  id: string
  type: string
  visible: boolean
}
import { Layouts, Layout } from 'react-grid-layout'

export default function WidgetDefaultsPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const { saveAsDefault, loadDefaultLayout, isLoading, error } = useDefaultLayout()
  const [currentLayouts, setCurrentLayouts] = useState<Layouts>(defaultLayouts)
  const [currentWidgets, setCurrentWidgets] = useState(defaultWidgets)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Only Platform Owners can access this page
    if (user.role !== 'PLATFORM_OWNER') {
      router.push('/')
      return
    }

    // Load existing default layout
    loadExistingDefaults()
  }, [user, router])

  const loadExistingDefaults = async () => {
    try {
      setLoadStatus('loading')
      const dbDefault = await loadDefaultLayout('finance-dashboard')
      if (dbDefault) {
        if (dbDefault.layouts) {
          setCurrentLayouts(dbDefault.layouts)
        }
        if (dbDefault.widgets) {
          setCurrentWidgets(dbDefault.widgets)
        }
        setLoadStatus('success')
      } else {
        setLoadStatus('idle')
      }
    } catch (err) {
      console.error('Failed to load defaults:', err)
      setLoadStatus('error')
    }
  }

  const handleSave = async () => {
    try {
      setSaveStatus('saving')
      const success = await saveAsDefault('finance-dashboard', {
        widgets: currentWidgets,
        layouts: currentLayouts,
      }, undefined) // Pass undefined for targetRole (which will become null for general defaults)

      if (success) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (err) {
      console.error('Failed to save defaults:', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleReset = () => {
    setCurrentLayouts(defaultLayouts)
    setCurrentWidgets(defaultWidgets)
  }

  const updateLayoutForBreakpoint = (breakpoint: keyof Layouts, layout: Layout[]) => {
    setCurrentLayouts({
      ...currentLayouts,
      [breakpoint]: layout,
    })
  }

  const updateWidgetVisibility = (widgetId: string, visible: boolean) => {
    setCurrentWidgets(
      currentWidgets.map((w) => (w.id === widgetId ? { ...w, visible } : w))
    )
  }

  if (!user || user.role !== 'PLATFORM_OWNER') {
    return null
  }

  const breakpoints = [
    { key: 'lg', label: 'Large (≥1200px)', cols: 12 },
    { key: 'md', label: 'Laptop (996-1199px)', cols: 10 },
    { key: 'sm', label: 'Tablet (768-995px)', cols: 6 },
  ] as const

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <LayoutGrid className="h-8 w-8" />
          Default Widget Layouts Configuration
        </h1>
        <p className="text-muted-foreground">
          Set default widget sizes and positions for all users on the Finance Dashboard.
          Users can still customize their layouts after login.
        </p>
      </div>

      {/* Status Messages */}
      {saveStatus === 'success' && (
        <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Default layouts saved successfully! All new users will see these default sizes.
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === 'error' && (
        <Alert className="mb-4 border-red-500 bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error || 'Failed to save default layouts. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {loadStatus === 'success' && (
        <Alert className="mb-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Loaded existing default layouts from database.
          </AlertDescription>
        </Alert>
      )}

      {/* Widget Visibility */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Widget Visibility</CardTitle>
          <CardDescription>
            Choose which widgets are visible by default for new users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {currentWidgets.map((widget) => (
              <div
                key={widget.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <span className="text-sm font-medium capitalize">
                  {widget.id.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <Button
                  variant={widget.visible ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateWidgetVisibility(widget.id, !widget.visible)}
                >
                  {widget.visible ? 'Visible' : 'Hidden'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Layout Configuration by Breakpoint */}
      <Card>
        <CardHeader>
          <CardTitle>Layout Configuration by Screen Size</CardTitle>
          <CardDescription>
            Configure default widget positions and sizes for different screen sizes.
            Click on a widget to see its current dimensions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="lg" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {breakpoints.map((bp) => (
                <TabsTrigger key={bp.key} value={bp.key}>
                  {bp.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {breakpoints.map((bp) => {
              const layout = currentLayouts[bp.key] || []
              return (
                <TabsContent key={bp.key} value={bp.key} className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    Grid: {bp.cols} columns | Row Height: 80px
                  </div>
                  <div className="space-y-2">
                    {layout
                      .filter((item) => currentWidgets.find((w) => w.id === item.i)?.visible)
                      .map((item) => (
                        <div
                          key={item.i}
                          className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                        >
                          <div className="flex-1">
                            <div className="font-medium capitalize mb-1">
                              {item.i.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>
                                Position: x={item.x}, y={item.y}
                              </div>
                              <div>
                                Size: {item.w} cols × {item.h} units ({Math.round((item.w / bp.cols) * 100)}% width × {item.h * 80}px height)
                              </div>
                              <div>
                                Min: {item.minW || 'auto'} cols × {item.minH || 'auto'} units
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newLayout = layout.map((l) =>
                                  l.i === item.i
                                    ? { ...l, w: Math.min(item.w + 1, bp.cols), minW: l.minW || 2 }
                                    : l
                                )
                                updateLayoutForBreakpoint(bp.key, newLayout)
                              }}
                              disabled={item.w >= bp.cols}
                            >
                              Wider
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newLayout = layout.map((l) =>
                                  l.i === item.i
                                    ? { ...l, w: Math.max(item.w - 1, l.minW || 2), minW: l.minW || 2 }
                                    : l
                                )
                                updateLayoutForBreakpoint(bp.key, newLayout)
                              }}
                              disabled={item.w <= (item.minW || 2)}
                            >
                              Narrower
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newLayout = layout.map((l) =>
                                  l.i === item.i
                                    ? { ...l, h: item.h + 1, minH: l.minH || 3 }
                                    : l
                                )
                                updateLayoutForBreakpoint(bp.key, newLayout)
                              }}
                            >
                              Taller
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newLayout = layout.map((l) =>
                                  l.i === item.i
                                    ? { ...l, h: Math.max(item.h - 1, l.minH || 3), minH: l.minH || 3 }
                                    : l
                                )
                                updateLayoutForBreakpoint(bp.key, newLayout)
                              }}
                              disabled={item.h <= (item.minH || 3)}
                            >
                              Shorter
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>
              )
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-4 justify-end">
        <Button variant="outline" onClick={handleReset} disabled={isLoading}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Hardcoded Defaults
        </Button>
        <Button onClick={handleSave} disabled={isLoading || saveStatus === 'saving'}>
          {isLoading || saveStatus === 'saving' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save as Default for All Users
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

