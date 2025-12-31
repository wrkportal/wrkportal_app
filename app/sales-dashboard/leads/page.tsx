'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { UserPlus, Search, Filter, Plus, Eye, Edit, Trash2, CheckCircle2, CheckCircle, Circle, TrendingUp, Users, Target, Clock, Bell, BellOff } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
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
} from 'recharts'

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

export default function LeadsPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const searchParams = useSearchParams()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [watchedLeads, setWatchedLeads] = useState<Set<string>>(new Set())
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null)
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
  })

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
    fetchLeads()
    fetchUsers()
    fetchContacts()
  }, [statusFilter])

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

  // Load watched leads from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('watchedLeads')
    if (stored) {
      try {
        setWatchedLeads(new Set(JSON.parse(stored)))
      } catch (e) {
        console.error('Error loading watched leads:', e)
      }
    }
  }, [])

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

  useEffect(() => {
    if (leads.length > 0) {
      calculateAnalytics()
    }
  }, [leads])

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
    })
  }

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/sales/leads?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch leads' }))
        console.error('Error fetching leads:', errorData)
        setLeads([])
        return
      }

      const data = await response.json()
      setLeads(Array.isArray(data) ? data : [])
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

  return (
    <SalesPageLayout>
      <div className="space-y-6">
        {/* Header with Title, Search and Create Button */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Lead Management</h2>
            <p className="text-muted-foreground mt-1">Capture, score, and convert leads into opportunities</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative min-w-[300px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CONTACTED">Contacted</SelectItem>
                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                <SelectItem value="CONVERTED">Converted</SelectItem>
                <SelectItem value="UNQUALIFIED">Unqualified</SelectItem>
                <SelectItem value="NURTURING">Nurturing</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Search
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

        {/* Analytics Section */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
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

          <Card>
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</div>
              <Progress value={analytics.conversionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.avgScore.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Lead quality score</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Leads by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.leadsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leads by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
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

          <Card>
            <CardHeader>
              <CardTitle>Leads by Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.leadsByRating}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
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

        {/* Leads Table */}
        <Card>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Assigned To</TableHead>
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
    </SalesPageLayout>
  )
}
