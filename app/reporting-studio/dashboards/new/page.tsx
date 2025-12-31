'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardBuilder } from '@/components/reporting-studio/dashboard-builder'
import type { DashboardWidget } from '@/components/reporting-studio/dashboard-builder'
import { DashboardTemplateSelector } from '@/components/reporting-studio/dashboard-template-selector'
import { DashboardTemplate } from '@/lib/reporting-studio/dashboard-templates'
import { ChartConfig } from '@/lib/reporting-studio/chart-types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'

export default function NewDashboardPage() {
  const router = useRouter()
  const [dashboardName, setDashboardName] = useState('')
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(true)

  const handleTemplateSelect = (template: DashboardTemplate) => {
    setWidgets(template.widgets)
    setShowTemplateSelector(false)
    if (!dashboardName.trim()) {
      setDashboardName(template.name)
    }
  }

  const handleSave = async (dashboardWidgets: DashboardWidget[]) => {
    if (!dashboardName.trim()) {
      alert('Please enter a dashboard name')
      return
    }

    setIsSaving(true)
    try {
      // Convert widgets to dashboard configuration format
      const configuration = {
        widgets: dashboardWidgets.map(w => ({
          id: w.id,
          title: w.title,
          chartConfig: w.chartConfig,
          layout: w.layout,
        })),
        layouts: {}, // Will be populated from grid layout
      }

      const response = await fetch('/api/reporting-studio/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: dashboardName,
          description: `Dashboard created on ${new Date().toLocaleDateString()}`,
          configuration,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/reporting-studio/dashboards/${data.id}`)
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

  // Get available fields (in production, this would come from datasets)
  const availableFields = ['date', 'value', 'category', 'amount', 'sales', 'revenue', 'latitude', 'longitude']

  // Show template selector if no template has been selected yet
  if (showTemplateSelector) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <DashboardTemplateSelector
          onSelectTemplate={handleTemplateSelect}
          onCancel={() => router.push('/reporting-studio/dashboards')}
        />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4 bg-background">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/reporting-studio/dashboards')}
            >
              ← Back
            </Button>
            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="dashboard-name" className="sr-only">
                  Dashboard Name
                </Label>
                <Input
                  id="dashboard-name"
                  placeholder="Enter dashboard name..."
                  value={dashboardName}
                  onChange={(e) => setDashboardName(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTemplateSelector(true)}
            >
              Change Template
            </Button>
            <Button
              onClick={() => handleSave(widgets)}
              disabled={isSaving || !dashboardName.trim()}
            >
              {isSaving ? 'Saving...' : 'Save Dashboard'}
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Builder */}
      <div className="flex-1 overflow-hidden">
        <DashboardBuilder
          onSave={handleSave}
          availableFields={availableFields}
          initialWidgets={widgets}
        />
      </div>
    </div>
  )
}

