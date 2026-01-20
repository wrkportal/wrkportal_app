'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Target, Plus, DollarSign, TrendingUp, Upload, FileSpreadsheet, Download, Loader2, Search, Filter, GripVertical, Eye, ArrowUpDown, ArrowUp, ArrowDown, LayoutGrid, Table as TableIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { StageTooltip } from '@/components/sales/stage-tooltip'
import { ChevronDown } from 'lucide-react'
import { ColumnMappingDialog, OPPORTUNITY_STANDARD_FIELDS } from '@/components/sales/lead-column-mapping-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const ResponsiveGridLayout = WidthProvider(Responsive)

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a28dff', '#8884d8', '#82ca9d']

interface Opportunity {
  id: string
  name: string
  account: {
    id: string
    name: string
  } | null
  stage: string
  amount: number
  probability: number
  expectedCloseDate: string
  status: string
  owner: {
    id: string
    name: string | null
    email: string
  }
}

const stages = [
  'PROSPECTING',
  'QUALIFICATION',
  'NEEDS_ANALYSIS',
  'VALUE_PROPOSITION',
  'ID_DECISION_MAKERS',
  'PERCEPTION_ANALYSIS',
  'PROPOSAL_PRICE_QUOTE',
  'NEGOTIATION_REVIEW',
  'CLOSED_WON',
  'CLOSED_LOST',
]

interface Account {
  id: string
  name: string
}

function OpportunitiesInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [stageFilter, setStageFilter] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: '',
  })
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [funnelData, setFunnelData] = useState<Array<{ stage: string; value: number; fill: string }>>([])
  const [analytics, setAnalytics] = useState({
    totalPipeline: 0,
    weightedPipeline: 0,
    closedWon: 0,
    opportunitiesByStage: [] as any[],
    opportunitiesBySource: [] as any[],
    pipelineTrend: [] as any[],
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [updatingStageId, setUpdatingStageId] = useState<string | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<any>(null)
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false)
  const [fileColumns, setFileColumns] = useState<string[]>([])
  const [sampleRows, setSampleRows] = useState<Record<string, any>[]>([])
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const isResizingRef = useRef(false)
  const [formData, setFormData] = useState({
    name: '',
    accountId: '',
    description: '',
    stage: 'PROSPECTING',
    amount: '',
    probability: '10',
    expectedCloseDate: '',
    type: '',
    leadSource: '',
    nextStep: '',
  })

  // Fix overlapping layouts by moving widgets down
  const fixOverlappingLayouts = (layout: Layout[]): Layout[] => {
    if (!layout || layout.length === 0) return layout

    const fixed = layout.map(item => ({ ...item }))
    let hasOverlaps = true
    let iterations = 0
    const maxIterations = 50

    while (hasOverlaps && iterations < maxIterations) {
      hasOverlaps = false
      iterations++

      const sorted = [...fixed].sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y
        return a.x - b.x
      })

      for (let i = 0; i < sorted.length; i++) {
        const current = sorted[i]
        const currentIndex = fixed.findIndex(item => item.i === current.i)
        if (currentIndex === -1) continue

        const currentRight = current.x + current.w
        const currentBottom = current.y + current.h

        for (let j = i + 1; j < sorted.length; j++) {
          const other = sorted[j]
          const otherIndex = fixed.findIndex(item => item.i === other.i)
          if (otherIndex === -1) continue

          const otherRight = other.x + other.w
          const otherBottom = other.y + other.h

          const tolerance = 0.1
          const overlapsX = current.x < otherRight - tolerance && currentRight > other.x + tolerance
          const overlapsY = current.y < otherBottom - tolerance && currentBottom > other.y + tolerance

          if (overlapsX && overlapsY) {
            hasOverlaps = true
            fixed[otherIndex] = {
              ...other,
              y: currentBottom
            }
            sorted[j] = fixed[otherIndex]
            break
          }
        }
      }
    }

    return fixed
  }

  const initializeDefaultLayout = (): Layouts => {
    const defaultLayout: Layout[] = [
      { i: 'totalPipeline', x: 0, y: 0, w: 4, h: 2, minW: 1, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'weightedPipeline', x: 4, y: 0, w: 4, h: 2, minW: 1, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'closedWon', x: 8, y: 0, w: 4, h: 2, minW: 1, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'opportunitiesByStage', x: 0, y: 2, w: 4, h: 5, minW: 2, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'opportunitiesBySource', x: 4, y: 2, w: 4, h: 5, minW: 2, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'pipelineTrend', x: 8, y: 2, w: 4, h: 5, minW: 2, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'funnelChart', x: 0, y: 7, w: 6, h: 6, minW: 2, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'opportunitiesTable', x: 6, y: 7, w: 6, h: 8, minW: 3, minH: 3, maxW: 12, maxH: Infinity },
    ]
    return { lg: defaultLayout, md: defaultLayout, sm: defaultLayout, xs: defaultLayout }
  }

  const [layouts, setLayouts] = useState<Layouts>(() => {
    if (typeof window === 'undefined') {
      return { lg: [], md: [], sm: [], xs: [] }
    }
    const defaultLayout = initializeDefaultLayout()
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('opportunities-page-layout')
        if (saved) {
          const parsedLayouts = JSON.parse(saved)
          const sanitizedLayouts: Layouts = {
            lg: (parsedLayouts.lg || []).filter((item: any): item is Layout =>
              item && typeof item === 'object' && typeof item.y === 'number' && typeof item.x === 'number'
            ).map((item: Layout) => ({
              ...item,
              maxW: item.maxW ?? 12,
              maxH: item.maxH ?? Infinity,
            })),
            md: (parsedLayouts.md || []).filter((item: any): item is Layout =>
              item && typeof item === 'object' && typeof item.y === 'number' && typeof item.x === 'number'
            ).map((item: Layout) => ({
              ...item,
              maxW: item.maxW ?? 12,
              maxH: item.maxH ?? Infinity,
            })),
            sm: (parsedLayouts.sm || []).filter((item: any): item is Layout =>
              item && typeof item === 'object' && typeof item.y === 'number' && typeof item.x === 'number'
            ).map((item: Layout) => ({
              ...item,
              maxW: item.maxW ?? 12,
              maxH: item.maxH ?? Infinity,
            })),
            xs: (parsedLayouts.xs || []).filter((item: any): item is Layout =>
              item && typeof item === 'object' && typeof item.y === 'number' && typeof item.x === 'number'
            ).map((item: Layout) => ({
              ...item,
              maxW: item.maxW ?? 12,
              maxH: item.maxH ?? Infinity,
            })),
          }
          const requiredWidgetIds = defaultLayout.lg.map(item => item.i)
          const hasAllWidgets = requiredWidgetIds.every(id =>
            sanitizedLayouts.lg.some(item => item.i === id)
          )
          if (hasAllWidgets && sanitizedLayouts.lg.length > 0) {
            const fixedLayouts: Layouts = {
              lg: fixOverlappingLayouts(sanitizedLayouts.lg),
              md: fixOverlappingLayouts(sanitizedLayouts.md),
              sm: fixOverlappingLayouts(sanitizedLayouts.sm),
              xs: fixOverlappingLayouts(sanitizedLayouts.xs),
            }
            try {
              localStorage.setItem('opportunities-page-layout', JSON.stringify(fixedLayouts))
            } catch (e) {
              console.error('Error saving fixed layout:', e)
            }
            return fixedLayouts
          }
        }
      } catch (error) {
        console.error('Error loading layout:', error)
      }
    }
    return defaultLayout
  })

  const updateLayoutConstraints = (layout: Layout[]): Layout[] => {
    const metricCards = ['totalPipeline', 'weightedPipeline', 'closedWon']
    const chartWidgets = ['opportunitiesByStage', 'opportunitiesBySource', 'pipelineTrend', 'funnelChart']
    return layout.map(item => {
      if (metricCards.includes(item.i)) {
        return {
          ...item,
          minH: Math.min(item.minH ?? 2, 2),
          minW: Math.min(item.minW ?? 1, 1),
          maxW: item.maxW ?? 12,
          maxH: item.maxH ?? Infinity,
        }
      }
      if (chartWidgets.includes(item.i)) {
        return {
          ...item,
          minH: Math.min(item.minH ?? 2, 2),
          minW: Math.min(item.minW ?? 2, 2),
          maxW: item.maxW ?? 12,
          maxH: item.maxH ?? Infinity,
        }
      }
      if (item.i === 'opportunitiesTable') {
        return {
          ...item,
          minH: Math.min(item.minH ?? 3, 3),
          minW: Math.min(item.minW ?? 3, 3),
          maxW: item.maxW ?? 12,
          maxH: item.maxH ?? Infinity,
        }
      }
      return {
        ...item,
        maxW: item.maxW ?? 12,
        maxH: item.maxH ?? Infinity,
      }
    })
  }

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    const fixedLayout = fixOverlappingLayouts(currentLayout)
    const constrainedLayout = updateLayoutConstraints(fixedLayout)
    const updatedLayouts = {
      ...allLayouts,
      lg: constrainedLayout,
    }
    setLayouts(updatedLayouts)
    try {
      localStorage.setItem('opportunities-page-layout', JSON.stringify(updatedLayouts))
    } catch (error) {
      console.error('Error saving layout:', error)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetchOpportunities()
    fetchAccounts()
  }, [])

  useEffect(() => {
    fetchOpportunities()
  }, [statusFilter, stageFilter, searchTerm, dateFilter.startDate, dateFilter.endDate, sortColumn, sortDirection])

  useEffect(() => {
    calculateFunnelData()
    calculateAnalytics()
  }, [opportunities])

  const calculateFunnelData = () => {
    // Opportunity stages in order (excluding CLOSED_LOST)
    const opportunityStages = [
      'PROSPECTING',
      'QUALIFICATION',
      'NEEDS_ANALYSIS',
      'VALUE_PROPOSITION',
      'ID_DECISION_MAKERS',
      'PERCEPTION_ANALYSIS',
      'PROPOSAL_PRICE_QUOTE',
      'NEGOTIATION_REVIEW',
      'CLOSED_WON',
    ]

    // Calculate cumulative counts - each stage includes all opportunities that have reached at least that stage
    // This ensures: PROSPECTING >= QUALIFICATION >= ... >= CLOSED_WON

    const formatStageName = (stage: string) => {
      return stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    const openOpportunities = opportunities.filter(o => o.status === 'OPEN')
    const wonOpportunities = opportunities.filter(o => o.status === 'WON')

    // Helper function to count opportunities at or beyond a stage
    const countAtOrBeyond = (stage: string) => {
      const stageIndex = opportunityStages.indexOf(stage)
      if (stage === 'CLOSED_WON') {
        return wonOpportunities.length
      }
      return openOpportunities.filter(o => {
        const oppStageIndex = opportunityStages.indexOf(o.stage)
        return oppStageIndex >= stageIndex
      }).length
    }

    const funnelData = [
      { stage: formatStageName('PROSPECTING'), value: countAtOrBeyond('PROSPECTING'), fill: '#8884d8' },
      { stage: formatStageName('QUALIFICATION'), value: countAtOrBeyond('QUALIFICATION'), fill: '#82ca9d' },
      { stage: formatStageName('NEEDS_ANALYSIS'), value: countAtOrBeyond('NEEDS_ANALYSIS'), fill: '#ffc658' },
      { stage: formatStageName('VALUE_PROPOSITION'), value: countAtOrBeyond('VALUE_PROPOSITION'), fill: '#ff8042' },
      { stage: formatStageName('ID_DECISION_MAKERS'), value: countAtOrBeyond('ID_DECISION_MAKERS'), fill: '#a28dff' },
      { stage: formatStageName('PERCEPTION_ANALYSIS'), value: countAtOrBeyond('PERCEPTION_ANALYSIS'), fill: '#8884d8' },
      { stage: formatStageName('PROPOSAL_PRICE_QUOTE'), value: countAtOrBeyond('PROPOSAL_PRICE_QUOTE'), fill: '#ec4899' },
      { stage: formatStageName('NEGOTIATION_REVIEW'), value: countAtOrBeyond('NEGOTIATION_REVIEW'), fill: '#f59e0b' },
      { stage: formatStageName('CLOSED_WON'), value: countAtOrBeyond('CLOSED_WON'), fill: '#10b981' },
    ]

    setFunnelData(funnelData)
  }

  // Open dialog if create parameter is present
  useEffect(() => {
    if (searchParams?.get('create') === 'true') {
      setIsDialogOpen(true)
    }
    // Auto-open upload dialog if ?upload=true
    if (searchParams?.get('upload') === 'true') {
      setUploadDialogOpen(true)
    }
  }, [searchParams])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/sales/accounts')
      if (response.ok) {
        const data = await response.json()
        setAccounts(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter.length > 0) {
        statusFilter.forEach(status => {
          params.append('status', status)
        })
      }
      if (stageFilter.length > 0) {
        stageFilter.forEach(stage => {
          params.append('stage', stage)
        })
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      if (dateFilter.startDate) {
        params.append('startDate', dateFilter.startDate)
      }
      if (dateFilter.endDate) {
        params.append('endDate', dateFilter.endDate)
      }

      const response = await fetch(`/api/sales/opportunities?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch opportunities' }))
        console.error('Error fetching opportunities:', errorData)
        setOpportunities([])
        return
      }

      const data = await response.json()
      setOpportunities(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching opportunities:', error)
      setOpportunities([])
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const calculateAnalytics = () => {
    const openOpps = opportunities.filter(o => o.status === 'OPEN')
    const wonOpps = opportunities.filter(o => o.status === 'WON')

    const totalPipeline = openOpps.reduce((sum, o) => sum + parseFloat(o.amount.toString()), 0)
    const weightedPipeline = openOpps.reduce((sum, o) => sum + parseFloat(o.amount.toString()) * (o.probability / 100), 0)
    const closedWon = wonOpps.reduce((sum, o) => sum + parseFloat(o.amount.toString()), 0)

    // Opportunities by Stage
    const stageCounts: Record<string, number> = {}
    openOpps.forEach(opp => {
      stageCounts[opp.stage] = (stageCounts[opp.stage] || 0) + 1
    })
    const opportunitiesByStage = Object.entries(stageCounts).map(([name, value]) => ({
      name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
    }))

    // Opportunities by Source (using leadSource if available, otherwise 'Unknown')
    const sourceCounts: Record<string, number> = {}
    openOpps.forEach(opp => {
      const source = (opp as any).leadSource || 'Unknown'
      sourceCounts[source] = (sourceCounts[source] || 0) + 1
    })
    const opportunitiesBySource = Object.entries(sourceCounts).map(([name, value]) => ({
      name,
      value,
    }))

    // Pipeline Trend (last 6 months)
    const trendData: Record<string, { pipeline: number; weighted: number }> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      trendData[monthKey] = { pipeline: 0, weighted: 0 }
    }
    openOpps.forEach(opp => {
      const oppDate = new Date(opp.expectedCloseDate)
      const monthKey = oppDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      if (trendData[monthKey]) {
        trendData[monthKey].pipeline += parseFloat(opp.amount.toString())
        trendData[monthKey].weighted += parseFloat(opp.amount.toString()) * (opp.probability / 100)
      }
    })
    const pipelineTrend = Object.entries(trendData).map(([name, data]) => ({
      name,
      pipeline: data.pipeline / 1000,
      weighted: data.weighted / 1000,
    }))

    setAnalytics({
      totalPipeline,
      weightedPipeline,
      closedWon,
      opportunitiesByStage,
      opportunitiesBySource,
      pipelineTrend,
    })
  }

  const handleUpdateStage = async (opportunityId: string, newStage: string) => {
    setUpdatingStageId(opportunityId)
    try {
      const response = await fetch(`/api/sales/opportunities/${opportunityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })

      if (response.ok) {
        // Refresh opportunities to reflect the change
        await fetchOpportunities()
      } else {
        const error = await response.json()
        alert(`Failed to update stage: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating stage:', error)
      alert('An error occurred while updating the stage. Please try again.')
    } finally {
      setUpdatingStageId(null)
    }
  }

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      PROSPECTING: 'bg-gray-100 text-gray-800',
      QUALIFICATION: 'bg-blue-100 text-blue-800',
      NEEDS_ANALYSIS: 'bg-purple-100 text-purple-800',
      VALUE_PROPOSITION: 'bg-indigo-100 text-indigo-800',
      ID_DECISION_MAKERS: 'bg-yellow-100 text-yellow-800',
      PERCEPTION_ANALYSIS: 'bg-orange-100 text-orange-800',
      PROPOSAL_PRICE_QUOTE: 'bg-pink-100 text-pink-800',
      NEGOTIATION_REVIEW: 'bg-red-100 text-red-800',
      CLOSED_WON: 'bg-green-100 text-green-800',
      CLOSED_LOST: 'bg-gray-100 text-gray-800',
    }
    return colors[stage] || 'bg-gray-100 text-gray-800'
  }

  const opportunitiesByStage = stages.reduce((acc, stage) => {
    acc[stage] = opportunities.filter((opp) => opp.stage === stage && opp.status === 'OPEN')
    return acc
  }, {} as Record<string, Opportunity[]>)

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        name: formData.name,
        accountId: formData.accountId || undefined,
        description: formData.description || undefined,
        stage: formData.stage,
        amount: formData.amount ? parseFloat(formData.amount) : 0,
        probability: formData.probability ? parseInt(formData.probability) : 10,
        expectedCloseDate: formData.expectedCloseDate || new Date().toISOString(),
        type: formData.type || undefined,
        leadSource: formData.leadSource || undefined,
        nextStep: formData.nextStep || undefined,
      }

      const response = await fetch('/api/sales/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        setFormData({
          name: '',
          accountId: '',
          description: '',
          stage: 'PROSPECTING',
          amount: '',
          probability: '10',
          expectedCloseDate: '',
          type: '',
          leadSource: '',
          nextStep: '',
        })
        fetchOpportunities()
      }
    } catch (error) {
      console.error('Error creating opportunity:', error)
    }
  }

  const handleFileSelect = async (file: File) => {
    try {
      setUploading(true)
      const previewFormData = new FormData()
      previewFormData.append('file', file)
      const previewResponse = await fetch('/api/sales/opportunities/upload/preview', {
        method: 'POST',
        body: previewFormData,
      })
      const previewResult = await previewResponse.json()
      if (previewResponse.ok && previewResult.success) {
        setFileColumns(previewResult.columns)
        setSampleRows(previewResult.sampleRows || [])
        setPendingFile(file)
        setMappingDialogOpen(true)
        setUploadDialogOpen(false)
      } else {
        alert(previewResult.error || 'Failed to preview file')
      }
    } catch (error: any) {
      console.error('Error previewing file:', error)
      alert('Failed to preview file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleMappingConfirm = async (mapping: Record<string, string>) => {
    if (!pendingFile) return
    try {
      setUploading(true)
      setMappingDialogOpen(false)
      setUploadResults(null)
      const formData = new FormData()
      formData.append('file', pendingFile)
      formData.append('mapping', JSON.stringify(mapping))
      const response = await fetch('/api/sales/opportunities/upload', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      if (response.ok) {
        setUploadResults(result)
        fetchOpportunities()
        setPendingFile(null)
        setFileColumns([])
        setSampleRows([])
      } else {
        setUploadResults({
          success: false,
          error: result.error || 'Failed to upload opportunities',
          summary: { total: 0, successful: 0, failed: 1, duplicates: 0 },
        })
      }
    } catch (error: any) {
      console.error('Error uploading file:', error)
      setUploadResults({
        success: false,
        error: error.message || 'Failed to upload opportunities',
        summary: { total: 0, successful: 0, failed: 1, duplicates: 0 },
      })
    } finally {
      setUploading(false)
      setUploadDialogOpen(true)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/sales/opportunities/template')
      if (!response.ok) throw new Error('Failed to download template')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'opportunity-upload-template.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Error downloading template:', error)
      alert('Failed to download template. Please try again.')
    }
  }

  return (
    <SalesPageLayout>
      <div className="space-y-6">
        {/* Header with Title, Search, Filters and Buttons */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Sales Pipeline</h2>
            <p className="text-muted-foreground mt-1">Track deals through the sales pipeline</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 relative min-w-[300px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 border rounded-md bg-background">
              <div className="flex items-center gap-2">
                <Label htmlFor="startDate" className="text-sm text-muted-foreground whitespace-nowrap">
                  From:
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-[150px] h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="endDate" className="text-sm text-muted-foreground whitespace-nowrap">
                  To:
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-[150px] h-9"
                />
              </div>
              {(dateFilter.startDate || dateFilter.endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateFilter({ startDate: '', endDate: '' })}
                  className="h-8 px-2"
                >
                  Clear
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-[180px] justify-between h-9">
                    <span>
                      {statusFilter.length === 0
                        ? 'All Statuses'
                        : statusFilter.length === 1
                          ? statusFilter[0]
                          : `${statusFilter.length} selected`}
                    </span>
                    <Filter className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]" onCloseAutoFocus={(e) => e.preventDefault()}>
                  <div className="p-2 space-y-2">
                    <div
                      className="flex items-center space-x-2 p-2 rounded-sm hover:bg-accent cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setStatusFilter([])
                      }}
                    >
                      <Checkbox checked={statusFilter.length === 0} />
                      <label className="text-sm font-medium leading-none cursor-pointer flex-1">
                        All Statuses
                      </label>
                    </div>
                    {['OPEN', 'WON', 'LOST'].map((status) => (
                      <div
                        key={status}
                        className="flex items-center space-x-2 p-2 rounded-sm hover:bg-accent cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setStatusFilter((prev) =>
                            prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
                          )
                        }}
                      >
                        <Checkbox checked={statusFilter.includes(status)} />
                        <label className="text-sm font-medium leading-none cursor-pointer flex-1">
                          {status}
                        </label>
                      </div>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-[180px] justify-between h-9">
                    <span>
                      {stageFilter.length === 0
                        ? 'All Stages'
                        : stageFilter.length === 1
                          ? stageFilter[0].replace(/_/g, ' ')
                          : `${stageFilter.length} selected`}
                    </span>
                    <Filter className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]" onCloseAutoFocus={(e) => e.preventDefault()}>
                  <div className="p-2 space-y-2">
                    <div
                      className="flex items-center space-x-2 p-2 rounded-sm hover:bg-accent cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setStageFilter([])
                      }}
                    >
                      <Checkbox checked={stageFilter.length === 0} />
                      <label className="text-sm font-medium leading-none cursor-pointer flex-1">
                        All Stages
                      </label>
                    </div>
                    {stages.map((stage) => (
                      <div
                        key={stage}
                        className="flex items-center space-x-2 p-2 rounded-sm hover:bg-accent cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setStageFilter((prev) =>
                            prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
                          )
                        }}
                      >
                        <Checkbox checked={stageFilter.includes(stage)} />
                        <label className="text-sm font-medium leading-none cursor-pointer flex-1">
                          {stage.replace(/_/g, ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Opportunities
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Opportunity
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Opportunity</DialogTitle>
                  <DialogDescription>
                    Add a new sales opportunity to track through the pipeline
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateOpportunity} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Opportunity Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter opportunity name"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="accountId">Account</Label>
                      <Select
                        value={formData.accountId || undefined}
                        onValueChange={(value) => setFormData({ ...formData, accountId: value === 'none' ? '' : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor="stage">Stage *</Label>
                        <StageTooltip stage={formData.stage} />
                      </div>
                      <Select
                        value={formData.stage}
                        onValueChange={(value) => setFormData({ ...formData, stage: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PROSPECTING">Prospecting</SelectItem>
                          <SelectItem value="QUALIFICATION">Qualification</SelectItem>
                          <SelectItem value="NEEDS_ANALYSIS">Needs Analysis</SelectItem>
                          <SelectItem value="VALUE_PROPOSITION">Value Proposition</SelectItem>
                          <SelectItem value="ID_DECISION_MAKERS">ID Decision Makers</SelectItem>
                          <SelectItem value="PERCEPTION_ANALYSIS">Perception Analysis</SelectItem>
                          <SelectItem value="PROPOSAL_PRICE_QUOTE">Proposal/Price Quote</SelectItem>
                          <SelectItem value="NEGOTIATION_REVIEW">Negotiation/Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="probability">Probability (%)</Label>
                      <Input
                        id="probability"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.probability}
                        onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="expectedCloseDate">Expected Close Date *</Label>
                    <Input
                      id="expectedCloseDate"
                      type="date"
                      value={formData.expectedCloseDate}
                      onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Input
                        id="type"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        placeholder="e.g., New Business, Renewal"
                      />
                    </div>

                    <div>
                      <Label htmlFor="leadSource">Lead Source</Label>
                      <Input
                        id="leadSource"
                        value={formData.leadSource}
                        onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                        placeholder="e.g., Website, Referral"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="nextStep">Next Step</Label>
                    <Input
                      id="nextStep"
                      value={formData.nextStep}
                      onChange={(e) => setFormData({ ...formData, nextStep: e.target.value })}
                      placeholder="Describe the next step"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="Enter opportunity description"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Opportunity</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Draggable Grid Layout with Charts */}
        {!mounted ? (
          <div style={{ minHeight: '800px' }} className="opportunities-page-grid">
            <div className="text-center py-8 text-muted-foreground">Loading layout...</div>
          </div>
        ) : (
          <div style={{ minHeight: '800px' }} className="opportunities-page-grid">
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={60}
              onLayoutChange={(currentLayout, allLayouts) => {
                if (!isResizingRef.current) {
                  handleLayoutChange(currentLayout, allLayouts)
                }
              }}
              onResizeStart={() => {
                isResizingRef.current = true
                setIsResizing(true)
              }}
              onResize={(layout) => {
                const layoutWithConstraints = updateLayoutConstraints(layout)
                setLayouts(prev => ({ ...prev, lg: layoutWithConstraints }))
              }}
              onResizeStop={(layout) => {
                isResizingRef.current = false
                setIsResizing(false)
                const allLayouts = { ...layouts, lg: layout }
                handleLayoutChange(layout, allLayouts)
              }}
              draggableHandle=".drag-handle"
              isDraggable={true}
              isResizable={true}
              margin={[16, 16]}
              compactType={isResizing ? null : "vertical"}
              preventCollision={false}
              useCSSTransforms={true}
            >
              {/* Total Pipeline Card */}
              <div key="totalPipeline">
                <Card className="h-full relative group flex flex-col">
                  <div className="drag-handle absolute top-2 right-2 z-20 cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${(analytics.totalPipeline / 1000).toFixed(1)}K
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {opportunities.filter((o) => o.status === 'OPEN').length} open opportunities
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Weighted Pipeline Card */}
              <div key="weightedPipeline">
                <Card className="h-full relative group flex flex-col">
                  <div className="drag-handle absolute top-2 right-2 z-20 cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Weighted Pipeline</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${(analytics.weightedPipeline / 1000).toFixed(1)}K
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Probability-weighted value
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Closed Won Card */}
              <div key="closedWon">
                <Card className="h-full relative group flex flex-col">
                  <div className="drag-handle absolute top-2 right-2 z-20 cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Closed Won</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${(analytics.closedWon / 1000).toFixed(1)}K
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {opportunities.filter((o) => o.status === 'WON').length} won deals
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Opportunities by Stage Chart */}
              <div key="opportunitiesByStage">
                <Card className="h-full relative group flex flex-col">
                  <div className="drag-handle absolute top-2 right-2 z-[100] cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md" style={{ pointerEvents: 'auto' }}>
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16 z-[99] cursor-move" style={{ pointerEvents: 'auto' }} />
                  <CardHeader className="flex-shrink-0">
                    <CardTitle>Opportunities by Stage</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 p-4">
                    <div style={{ pointerEvents: 'auto' }} className="h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.opportunitiesByStage}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" radius={[16, 16, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Opportunities by Source Chart */}
              <div key="opportunitiesBySource">
                <Card className="h-full relative group flex flex-col">
                  <div className="drag-handle absolute top-2 right-2 z-[100] cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md" style={{ pointerEvents: 'auto' }}>
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16 z-[99] cursor-move" style={{ pointerEvents: 'auto' }} />
                  <CardHeader className="flex-shrink-0">
                    <CardTitle>Opportunities by Source</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.opportunitiesBySource}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius="70%"
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytics.opportunitiesBySource.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Pipeline Trend Chart */}
              <div key="pipelineTrend">
                <Card className="h-full relative group flex flex-col">
                  <div className="drag-handle absolute top-2 right-2 z-[100] cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md" style={{ pointerEvents: 'auto' }}>
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16 z-[99] cursor-move" style={{ pointerEvents: 'auto' }} />
                  <CardHeader className="flex-shrink-0">
                    <CardTitle>Pipeline Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.pipelineTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="pipeline" stroke="#8884d8" name="Pipeline" />
                        <Line type="monotone" dataKey="weighted" stroke="#82ca9d" name="Weighted" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Funnel Chart */}
              <div key="funnelChart">
                <Card className="h-full relative group flex flex-col">
                  <div className="drag-handle absolute top-2 right-2 z-[100] cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md" style={{ pointerEvents: 'auto' }}>
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16 z-[99] cursor-move" style={{ pointerEvents: 'auto' }} />
                  <CardHeader className="flex-shrink-0">
                    <CardTitle>Opportunity Funnel</CardTitle>
                    <CardDescription>Conversion by stage</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 pb-4 pr-4 overflow-hidden">
                    <div className="w-full h-full overflow-hidden" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px 16px' }}>
                      {funnelData.length > 0 ? (
                        <div className="w-full space-y-1 overflow-hidden" style={{ maxWidth: '100%' }}>
                          {funnelData.map((item, index) => {
                            const maxValue = Math.max(...funnelData.map(d => d.value))
                            const widthPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0
                            const prevItem = index > 0 ? funnelData[index - 1] : null
                            const prevWidthPercent = prevItem && maxValue > 0
                              ? (prevItem.value / maxValue) * 100
                              : widthPercent

                            const conversionPercent = prevItem && prevItem.value > 0
                              ? ((item.value / prevItem.value) * 100).toFixed(0)
                              : '100'

                            const offsetPercent = (prevWidthPercent - widthPercent) / 2
                            const constrainedWidth = Math.min(widthPercent, 100)
                            const constrainedOffset = Math.max(0, Math.min(offsetPercent, 50))

                            return (
                              <div key={index} className="relative flex justify-center overflow-hidden" style={{ minHeight: '40px', flex: '1 1 0' }}>
                                <div
                                  className="rounded-md shadow-md transition-all duration-300 flex items-center justify-between px-6 text-white font-medium relative"
                                  style={{
                                    width: `${constrainedWidth}%`,
                                    maxWidth: '100%',
                                    height: '100%',
                                    backgroundColor: item.fill,
                                    minWidth: widthPercent < 3 ? '3%' : 'auto',
                                    marginLeft: index > 0 ? `${constrainedOffset}%` : '0',
                                    marginRight: index > 0 ? `${constrainedOffset}%` : '0',
                                    boxSizing: 'border-box',
                                  }}
                                >
                                  <span className="text-sm font-semibold whitespace-nowrap truncate flex-1">{item.stage}</span>
                                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                                    <span className="text-base font-bold">{item.value}</span>
                                    {index > 0 && (
                                      <span className="text-xs bg-white/20 px-2 py-1 rounded whitespace-nowrap">{conversionPercent}%</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No funnel data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Opportunities Table/Kanban */}
              <div key="opportunitiesTable">
                <Card className="h-full relative group flex flex-col">
                  <div className="drag-handle absolute top-2 right-2 z-20 cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  <CardHeader className="flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Opportunities ({opportunities.length})</CardTitle>
                        <CardDescription>Manage and track all your opportunities</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={viewMode === 'table' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('table')}
                        >
                          <TableIcon className="h-4 w-4 mr-2" />
                          Table
                        </Button>
                        <Button
                          variant={viewMode === 'kanban' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('kanban')}
                        >
                          <LayoutGrid className="h-4 w-4 mr-2" />
                          Kanban
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 overflow-auto">
                    {loading ? (
                      <div className="text-center py-8">Loading...</div>
                    ) : !Array.isArray(opportunities) || opportunities.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No opportunities found. Create your first opportunity to get started.
                      </div>
                    ) : viewMode === 'table' ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('name')}
                            >
                              <div className="flex items-center gap-2">
                                Name
                                {sortColumn === 'name' ? (
                                  sortDirection === 'asc' ? (
                                    <ArrowUp className="h-4 w-4" />
                                  ) : (
                                    <ArrowDown className="h-4 w-4" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('account')}
                            >
                              <div className="flex items-center gap-2">
                                Account
                                {sortColumn === 'account' ? (
                                  sortDirection === 'asc' ? (
                                    <ArrowUp className="h-4 w-4" />
                                  ) : (
                                    <ArrowDown className="h-4 w-4" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('stage')}
                            >
                              <div className="flex items-center gap-2">
                                Stage
                                {sortColumn === 'stage' ? (
                                  sortDirection === 'asc' ? (
                                    <ArrowUp className="h-4 w-4" />
                                  ) : (
                                    <ArrowDown className="h-4 w-4" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('amount')}
                            >
                              <div className="flex items-center gap-2">
                                Amount
                                {sortColumn === 'amount' ? (
                                  sortDirection === 'asc' ? (
                                    <ArrowUp className="h-4 w-4" />
                                  ) : (
                                    <ArrowDown className="h-4 w-4" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('probability')}
                            >
                              <div className="flex items-center gap-2">
                                Probability
                                {sortColumn === 'probability' ? (
                                  sortDirection === 'asc' ? (
                                    <ArrowUp className="h-4 w-4" />
                                  ) : (
                                    <ArrowDown className="h-4 w-4" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('expectedCloseDate')}
                            >
                              <div className="flex items-center gap-2">
                                Close Date
                                {sortColumn === 'expectedCloseDate' ? (
                                  sortDirection === 'asc' ? (
                                    <ArrowUp className="h-4 w-4" />
                                  ) : (
                                    <ArrowDown className="h-4 w-4" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('status')}
                            >
                              <div className="flex items-center gap-2">
                                Status
                                {sortColumn === 'status' ? (
                                  sortDirection === 'asc' ? (
                                    <ArrowUp className="h-4 w-4" />
                                  ) : (
                                    <ArrowDown className="h-4 w-4" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.isArray(opportunities) && opportunities.map((opp) => (
                            <TableRow
                              key={opp.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => router.push(`/sales-dashboard/opportunities/${opp.id}`)}
                            >
                              <TableCell className="font-medium">
                                {opp.name}
                              </TableCell>
                              <TableCell>{opp.account?.name || '-'}</TableCell>
                              <TableCell>
                                <Badge className={getStageColor(opp.stage)}>
                                  {opp.stage.replace(/_/g, ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                ${(parseFloat(opp.amount.toString()) / 1000).toFixed(1)}K
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={opp.probability} className="h-2 w-16" />
                                  <span className="text-sm">{opp.probability}%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {new Date(opp.expectedCloseDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant={opp.status === 'OPEN' ? 'default' : opp.status === 'WON' ? 'default' : 'secondary'}>
                                  {opp.status}
                                </Badge>
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/sales-dashboard/opportunities/${opp.id}`)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="h-full overflow-auto">
                        <div className="flex gap-4 pb-4 overflow-x-auto">
                          {stages.map((stage) => {
                            const stageOpps = opportunities.filter((opp) => opp.stage === stage && opp.status === 'OPEN')
                            const stageValue = stageOpps.reduce(
                              (sum, o) => sum + parseFloat(o.amount.toString()),
                              0
                            )

                            return (
                              <div key={stage} className="flex flex-col min-w-[220px] max-w-[220px]">
                                <div className="mb-2 flex-shrink-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge className={getStageColor(stage)}>
                                      {stage.replace(/_/g, ' ')}
                                    </Badge>
                                    <StageTooltip stage={stage} />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    {stageOpps.length} deals • ${(stageValue / 1000).toFixed(1)}K
                                  </p>
                                </div>
                                <div className="flex-1 space-y-1.5 overflow-y-auto min-h-0">
                                  {stageOpps.length === 0 ? (
                                    <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-md">
                                      No opportunities
                                    </div>
                                  ) : (
                                    stageOpps.map((opp) => (
                                      <Card
                                        key={opp.id}
                                        className="p-2 hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => router.push(`/sales-dashboard/opportunities/${opp.id}`)}
                                      >
                                        <div className="font-medium text-xs mb-1">{opp.name}</div>
                                        {opp.account && (
                                          <div className="text-[10px] text-muted-foreground mb-1">
                                            {opp.account.name}
                                          </div>
                                        )}
                                        <div className="text-sm font-bold mb-1">
                                          ${(parseFloat(opp.amount.toString()) / 1000).toFixed(1)}K
                                        </div>
                                        <div className="flex items-center justify-between mb-1">
                                          <Progress value={opp.probability} className="h-1.5 flex-1 mr-2" />
                                          <span className="text-[10px] text-muted-foreground">
                                            {opp.probability}%
                                          </span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                          {new Date(opp.expectedCloseDate).toLocaleDateString()}
                                        </div>
                                      </Card>
                                    ))
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ResponsiveGridLayout>
          </div>
        )}

        {/* Pipeline Metrics - Now in Grid Layout Above */}
      </div>

      <ColumnMappingDialog
        open={mappingDialogOpen}
        onOpenChange={setMappingDialogOpen}
        columns={fileColumns}
        sampleRows={sampleRows}
        onConfirm={handleMappingConfirm}
        loading={uploading}
        standardFields={OPPORTUNITY_STANDARD_FIELDS}
      />

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Opportunities from Excel/CSV</DialogTitle>
            <DialogDescription>
              Upload multiple opportunities at once. Required: Name, Expected Close Date.
              Optional: Account Name, Stage, Amount, Probability, Type, Lead Source, Next Step, Description, Competitor Info.
            </DialogDescription>
          </DialogHeader>
          {!uploadResults ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold">Upload File</h4>
                  <p className="text-xs text-muted-foreground">Select an Excel or CSV file</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <Label htmlFor="file-upload-opportunity" className="cursor-pointer">
                  <span className="text-sm font-medium text-blue-600 hover:text-blue-700">Click to select a file</span>
                  <span className="text-sm text-muted-foreground ml-2">or drag and drop</span>
                </Label>
                <Input id="file-upload-opportunity" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }} disabled={uploading} />
                <p className="text-xs text-muted-foreground mt-2">CSV, XLS, or XLSX files only</p>
              </div>
              {uploading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                  <span className="text-sm text-muted-foreground">Processing file...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className={`rounded-lg p-4 ${uploadResults.success ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'}`}>
                <h4 className={`font-semibold mb-1 ${uploadResults.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                  {uploadResults.success ? 'Upload Complete' : 'Upload Failed'}
                </h4>
                {uploadResults.summary && (
                  <div className="text-sm space-y-1">
                    <p>Total: {uploadResults.summary.total}</p>
                    <p className="text-green-700 dark:text-green-300">✓ Successful: {uploadResults.summary.successful}</p>
                    {uploadResults.summary.failed > 0 && <p className="text-red-700 dark:text-red-300">✗ Failed: {uploadResults.summary.failed}</p>}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => { setUploadDialogOpen(false); setUploadResults(null) }}>Close</Button>
                <Button onClick={() => setUploadResults(null)}>Upload Another File</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SalesPageLayout>
  )
}

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading opportunities...</div>
      </div>
    }>
      <OpportunitiesInner />
    </Suspense>
  )
}
