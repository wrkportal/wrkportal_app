'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout'
import { GripVertical } from 'lucide-react'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserPlus, Search, Filter, Plus, Eye, Edit, Trash2, CheckCircle2, CheckCircle, Circle, TrendingUp, Users, Target, Clock, Bell, BellOff, Settings, Upload, FileSpreadsheet, Loader2, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { LeadScoringConfigDialog } from '@/components/sales/lead-scoring-config-dialog'
import { ColumnMappingDialog } from '@/components/sales/lead-column-mapping-dialog'
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

const ResponsiveGridLayout = WidthProvider(Responsive)

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  company: string | null
  phone: string | null
  leadSource: string
  status: string
  rating: string
  score: number
  description?: string | null
  customFields?: Record<string, any> | null
  assignedTo: {
    id: string
    name: string | null
    email: string
  } | null
  createdAt: string
}

const leadStages = [
  { id: 'NEW', label: 'New', icon: Circle },
  { id: 'CONTACTED', label: 'Contacted', icon: Circle },
  { id: 'QUALIFIED', label: 'Qualified', icon: CheckCircle },
  { id: 'CONVERTED', label: 'Converted', icon: CheckCircle },
]

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a28dff']

function LeadsInner() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const searchParams = useSearchParams()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: '',
  })
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [watchedLeads, setWatchedLeads] = useState<Set<string>>(new Set())
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null)
  const [scoringConfigOpen, setScoringConfigOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<any>(null)
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false)
  const [fileColumns, setFileColumns] = useState<string[]>([])
  const [sampleRows, setSampleRows] = useState<Record<string, any>[]>([])
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [analytics, setAnalytics] = useState({
    totalLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
    avgScore: 0,
    leadsByStatus: [] as any[],
    leadsBySource: [] as any[],
    leadsByRating: [] as any[],
    funnelData: [] as any[],
  })
  const [opportunities, setOpportunities] = useState<any[]>([])

  // Fix overlapping layouts by moving widgets down
  const fixOverlappingLayouts = (layout: Layout[]): Layout[] => {
    if (!layout || layout.length === 0) return layout

    const fixed = layout.map(item => ({ ...item }))
    let hasOverlaps = true
    let iterations = 0
    const maxIterations = 50 // Prevent infinite loops

    // Keep fixing overlaps until none remain
    while (hasOverlaps && iterations < maxIterations) {
      hasOverlaps = false
      iterations++

      // Sort by y position, then by x position to process from top-left to bottom-right
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

          // Check if widgets overlap (with a small tolerance to avoid edge cases)
          const tolerance = 0.1
          const overlapsX = current.x < otherRight - tolerance && currentRight > other.x + tolerance
          const overlapsY = current.y < otherBottom - tolerance && currentBottom > other.y + tolerance

          if (overlapsX && overlapsY) {
            hasOverlaps = true
            // Move the widget that appears later in the sorted list (lower or more to the right) down
            // Use currentBottom to ensure proper spacing - this is resize-aware
            fixed[otherIndex] = {
              ...other,
              y: currentBottom
            }
            // Update the sorted array reference
            sorted[j] = fixed[otherIndex]
            break // Restart check for this widget
          }
        }
      }
    }

    return fixed
  }

  const [mounted, setMounted] = useState(false)
  const [layouts, setLayouts] = useState<Layouts>(() => {
    // Initialize with empty layout on server to prevent hydration mismatch
    // Will be populated on client mount
    if (typeof window === 'undefined') {
      return { lg: [], md: [], sm: [], xs: [] }
    }
    // Initialize with default layout - will be replaced by getInitialLayout
    const defaultLayout: Layout[] = [
      { i: 'totalLeads', x: 0, y: 0, w: 3, h: 2, minW: 1, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'qualifiedLeads', x: 3, y: 0, w: 3, h: 2, minW: 1, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'conversionRate', x: 6, y: 0, w: 3, h: 2, minW: 1, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'avgScore', x: 9, y: 0, w: 3, h: 2, minW: 1, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'leadsByStatus', x: 0, y: 2, w: 4, h: 5, minW: 2, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'leadsBySource', x: 4, y: 2, w: 4, h: 5, minW: 2, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'leadsByRating', x: 8, y: 2, w: 4, h: 5, minW: 2, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'conversionTrend', x: 0, y: 7, w: 12, h: 5, minW: 3, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'funnelChart', x: 0, y: 12, w: 6, h: 6, minW: 2, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'leadsTable', x: 6, y: 12, w: 6, h: 8, minW: 3, minH: 3, maxW: 12, maxH: Infinity },
    ]
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('leads-page-layout')
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
          // Validate that we have all required widgets
          const requiredWidgetIds = defaultLayout.map(item => item.i)
          const hasAllWidgets = requiredWidgetIds.every(id =>
            sanitizedLayouts.lg.some(item => item.i === id)
          )
          if (hasAllWidgets && sanitizedLayouts.lg.length > 0) {
            // Fix any overlapping layouts
            const fixedLayouts: Layouts = {
              lg: fixOverlappingLayouts(sanitizedLayouts.lg),
              md: fixOverlappingLayouts(sanitizedLayouts.md),
              sm: fixOverlappingLayouts(sanitizedLayouts.sm),
              xs: fixOverlappingLayouts(sanitizedLayouts.xs),
            }
            // Save the fixed layout back to localStorage
            try {
              localStorage.setItem('leads-page-layout', JSON.stringify(fixedLayouts))
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
    return { lg: defaultLayout, md: defaultLayout, sm: defaultLayout, xs: defaultLayout }
  })
  const isDraggingRef = useRef(false)
  const isResizingRef = useRef(false)
  const [isResizing, setIsResizing] = useState(false)

  const [formData, setFormData] = useState({
    leadName: '',
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    mobile: '',
    title: '',
    industry: '',
    leadSource: 'OTHER',
    status: 'NEW',
    rating: 'COLD',
    description: '',
    assignedToId: '',
    expectedRevenue: '',
    location: '',
    linkedContactId: '', // Store the linked contact ID
  })
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])
  const [filteredContacts, setFilteredContacts] = useState<any[]>([])
  const [showContactSuggestions, setShowContactSuggestions] = useState(false)
  const firstNameInputRef = useRef<HTMLInputElement>(null)
  const contactSuggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUsers()
    fetchContacts()
    fetchOpportunities()
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [statusFilter, searchTerm, dateFilter.startDate, dateFilter.endDate, sortColumn, sortDirection])

  useEffect(() => {
    if (leads.length > 0 && opportunities.length > 0) {
      calculateAnalytics()
    }
  }, [leads, opportunities])

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/sales/contacts')
      if (response.ok) {
        const data = await response.json()
        setContacts(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }

  // Handle contact autocomplete when typing in firstName
  const handleFirstNameChange = (value: string) => {
    setFormData({ ...formData, firstName: value })

    if (value.trim().length > 0) {
      const filtered = contacts.filter(contact => {
        const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase()
        const email = contact.email?.toLowerCase() || ''
        const searchTerm = value.toLowerCase()
        return fullName.includes(searchTerm) || email.includes(searchTerm)
      })
      setFilteredContacts(filtered)
      setShowContactSuggestions(filtered.length > 0)
    } else {
      setFilteredContacts([])
      setShowContactSuggestions(false)
    }
  }

  // Select a contact and populate form fields
  const selectContact = (contact: any) => {
    setFormData({
      ...formData,
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      phone: contact.phone || '',
      mobile: contact.mobile || '',
      company: contact.account?.name || '',
      linkedContactId: contact.id,
    })
    setShowContactSuggestions(false)
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        firstNameInputRef.current &&
        contactSuggestionsRef.current &&
        !firstNameInputRef.current.contains(event.target as Node) &&
        !contactSuggestionsRef.current.contains(event.target as Node)
      ) {
        setShowContactSuggestions(false)
      }
    }

    if (showContactSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showContactSuggestions])

  // Open dialog if create parameter is present
  useEffect(() => {
    if (searchParams?.get('create') === 'true') {
      setIsDialogOpen(true)
    }
  }, [searchParams])

  // Load watched leads from localStorage on mount and fix any overlapping layouts
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('watchedLeads')
    if (stored) {
      try {
        setWatchedLeads(new Set(JSON.parse(stored)))
      } catch (e) {
        console.error('Error loading watched leads:', e)
      }
    }
    // Load layout on client mount to prevent hydration mismatch
    const initialLayout = getInitialLayout()
    setLayouts(initialLayout)
    // Fix any overlapping layouts on mount
    setLayouts(prevLayouts => {
      const fixedLayouts: Layouts = {
        lg: fixOverlappingLayouts(prevLayouts.lg),
        md: fixOverlappingLayouts(prevLayouts.md),
        sm: fixOverlappingLayouts(prevLayouts.sm),
        xs: fixOverlappingLayouts(prevLayouts.xs),
      }
      // Save fixed layouts back to localStorage
      try {
        localStorage.setItem('leads-page-layout', JSON.stringify(fixedLayouts))
      } catch (e) {
        console.error('Error saving fixed layout:', e)
      }
      return fixedLayouts
    })
  }, [])

  // Update minH and minW constraints for chart widgets to allow smaller resizing
  const updateLayoutConstraints = (layout: Layout[]): Layout[] => {
    const chartWidgets = ['leadsByStatus', 'leadsBySource', 'leadsByRating', 'funnelChart']
    const metricCards = ['totalLeads', 'qualifiedLeads', 'conversionRate', 'avgScore']
    return layout.map(item => {
      if (metricCards.includes(item.i)) {
        return {
          ...item,
          minH: Math.min(item.minH ?? 2, 2), // Force minH to 2 for metric cards
          minW: Math.min(item.minW ?? 1, 1), // Force minW to 1 for metric cards (allow very narrow width)
          maxW: item.maxW ?? 12,
          maxH: item.maxH ?? Infinity,
        }
      }
      if (chartWidgets.includes(item.i)) {
        return {
          ...item,
          minH: Math.min(item.minH ?? 2, 2), // Force minH to 2 for charts
          minW: Math.min(item.minW ?? 2, 2), // Force minW to 2 for charts (allow narrow width)
          maxW: item.maxW ?? 12,
          maxH: item.maxH ?? Infinity,
        }
      }
      if (item.i === 'conversionTrend') {
        return {
          ...item,
          minH: Math.min(item.minH ?? 2, 2), // Force minH to 2
          minW: Math.min(item.minW ?? 3, 3), // Force minW to 3 for trend chart (needs more width)
          maxW: item.maxW ?? 12,
          maxH: item.maxH ?? Infinity,
        }
      }
      if (item.i === 'leadsTable') {
        return {
          ...item,
          minH: Math.min(item.minH ?? 3, 3), // Force minH to 3 for table
          minW: Math.min(item.minW ?? 3, 3), // Force minW to 3 for table
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

  // Initialize default layout
  const initializeDefaultLayout = (): Layouts => {
    const defaultLayout: Layout[] = [
      { i: 'totalLeads', x: 0, y: 0, w: 3, h: 2, minW: 1, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'qualifiedLeads', x: 3, y: 0, w: 3, h: 2, minW: 1, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'conversionRate', x: 6, y: 0, w: 3, h: 2, minW: 1, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'avgScore', x: 9, y: 0, w: 3, h: 2, minW: 1, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'leadsByStatus', x: 0, y: 2, w: 4, h: 5, minW: 2, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'leadsBySource', x: 4, y: 2, w: 4, h: 5, minW: 2, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'leadsByRating', x: 8, y: 2, w: 4, h: 5, minW: 2, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'conversionTrend', x: 0, y: 7, w: 12, h: 5, minW: 3, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'funnelChart', x: 0, y: 12, w: 6, h: 6, minW: 2, minH: 2, maxW: 12, maxH: Infinity },
      { i: 'leadsTable', x: 6, y: 12, w: 6, h: 8, minW: 3, minH: 3, maxW: 12, maxH: Infinity },
    ]
    return { lg: defaultLayout, md: defaultLayout, sm: defaultLayout, xs: defaultLayout }
  }

  // Initialize layout state from localStorage or default
  const getInitialLayout = (): Layouts => {
    if (typeof window === 'undefined') {
      return initializeDefaultLayout()
    }
    try {
      const saved = localStorage.getItem('leads-page-layout')
      if (saved) {
        const parsedLayouts = JSON.parse(saved)
        const sanitizedLayouts: Layouts = {
          lg: (parsedLayouts.lg || []).filter((item: any): item is Layout =>
            item && typeof item === 'object' && typeof item.y === 'number' && typeof item.x === 'number'
          ),
          md: (parsedLayouts.md || []).filter((item: any): item is Layout =>
            item && typeof item === 'object' && typeof item.y === 'number' && typeof item.x === 'number'
          ),
          sm: (parsedLayouts.sm || []).filter((item: any): item is Layout =>
            item && typeof item === 'object' && typeof item.y === 'number' && typeof item.x === 'number'
          ),
          xs: (parsedLayouts.xs || []).filter((item: any): item is Layout =>
            item && typeof item === 'object' && typeof item.y === 'number' && typeof item.x === 'number'
          ),
        }
        // Validate that we have all required widgets
        const defaultLayout = initializeDefaultLayout()
        const requiredWidgetIds = defaultLayout.lg.map(item => item.i)
        const hasAllWidgets = requiredWidgetIds.every(id =>
          sanitizedLayouts.lg.some(item => item.i === id)
        )
        if (hasAllWidgets && sanitizedLayouts.lg.length > 0) {
          // Update constraints to ensure charts can resize smaller
          const layoutsWithUpdatedConstraints: Layouts = {
            lg: updateLayoutConstraints(sanitizedLayouts.lg),
            md: updateLayoutConstraints(sanitizedLayouts.md),
            sm: updateLayoutConstraints(sanitizedLayouts.sm),
            xs: updateLayoutConstraints(sanitizedLayouts.xs),
          }
          // Fix any overlapping layouts
          const fixedLayouts: Layouts = {
            lg: fixOverlappingLayouts(layoutsWithUpdatedConstraints.lg),
            md: fixOverlappingLayouts(layoutsWithUpdatedConstraints.md),
            sm: fixOverlappingLayouts(layoutsWithUpdatedConstraints.sm),
            xs: fixOverlappingLayouts(layoutsWithUpdatedConstraints.xs),
          }
          // Save the fixed layout back to localStorage
          try {
            localStorage.setItem('leads-page-layout', JSON.stringify(fixedLayouts))
          } catch (e) {
            console.error('Error saving fixed layout:', e)
          }
          return fixedLayouts
        }
      }
    } catch (error) {
      console.error('Error loading layout:', error)
    }
    return initializeDefaultLayout()
  }

  // Load saved layout from localStorage (for updates after initial load)
  const loadSavedLayout = () => {
    const initialLayout = getInitialLayout()
    setLayouts(initialLayout)
  }

  // Save layout to localStorage
  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    const sanitizedLayouts: Layouts = {
      lg: (allLayouts.lg || []).filter((item): item is Layout => item && typeof item.y === 'number'),
      md: (allLayouts.md || []).filter((item): item is Layout => item && typeof item.y === 'number'),
      sm: (allLayouts.sm || []).filter((item): item is Layout => item && typeof item.y === 'number'),
      xs: (allLayouts.xs || []).filter((item): item is Layout => item && typeof item.y === 'number'),
    }

    // Update constraints to ensure charts can resize smaller and preserve max constraints
    const layoutsWithConstraints: Layouts = {
      lg: updateLayoutConstraints(sanitizedLayouts.lg),
      md: updateLayoutConstraints(sanitizedLayouts.md),
      sm: updateLayoutConstraints(sanitizedLayouts.sm),
      xs: updateLayoutConstraints(sanitizedLayouts.xs),
    }

    // Fix any overlapping layouts before saving
    const fixedLayouts: Layouts = {
      lg: fixOverlappingLayouts(layoutsWithConstraints.lg),
      md: fixOverlappingLayouts(layoutsWithConstraints.md),
      sm: fixOverlappingLayouts(layoutsWithConstraints.sm),
      xs: fixOverlappingLayouts(layoutsWithConstraints.xs),
    }

    setLayouts(fixedLayouts)
    try {
      localStorage.setItem('leads-page-layout', JSON.stringify(fixedLayouts))
    } catch (error) {
      console.error('Error saving layout:', error)
    }
  }

  const toggleWatchLead = (leadId: string) => {
    setWatchedLeads(prev => {
      const newSet = new Set(prev)
      if (newSet.has(leadId)) {
        newSet.delete(leadId)
      } else {
        newSet.add(leadId)
      }
      // Save to localStorage
      localStorage.setItem('watchedLeads', JSON.stringify(Array.from(newSet)))
      return newSet
    })
  }

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await fetch('/api/users/onboarded')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchOpportunities = async () => {
    try {
      const response = await fetch('/api/sales/opportunities?status=OPEN')
      if (response.ok) {
        const data = await response.json()
        setOpportunities(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error)
      setOpportunities([])
    }
  }

  const calculateAnalytics = () => {
    const total = leads.length
    const newLeads = leads.filter(l => l.status === 'NEW').length
    const qualified = leads.filter(l => l.status === 'QUALIFIED').length
    const converted = leads.filter(l => l.status === 'CONVERTED').length
    const conversionRate = total > 0 ? (converted / total) * 100 : 0
    const avgScore = total > 0 ? leads.reduce((sum, l) => sum + l.score, 0) / total : 0

    // Leads by status
    const statusCounts: Record<string, number> = {}
    leads.forEach(lead => {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1
    })
    const leadsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
    }))

    // Leads by source
    const sourceCounts: Record<string, number> = {}
    leads.forEach(lead => {
      sourceCounts[lead.leadSource] = (sourceCounts[lead.leadSource] || 0) + 1
    })
    const leadsBySource = Object.entries(sourceCounts).map(([source, count]) => ({
      name: source,
      value: count,
    }))

    // Leads by rating
    const ratingCounts: Record<string, number> = {}
    leads.forEach(lead => {
      ratingCounts[lead.rating] = (ratingCounts[lead.rating] || 0) + 1
    })
    const leadsByRating = Object.entries(ratingCounts).map(([rating, count]) => ({
      name: rating,
      value: count,
    }))

    // Calculate funnel data: Only Lead stages (New -> Contacted -> Qualified -> Converted)
    // Each stage should include all leads that have reached at least that stage
    // This creates a proper funnel where: New >= Contacted >= Qualified >= Converted

    // New: All leads (total)
    const newLeadsCount = total

    // Contacted: Leads that are CONTACTED, QUALIFIED, or CONVERTED (have been contacted)
    const contactedLeadsCount = leads.filter(l =>
      l.status === 'CONTACTED' || l.status === 'QUALIFIED' || l.status === 'CONVERTED'
    ).length

    // Qualified: Leads that are QUALIFIED or CONVERTED (have been qualified)
    const qualifiedLeadsCount = leads.filter(l =>
      l.status === 'QUALIFIED' || l.status === 'CONVERTED'
    ).length

    // Converted: Only leads that are CONVERTED
    const convertedLeadsCount = converted

    // Build funnel in correct order: New -> Contacted -> Qualified -> Converted
    const funnelData = [
      { stage: 'New', value: newLeadsCount, fill: '#8884d8' },
      { stage: 'Contacted', value: contactedLeadsCount, fill: '#82ca9d' },
      { stage: 'Qualified', value: qualifiedLeadsCount, fill: '#ffc658' },
      { stage: 'Converted', value: convertedLeadsCount, fill: '#ff8042' },
    ]

    setAnalytics({
      totalLeads: total,
      newLeads,
      qualifiedLeads: qualified,
      convertedLeads: converted,
      conversionRate,
      avgScore,
      leadsByStatus,
      leadsBySource,
      leadsByRating,
      funnelData,
    })
  }

  // Generate leads trend data for the conversion trend chart
  const generateLeadsTrend = (leads: Lead[]) => {
    const months = 6
    const data = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' })

      const monthLeads = leads.filter((lead) => {
        const createdDate = new Date(lead.createdAt)
        return createdDate.getMonth() === date.getMonth() && createdDate.getFullYear() === date.getFullYear()
      })

      const newCount = monthLeads.filter((l) => l.status === 'NEW').length
      const convertedCount = monthLeads.filter((l) => l.status === 'CONVERTED').length

      data.push({ month: monthKey, new: newCount, converted: convertedCount })
    }

    return data
  }

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter.length > 0) {
        statusFilter.forEach(status => {
          params.append('status', status)
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

      const response = await fetch(`/api/sales/leads?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch leads' }))
        console.error('Error fetching leads:', errorData)
        setLeads([])
        return
      }

      const data = await response.json()
      let leadsData = Array.isArray(data) ? data : []

      // Apply sorting
      if (sortColumn) {
        leadsData = [...leadsData].sort((a, b) => {
          let aValue: any
          let bValue: any

          switch (sortColumn) {
            case 'name':
              aValue = `${a.firstName} ${a.lastName}`.toLowerCase()
              bValue = `${b.firstName} ${b.lastName}`.toLowerCase()
              break
            case 'company':
              aValue = (a.company || '').toLowerCase()
              bValue = (b.company || '').toLowerCase()
              break
            case 'email':
              aValue = a.email.toLowerCase()
              bValue = b.email.toLowerCase()
              break
            case 'source':
              aValue = a.leadSource.toLowerCase()
              bValue = b.leadSource.toLowerCase()
              break
            case 'status':
              aValue = a.status.toLowerCase()
              bValue = b.status.toLowerCase()
              break
            case 'rating':
              aValue = a.rating.toLowerCase()
              bValue = b.rating.toLowerCase()
              break
            case 'score':
              aValue = a.score
              bValue = b.score
              break
            case 'assignedTo':
              aValue = (a.assignedTo?.name || a.assignedTo?.email || 'zzz').toLowerCase()
              bValue = (b.assignedTo?.name || b.assignedTo?.email || 'zzz').toLowerCase()
              break
            case 'createdAt':
              aValue = new Date(a.createdAt).getTime()
              bValue = new Date(b.createdAt).getTime()
              break
            default:
              return 0
          }

          if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
          if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
          return 0
        })
      }

      setLeads(leadsData)
    } catch (error) {
      console.error('Error fetching leads:', error)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchLeads()
  }

  const handleFileSelect = async (file: File) => {
    try {
      setUploading(true)

      // First, preview the file to get columns
      const previewFormData = new FormData()
      previewFormData.append('file', file)

      const previewResponse = await fetch('/api/sales/leads/upload/preview', {
        method: 'POST',
        body: previewFormData,
      })

      const previewResult = await previewResponse.json()

      if (previewResponse.ok && previewResult.success) {
        setFileColumns(previewResult.columns)
        setSampleRows(previewResult.sampleRows || [])
        setPendingFile(file)
        setMappingDialogOpen(true)
        setUploadDialogOpen(false) // Close upload dialog, open mapping dialog
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

      const response = await fetch('/api/sales/leads/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setUploadResults(result)
        // Refresh leads list
        fetchLeads()
        // Reset state
        setPendingFile(null)
        setFileColumns([])
        setSampleRows([])
        setColumnMapping({})
      } else {
        setUploadResults({
          success: false,
          error: result.error || 'Failed to upload leads',
          summary: { total: 0, successful: 0, failed: 1, duplicates: 0 },
        })
      }
    } catch (error: any) {
      console.error('Error uploading file:', error)
      setUploadResults({
        success: false,
        error: error.message || 'Failed to upload leads',
        summary: { total: 0, successful: 0, failed: 1, duplicates: 0 },
      })
    } finally {
      setUploading(false)
      setUploadDialogOpen(true) // Reopen upload dialog to show results
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/sales/leads/template')
      if (!response.ok) {
        throw new Error('Failed to download template')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'lead-upload-template.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Error downloading template:', error)
      alert('Failed to download template. Please try again.')
    }
  }

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Include linked contact ID in description if a contact was selected
      let description = formData.description || ''
      if (formData.linkedContactId) {
        const linkedContactNote = `\n\n[Linked to Contact ID: ${formData.linkedContactId}]`
        description = description ? `${description}${linkedContactNote}` : linkedContactNote.trim()
      }

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        company: formData.company || undefined,
        phone: formData.phone || undefined,
        mobile: formData.mobile || undefined,
        title: formData.title || undefined,
        industry: formData.industry || undefined,
        leadSource: formData.leadSource,
        status: formData.status,
        rating: formData.rating,
        description: description || undefined,
        assignedToId: formData.assignedToId || undefined,
        expectedRevenue: formData.expectedRevenue ? parseFloat(formData.expectedRevenue) : undefined,
        location: formData.location || undefined,
      }

      const response = await fetch('/api/sales/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        setFormData({
          leadName: '',
          firstName: '',
          lastName: '',
          email: '',
          company: '',
          phone: '',
          mobile: '',
          title: '',
          industry: '',
          leadSource: 'OTHER',
          status: 'NEW',
          rating: 'COLD',
          description: '',
          assignedToId: '',
          expectedRevenue: '',
          location: '',
          linkedContactId: '',
        })
        setShowContactSuggestions(false)
        setFilteredContacts([])
        fetchLeads()
      }
    } catch (error) {
      console.error('Error creating lead:', error)
    }
  }

  const handleConvertLead = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId)
    if (!lead) {
      alert('Lead not found')
      return
    }

    if (lead.status === 'CONVERTED') {
      alert('This lead has already been converted')
      return
    }

    // Confirm conversion
    const confirmed = window.confirm(
      `Convert "${lead.firstName} ${lead.lastName}" to a Contact and Opportunity?`
    )
    if (!confirmed) return

    setConvertingLeadId(leadId)
    try {
      const response = await fetch(`/api/sales/leads/${leadId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          convertTo: 'both',
          opportunityData: {
            name: `${lead.firstName} ${lead.lastName} - Opportunity`,
            amount: 0, // Expected revenue is not stored in the lead schema, using default
            probability: 10,
            expectedCloseDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            description: lead.description || `Converted from lead: ${lead.firstName} ${lead.lastName}`,
          },
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ Lead converted successfully!\n\nContact and Opportunity have been created.`)
        // Refresh leads list to show updated status
        await fetchLeads()
      } else {
        const errorMsg = data.error || 'Unknown error'
        const details = data.details ? `\n\nDetails: ${data.details}` : ''
        alert(`❌ Failed to convert lead: ${errorMsg}${details}`)
        console.error('Convert lead error:', data)
      }
    } catch (error) {
      console.error('Error converting lead:', error)
      alert('❌ An error occurred while converting the lead. Please try again.')
    } finally {
      setConvertingLeadId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      NEW: 'default',
      CONTACTED: 'secondary',
      QUALIFIED: 'default',
      CONVERTED: 'success',
      UNQUALIFIED: 'destructive',
      NURTURING: 'outline',
    }
    return <Badge variant={variants[status] as any}>{status}</Badge>
  }

  const getRatingBadge = (rating: string) => {
    const colors: Record<string, string> = {
      HOT: 'bg-red-100 text-red-800',
      WARM: 'bg-orange-100 text-orange-800',
      COLD: 'bg-blue-100 text-blue-800',
    }
    return <Badge className={colors[rating]}>{rating}</Badge>
  }

  const getCurrentStageIndex = (status: string) => {
    return leadStages.findIndex(stage => stage.id === status)
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column and default to ascending
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(prev => {
      if (status === 'all') {
        return []
      }
      if (prev.includes(status)) {
        return prev.filter(s => s !== status)
      } else {
        return [...prev, status]
      }
    })
  }

  return (
    <SalesPageLayout>
      <div className="space-y-6">
        {/* Header with Title, Search and Create Button */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Lead Management</h2>
            <p className="text-muted-foreground mt-1">Capture, score, and convert leads into opportunities</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 relative min-w-[300px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads, custom fields..."
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
                    {['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'UNQUALIFIED', 'NURTURING'].map((status) => (
                      <div
                        key={status}
                        className="flex items-center space-x-2 p-2 rounded-sm hover:bg-accent cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusFilterChange(status)
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
            </div>
            <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Leads
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Lead</DialogTitle>
                  <DialogDescription>
                    Capture a new lead from web forms, emails, ads, or events
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateLead} className="space-y-6">
                  {/* Lead Details Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Lead Details</h3>
                    <div>
                      <Label htmlFor="leadName">Lead Name</Label>
                      <Input
                        id="leadName"
                        value={formData.leadName}
                        onChange={(e) => setFormData({ ...formData, leadName: e.target.value })}
                        placeholder="Enter lead name or identifier"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        placeholder="e.g., Technology, Healthcare, Finance"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expectedRevenue">Expected Revenue / Deal Size</Label>
                      <Input
                        id="expectedRevenue"
                        type="number"
                        step="0.01"
                        value={formData.expectedRevenue}
                        onChange={(e) => setFormData({ ...formData, expectedRevenue: e.target.value })}
                        placeholder="Enter expected revenue amount"
                      />
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          ref={firstNameInputRef}
                          value={formData.firstName}
                          onChange={(e) => handleFirstNameChange(e.target.value)}
                          onFocus={() => {
                            if (formData.firstName.trim().length > 0) {
                              handleFirstNameChange(formData.firstName)
                            }
                          }}
                          required
                          placeholder="Enter first name or search contacts"
                        />
                        {showContactSuggestions && filteredContacts.length > 0 && (
                          <div ref={contactSuggestionsRef} className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                            <div className="p-2 text-xs text-muted-foreground font-semibold border-b">
                              Select existing contact
                            </div>
                            {filteredContacts.map((contact) => (
                              <div
                                key={contact.id}
                                className="px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                                onClick={() => selectContact(contact)}
                              >
                                <div className="font-medium">
                                  {contact.firstName} {contact.lastName}
                                </div>
                                {contact.email && (
                                  <div className="text-xs text-muted-foreground">{contact.email}</div>
                                )}
                                {contact.account?.name && (
                                  <div className="text-xs text-muted-foreground">{contact.account.name}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          required
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mobile">Mobile</Label>
                        <Input
                          id="mobile"
                          type="tel"
                          value={formData.mobile}
                          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                          placeholder="Enter mobile number"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Enter city, state, or country"
                      />
                    </div>
                  </div>

                  {/* Additional Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Additional Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="leadSource">Lead Source *</Label>
                        <Select
                          value={formData.leadSource}
                          onValueChange={(value) => setFormData({ ...formData, leadSource: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select lead source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WEB_FORM">Web Form</SelectItem>
                            <SelectItem value="EMAIL">Email</SelectItem>
                            <SelectItem value="PHONE">Phone</SelectItem>
                            <SelectItem value="ADVERTISING">Advertising</SelectItem>
                            <SelectItem value="EVENT">Event</SelectItem>
                            <SelectItem value="REFERRAL">Referral</SelectItem>
                            <SelectItem value="PARTNER">Partner</SelectItem>
                            <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
                            <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NEW">New</SelectItem>
                            <SelectItem value="CONTACTED">Contacted</SelectItem>
                            <SelectItem value="QUALIFIED">Qualified</SelectItem>
                            <SelectItem value="UNQUALIFIED">Unqualified</SelectItem>
                            <SelectItem value="NURTURING">Nurturing</SelectItem>
                            <SelectItem value="CONVERTED">Converted</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="rating">Rating</Label>
                        <Select
                          value={formData.rating}
                          onValueChange={(value) => setFormData({ ...formData, rating: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HOT">Hot</SelectItem>
                            <SelectItem value="WARM">Warm</SelectItem>
                            <SelectItem value="COLD">Cold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="assignedToId">Assign To</Label>
                        <Select
                          value={formData.assignedToId || undefined}
                          onValueChange={(value) => setFormData({ ...formData, assignedToId: value === 'unassigned' ? '' : value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select user"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName && user.lastName
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.name || user.email} {user.email && `(${user.email})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        placeholder="Enter additional notes or information about the lead"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Lead</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Workflow View - Only show when lead is selected */}
        {selectedLead && (
          <Card>
            <CardHeader>
              <CardTitle>Lead Workflow</CardTitle>
              <CardDescription>
                Current stage for: {selectedLead.firstName} {selectedLead.lastName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between relative">
                {leadStages.map((stage, index) => {
                  const Icon = stage.icon
                  const currentIndex = getCurrentStageIndex(selectedLead.status)
                  const isActive = index <= currentIndex
                  const isCurrent = index === currentIndex

                  return (
                    <div key={stage.id} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1 relative">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${isActive
                            ? isCurrent
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-green-600 border-green-600 text-white'
                            : 'bg-gray-100 border-gray-300 text-gray-400'
                            }`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="mt-2 text-sm font-medium text-center">
                          {stage.label}
                        </div>
                        {isCurrent && (
                          <Badge className="mt-1" variant="default">
                            Current
                          </Badge>
                        )}
                      </div>
                      {index < leadStages.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-2 ${index < currentIndex ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Draggable Grid Layout */}
        {!mounted ? (
          <div style={{ minHeight: '800px' }} className="leads-page-grid">
            <div className="text-center py-8 text-muted-foreground">Loading layout...</div>
          </div>
        ) : (
          <div style={{ minHeight: '800px' }} className="leads-page-grid">
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={60}
              onLayoutChange={(currentLayout, allLayouts) => {
                // Don't fix overlaps during resize - only during drag
                if (!isResizingRef.current) {
                  handleLayoutChange(currentLayout, allLayouts)
                }
              }}
              onDragStart={() => {
                isDraggingRef.current = true
              }}
              onDragStop={() => {
                isDraggingRef.current = false
              }}
              onResizeStart={() => {
                isResizingRef.current = true
                setIsResizing(true)
              }}
              onResize={(layout, oldItem, newItem, placeholder, e, element) => {
                // Update layout during resize without fixing overlaps (allow temporary overlaps)
                // Ensure constraints are updated (especially minH for charts)
                const layoutWithConstraints = updateLayoutConstraints(layout)
                setLayouts(prev => ({ ...prev, lg: layoutWithConstraints }))
              }}
              onResizeStop={(layout, oldItem, newItem, placeholder, e, element) => {
                isResizingRef.current = false
                setIsResizing(false)
                // Fix overlaps after resize is complete
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
              {/* Total Leads Card */}
              <div key="totalLeads">
                <Card className="h-full relative group">
                  <div className="drag-handle absolute top-2 right-2 z-20 cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalLeads}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analytics.newLeads} new leads
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Qualified Leads Card */}
              <div key="qualifiedLeads">
                <Card className="h-full relative group">
                  <div className="drag-handle absolute top-2 right-2 z-20 cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.qualifiedLeads}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analytics.totalLeads > 0
                        ? `${((analytics.qualifiedLeads / analytics.totalLeads) * 100).toFixed(1)}% of total`
                        : '0% of total'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Conversion Rate Card */}
              <div key="conversionRate">
                <Card className="h-full relative group">
                  <div className="drag-handle absolute top-2 right-2 z-20 cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</div>
                    <Progress value={analytics.conversionRate} className="mt-2" />
                  </CardContent>
                </Card>
              </div>

              {/* Average Score Card */}
              <div key="avgScore">
                <Card className="h-full relative group">
                  <div className="drag-handle absolute top-2 right-2 z-20 cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setScoringConfigOpen(true)}
                        title="Configure scoring"
                      >
                        <Settings className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.avgScore.toFixed(0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Lead quality score</p>
                  </CardContent>
                </Card>
              </div>

              {/* Leads by Status Chart */}
              <div key="leadsByStatus">
                <Card className="h-full relative group flex flex-col">
                  {/* Drag handle - always visible for charts */}
                  <div className="drag-handle absolute top-2 right-2 z-[100] cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md" style={{ pointerEvents: 'auto' }}>
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  {/* Invisible drag area in top-right corner to ensure it's always accessible */}
                  <div className="absolute top-0 right-0 w-16 h-16 z-[99] cursor-move" style={{ pointerEvents: 'auto' }} />
                  <CardHeader className="flex-shrink-0">
                    <CardTitle>Leads by Status</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 p-4">
                    <div style={{ pointerEvents: 'auto' }} className="h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.leadsByStatus}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius="70%"
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analytics.leadsByStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Leads by Source Chart */}
              <div key="leadsBySource">
                <Card className="h-full relative group flex flex-col">
                  <div className="drag-handle absolute top-2 right-2 z-20 cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  <CardHeader className="flex-shrink-0">
                    <CardTitle>Leads by Source</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.leadsBySource}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Leads by Rating Chart */}
              <div key="leadsByRating">
                <Card className="h-full relative group flex flex-col">
                  <div className="drag-handle absolute top-2 right-2 z-20 cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  <CardHeader className="flex-shrink-0">
                    <CardTitle>Leads by Rating</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.leadsByRating}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius="70%"
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytics.leadsByRating.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Lead Conversion Trend Chart */}
              <div key="conversionTrend">
                <Card className="h-full relative group flex flex-col">
                  <div className="drag-handle absolute top-2 right-2 z-20 cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  <CardHeader className="flex-shrink-0">
                    <CardTitle>Lead Conversion Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={generateLeadsTrend(leads)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="new" stroke="#8884d8" name="New Leads" />
                        <Line type="monotone" dataKey="converted" stroke="#82ca9d" name="Converted" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Lead to Opportunity Funnel Chart */}
              <div key="funnelChart">
                <Card className="h-full relative group flex flex-col">
                  <div className="drag-handle absolute top-2 right-2 z-[100] cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md" style={{ pointerEvents: 'auto' }}>
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  {/* Invisible drag area in top-right corner only - avoid bottom-right where resize handle is */}
                  <div className="absolute top-0 right-0 w-16 h-12 z-[99] cursor-move" style={{ pointerEvents: 'auto' }} />
                  <CardHeader className="flex-shrink-0">
                    <CardTitle>Lead to Opportunity Funnel</CardTitle>
                    <CardDescription>Conversion by stage</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 p-4">
                    <div className="w-full h-full flex flex-col justify-center items-center">
                      {analytics.funnelData.length > 0 ? (
                        <div className="w-full max-w-2xl space-y-1">
                          {analytics.funnelData.map((item, index) => {
                            const maxValue = Math.max(...analytics.funnelData.map(d => d.value))
                            const widthPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0
                            const prevItem = index > 0 ? analytics.funnelData[index - 1] : null
                            const prevWidthPercent = prevItem && maxValue > 0
                              ? (prevItem.value / maxValue) * 100
                              : widthPercent

                            // Calculate conversion percentage from previous stage
                            const conversionPercent = prevItem && prevItem.value > 0
                              ? ((item.value / prevItem.value) * 100).toFixed(0)
                              : '100'

                            // Calculate the offset to create funnel effect
                            const offsetPercent = (prevWidthPercent - widthPercent) / 2

                            return (
                              <div key={index} className="relative flex justify-center" style={{ minHeight: '40px', flex: '1 1 0' }}>
                                <div
                                  className="rounded-md shadow-md transition-all duration-300 flex items-center justify-between px-6 text-white font-medium relative"
                                  style={{
                                    width: `${widthPercent}%`,
                                    height: '100%',
                                    backgroundColor: item.fill,
                                    minWidth: widthPercent < 3 ? '3%' : 'auto',
                                    marginLeft: index > 0 ? `${offsetPercent}%` : '0',
                                    marginRight: index > 0 ? `${offsetPercent}%` : '0',
                                  }}
                                >
                                  <span className="text-sm font-semibold whitespace-nowrap truncate flex-1">{item.stage}</span>
                                  <div className="flex items-center gap-3 ml-4">
                                    <span className="text-base font-bold">{item.value}</span>
                                    {index > 0 && (
                                      <span className="text-xs bg-white/20 px-2 py-1 rounded">{conversionPercent}%</span>
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

              {/* Leads Table */}
              <div key="leadsTable">
                <Card className="h-full relative group">
                  <div className="drag-handle absolute top-2 right-2 z-20 cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  <CardHeader>
                    <CardTitle>Leads ({leads.length})</CardTitle>
                    <CardDescription>Manage and track all your leads</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">Loading...</div>
                    ) : !Array.isArray(leads) || leads.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No leads found. Create your first lead to get started.
                      </div>
                    ) : (
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
                              onClick={() => handleSort('company')}
                            >
                              <div className="flex items-center gap-2">
                                Company
                                {sortColumn === 'company' ? (
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
                              onClick={() => handleSort('email')}
                            >
                              <div className="flex items-center gap-2">
                                Email
                                {sortColumn === 'email' ? (
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
                              onClick={() => handleSort('source')}
                            >
                              <div className="flex items-center gap-2">
                                Source
                                {sortColumn === 'source' ? (
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
                            <TableHead
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('rating')}
                            >
                              <div className="flex items-center gap-2">
                                Rating
                                {sortColumn === 'rating' ? (
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
                              onClick={() => handleSort('score')}
                            >
                              <div className="flex items-center gap-2">
                                Score
                                {sortColumn === 'score' ? (
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
                              onClick={() => handleSort('assignedTo')}
                            >
                              <div className="flex items-center gap-2">
                                Assigned To
                                {sortColumn === 'assignedTo' ? (
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
                          {Array.isArray(leads) && leads.map((lead) => (
                            <TableRow
                              key={lead.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => router.push(`/sales-dashboard/leads/${lead.id}`)}
                            >
                              <TableCell className="font-medium">
                                {lead.firstName} {lead.lastName}
                              </TableCell>
                              <TableCell>{lead.company || '-'}</TableCell>
                              <TableCell>{lead.email}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{lead.leadSource}</Badge>
                              </TableCell>
                              <TableCell>{getStatusBadge(lead.status)}</TableCell>
                              <TableCell>{getRatingBadge(lead.rating)}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{lead.score}</Badge>
                              </TableCell>
                              <TableCell>
                                {lead.assignedTo?.name || lead.assignedTo?.email || 'Unassigned'}
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <div className="flex gap-2">
                                  {lead.status !== 'CONVERTED' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleConvertLead(lead.id)
                                      }}
                                      disabled={convertingLeadId === lead.id}
                                      title="Convert lead to contact and opportunity"
                                    >
                                      {convertingLeadId === lead.id ? (
                                        <Clock className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleWatchLead(lead.id)
                                    }}
                                    title={watchedLeads.has(lead.id) ? 'Unwatch lead' : 'Watch lead for notifications'}
                                  >
                                    {watchedLeads.has(lead.id) ? (
                                      <Bell className="h-4 w-4 text-blue-600" />
                                    ) : (
                                      <BellOff className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      router.push(`/sales-dashboard/leads/${lead.id}`)
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ResponsiveGridLayout>
          </div>
        )
        }

        {/* Lead Scoring Configuration Dialog */}
        <LeadScoringConfigDialog
          open={scoringConfigOpen}
          onOpenChange={setScoringConfigOpen}
        />

        {/* Column Mapping Dialog */}
        <ColumnMappingDialog
          open={mappingDialogOpen}
          onOpenChange={setMappingDialogOpen}
          columns={fileColumns}
          sampleRows={sampleRows}
          onConfirm={handleMappingConfirm}
          loading={uploading}
        />

        {/* Upload Leads Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Leads from Excel/CSV</DialogTitle>
              <DialogDescription>
                Upload multiple leads at once using an Excel (.xlsx, .xls) or CSV file.
                Required columns: First Name, Last Name, Email.
                Optional columns: Company, Phone, Mobile, Title, Industry, Lead Source, Description, Status, Rating.
              </DialogDescription>
            </DialogHeader>

            {!uploadResults ? (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-semibold">Upload File</h4>
                    <p className="text-xs text-muted-foreground">
                      Select an Excel or CSV file with lead data
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Template
                  </Button>
                </div>

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <div className="space-y-2">
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        Click to select a file
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">or drag and drop</span>
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileSelect(file)
                        }
                      }}
                      disabled={uploading}
                    />
                    <p className="text-xs text-muted-foreground">
                      CSV, XLS, or XLSX files only
                    </p>
                  </div>
                </div>

                {uploading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                    <span className="text-sm text-muted-foreground">Uploading and processing leads...</span>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-2">File Format Example:</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Required columns:</strong> First Name, Last Name, Email</p>
                    <p><strong>Optional columns:</strong> Company, Phone, Mobile, Title, Industry, Lead Source, Description, Status, Rating</p>
                    <p className="mt-2">
                      <strong>Accepted formats:</strong> CSV (.csv), Excel (.xlsx, .xls)
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className={`rounded-lg p-4 ${uploadResults.success ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'}`}>
                  <div className="flex items-start gap-3">
                    {uploadResults.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-1 ${uploadResults.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                        {uploadResults.success ? 'Upload Complete' : 'Upload Failed'}
                      </h4>
                      {uploadResults.summary && (
                        <div className="text-sm space-y-1">
                          <p>Total rows: {uploadResults.summary.total}</p>
                          <p className="text-green-700 dark:text-green-300">
                            ✓ Successfully imported: {uploadResults.summary.successful}
                          </p>
                          {uploadResults.summary.failed > 0 && (
                            <p className="text-red-700 dark:text-red-300">
                              ✗ Failed: {uploadResults.summary.failed}
                            </p>
                          )}
                          {uploadResults.summary.duplicates > 0 && (
                            <p className="text-orange-700 dark:text-orange-300">
                              ⊘ Duplicates skipped: {uploadResults.summary.duplicates}
                            </p>
                          )}
                        </div>
                      )}
                      {uploadResults.error && (
                        <p className="text-sm text-red-700 dark:text-red-300 mt-2">{uploadResults.error}</p>
                      )}
                    </div>
                  </div>
                </div>

                {uploadResults.results && uploadResults.results.failed && uploadResults.results.failed.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Failed Rows:</h4>
                    <div className="max-h-48 overflow-y-auto border rounded-lg">
                      <div className="divide-y">
                        {uploadResults.results.failed.slice(0, 10).map((item: any, index: number) => (
                          <div key={index} className="p-3 text-sm">
                            <div className="font-medium">Row {item.row}</div>
                            <div className="text-muted-foreground text-xs mt-1">{item.error}</div>
                          </div>
                        ))}
                        {uploadResults.results.failed.length > 10 && (
                          <div className="p-3 text-sm text-muted-foreground text-center">
                            ... and {uploadResults.results.failed.length - 10} more failed rows
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {uploadResults.results && uploadResults.results.duplicates && uploadResults.results.duplicates.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Duplicate Rows (Skipped):</h4>
                    <div className="max-h-48 overflow-y-auto border rounded-lg">
                      <div className="divide-y">
                        {uploadResults.results.duplicates.slice(0, 10).map((item: any, index: number) => (
                          <div key={index} className="p-3 text-sm">
                            <div className="font-medium">Row {item.row}</div>
                            <div className="text-muted-foreground text-xs mt-1">Email already exists</div>
                          </div>
                        ))}
                        {uploadResults.results.duplicates.length > 10 && (
                          <div className="p-3 text-sm text-muted-foreground text-center">
                            ... and {uploadResults.results.duplicates.length - 10} more duplicates
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadDialogOpen(false)
                      setUploadResults(null)
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setUploadResults(null)
                    }}
                  >
                    Upload Another File
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div >
    </SalesPageLayout >
  )
}

export default function LeadsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading leads...</div>
      </div>
    }>
      <LeadsInner />
    </Suspense>
  )
}
