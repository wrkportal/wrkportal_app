'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardBuilder } from '@/components/reporting-studio/dashboard-builder'
import type { DashboardWidget } from '@/components/reporting-studio/dashboard-builder'
import { ChartConfig } from '@/lib/reporting-studio/chart-types'
import { Button } from '@/components/ui/button'
import { Loader2, Download, Share2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function DashboardViewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { toast } = useToast()
  const [isEdit, setIsEdit] = useState(false)

  const [dashboard, setDashboard] = useState<any>(null)
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const dashboardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (id) {
      fetchDashboard()
    }
  }, [id])

  const fetchDashboard = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/reporting-studio/dashboards/${id}`)
      if (response.ok) {
        const data = await response.json()
        setDashboard(data)

        // Convert dashboard configuration to widgets
        if (data.configuration?.widgets) {
          const dashboardWidgets: DashboardWidget[] = data.configuration.widgets.map((w: any) => ({
            id: w.id,
            title: w.title || 'Untitled Widget',
            chartConfig: w.chartConfig,
            data: generateSampleData(w.chartConfig),
            layout: w.layout || {
              x: 0,
              y: 0,
              w: 6,
              h: 4,
              minW: 3,
              minH: 3,
            },
          }))
          setWidgets(dashboardWidgets)
        }
      } else {
        console.error('Failed to fetch dashboard')
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportPDF = async () => {
    if (!dashboardRef.current) {
      toast({
        title: 'Export Failed',
        description: 'Dashboard content not found',
        variant: 'destructive',
      })
      return
    }

    setIsExporting(true)
    try {
      // Capture the dashboard as canvas
      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
      })

      // Calculate PDF dimensions
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const pdfWidth = imgWidth * 0.264583 // Convert pixels to mm (96 DPI)
      const pdfHeight = imgHeight * 0.264583

      // Create PDF
      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      })

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

      // Download PDF
      const fileName = `${dashboard?.name || 'dashboard'}-${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

      toast({
        title: 'Export Successful',
        description: 'Dashboard exported as PDF',
      })
    } catch (error: any) {
      console.error('Error exporting PDF:', error)
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export dashboard as PDF',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPNG = async () => {
    if (!dashboardRef.current) {
      toast({
        title: 'Export Failed',
        description: 'Dashboard content not found',
        variant: 'destructive',
      })
      return
    }

    setIsExporting(true)
    try {
      // Capture the dashboard as canvas
      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
      })

      // Convert canvas to blob and download
      await new Promise<void>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'))
            return
          }

          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${dashboard?.name || 'dashboard'}-${new Date().toISOString().split('T')[0]}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)

          toast({
            title: 'Export Successful',
            description: 'Dashboard exported as PNG',
          })
          resolve()
        }, 'image/png')
      })
    } catch (error: any) {
      console.error('Error exporting PNG:', error)
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export dashboard as PNG',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleShare = async () => {
    try {
      // Copy dashboard URL to clipboard
      const url = window.location.href
      await navigator.clipboard.writeText(url)
      toast({
        title: 'Link Copied',
        description: 'Dashboard link has been copied to your clipboard.',
      })
    } catch (error) {
      toast({
        title: 'Share Failed',
        description: 'Failed to copy link. Please copy the URL manually.',
        variant: 'destructive',
      })
    }
  }

  const generateSampleData = (config: ChartConfig): any[] => {
    if (config.type === 'PIE') {
      return [
        { category: 'A', value: 30 },
        { category: 'B', value: 25 },
        { category: 'C', value: 20 },
      ]
    }

    const categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    return categories.map(cat => {
      const point: any = {}
      if (config.xAxis?.field) {
        point[config.xAxis.field] = cat
      }
      config.series?.forEach(series => {
        point[series.field] = Math.floor(Math.random() * 100) + 10
      })
      return point
    })
  }

  const handleSave = async (dashboardWidgets: DashboardWidget[]) => {
    if (!dashboard) return

    setIsSaving(true)
    try {
      const configuration = {
        widgets: dashboardWidgets.map(w => ({
          id: w.id,
          title: w.title,
          chartConfig: w.chartConfig,
          layout: w.layout,
        })),
      }

      const response = await fetch(`/api/reporting-studio/dashboards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: dashboard.name,
          configuration,
        }),
      })

      if (response.ok) {
        setIsEdit(false)
        fetchDashboard() // Refresh dashboard data
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save dashboard')
      }
    } catch (error) {
      console.error('Error saving dashboard:', error)
      alert('Failed to save dashboard')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Dashboard not found</p>
              <Button onClick={() => router.push('/reporting-studio/dashboards')} className="mt-4">
                Back to Dashboards
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const availableFields = ['date', 'value', 'category', 'amount', 'sales', 'revenue']

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4 sm:p-6 bg-background pt-4 sm:pt-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/reporting-studio/dashboards')}
            >
              ← Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{dashboard.name}</h1>
              {dashboard.description && (
                <p className="text-sm text-muted-foreground">{dashboard.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEdit && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isExporting}>
                      {isExporting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportPDF} disabled={isExporting}>
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPNG} disabled={isExporting}>
                      Export as PNG
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
              </>
            )}
            {isEdit ? (
              <Button
                onClick={() => setIsEdit(false)}
                variant="outline"
              >
                Cancel Edit
              </Button>
            ) : (
              <Button
                onClick={() => setIsEdit(true)}
              >
                Edit Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Builder/Viewer */}
      <div ref={dashboardRef} className="flex-1 overflow-hidden">
        <DashboardBuilder
          dashboardId={id}
          onSave={isEdit ? handleSave : undefined}
          initialWidgets={widgets}
          availableFields={availableFields}
        />
      </div>
    </div>
  )
}

