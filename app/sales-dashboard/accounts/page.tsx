'use client'

import { useState, useEffect, Suspense } from 'react'
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
import { Building2, Plus, Search, Eye, Edit, Trash2, Users, Briefcase, DollarSign, TrendingUp, Activity, Target, Upload, FileSpreadsheet, Download, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { ColumnMappingDialog, ACCOUNT_STANDARD_FIELDS } from '@/components/sales/lead-column-mapping-dialog'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a28dff', '#ff6b9d']

interface Account {
  id: string
  name: string
  type: string
  industry: string | null
  website: string | null
  phone: string | null
  email: string | null
  annualRevenue: number | null
  numberOfEmployees: number | null
  status: string
  rating: string | null
  owner: {
    id: string
    name: string | null
    email: string
  }
  _count: {
    contacts: number
    opportunities: number
    activities: number
  }
}

function AccountsInner() {
  const searchParams = useSearchParams()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<any>(null)
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false)
  const [fileColumns, setFileColumns] = useState<string[]>([])
  const [sampleRows, setSampleRows] = useState<Record<string, any>[]>([])
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  
  // Dashboard metrics
  const totalAccounts = accounts.length
  const activeAccounts = accounts.filter(a => a.status === 'ACTIVE').length
  const totalRevenue = accounts.reduce((sum, a) => sum + (a.annualRevenue || 0), 0)
  const totalContacts = accounts.reduce((sum, a) => sum + a._count.contacts, 0)
  const totalOpportunities = accounts.reduce((sum, a) => sum + a._count.opportunities, 0)
  const totalActivities = accounts.reduce((sum, a) => sum + a._count.activities, 0)
  
  // Chart data
  const accountsByType = accounts.reduce((acc, account) => {
    acc[account.type] = (acc[account.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const typeChartData = Object.entries(accountsByType).map(([name, value]) => ({
    name,
    value,
  }))
  
  const industryData = accounts
    .filter(a => a.industry)
    .reduce((acc, account) => {
      acc[account.industry!] = (acc[account.industry!] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  
  const industryChartData = Object.entries(industryData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      value,
    }))

  const [formData, setFormData] = useState({
    name: '',
    type: 'CUSTOMER',
    industry: '',
    website: '',
    phone: '',
    email: '',
    annualRevenue: '',
    numberOfEmployees: '',
    description: '',
  })

  useEffect(() => {
    fetchAccounts()
  }, [typeFilter])

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
      setLoading(true)
      const params = new URLSearchParams()
      if (typeFilter !== 'all') {
        params.append('type', typeFilter)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/sales/accounts?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch accounts' }))
        console.error('Error fetching accounts:', errorData)
        setAccounts([])
        return
      }

      const data = await response.json()
      setAccounts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchAccounts()
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/sales/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        setFormData({
          name: '',
          type: 'CUSTOMER',
          industry: '',
          website: '',
          phone: '',
          email: '',
          annualRevenue: '',
          numberOfEmployees: '',
          description: '',
        })
        fetchAccounts()
      }
    } catch (error) {
      console.error('Error creating account:', error)
    }
  }

  const handleFileSelect = async (file: File) => {
    try {
      setUploading(true)
      const previewFormData = new FormData()
      previewFormData.append('file', file)
      const previewResponse = await fetch('/api/sales/accounts/upload/preview', {
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
      const response = await fetch('/api/sales/accounts/upload', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      if (response.ok) {
        setUploadResults(result)
        fetchAccounts()
        setPendingFile(null)
        setFileColumns([])
        setSampleRows([])
      } else {
        setUploadResults({
          success: false,
          error: result.error || 'Failed to upload accounts',
          summary: { total: 0, successful: 0, failed: 1, duplicates: 0 },
        })
      }
    } catch (error: any) {
      console.error('Error uploading file:', error)
      setUploadResults({
        success: false,
        error: error.message || 'Failed to upload accounts',
        summary: { total: 0, successful: 0, failed: 1, duplicates: 0 },
      })
    } finally {
      setUploading(false)
      setUploadDialogOpen(true)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/sales/accounts/template')
      if (!response.ok) throw new Error('Failed to download template')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'account-upload-template.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Error downloading template:', error)
      alert('Failed to download template. Please try again.')
    }
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      CUSTOMER: 'bg-blue-100 text-blue-800',
      PARTNER: 'bg-green-100 text-green-800',
      COMPETITOR: 'bg-red-100 text-red-800',
      RESELLER: 'bg-purple-100 text-purple-800',
      PROSPECT: 'bg-yellow-100 text-yellow-800',
    }
    return <Badge className={colors[type]}>{type}</Badge>
  }

  const getStatusBadge = (status: string) => {
    return status === 'ACTIVE' ? (
      <Badge variant="default">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    )
  }

  return (
    <SalesPageLayout
      title="Account Management"
      description="Manage customer accounts and relationships"
    >
      <div className="space-y-6">
        {/* Dashboard Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAccounts}</div>
              <p className="text-xs text-muted-foreground">
                {activeAccounts} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(totalRevenue / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">
                Annual revenue
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalContacts}</div>
              <p className="text-xs text-muted-foreground">
                Across all accounts
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOpportunities}</div>
              <p className="text-xs text-muted-foreground">
                {totalActivities} activities
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Accounts by Type</CardTitle>
              <CardDescription>Distribution of account types</CardDescription>
            </CardHeader>
            <CardContent>
              {typeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Industries</CardTitle>
              <CardDescription>Accounts by industry</CardDescription>
            </CardHeader>
            <CardContent>
              {industryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={industryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Existing Content */}
        <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Accounts
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Account
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
              <DialogDescription>
                Add a new customer account with complete company information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <Label htmlFor="name">Account Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Account Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">Customer</SelectItem>
                      <SelectItem value="PARTNER">Partner</SelectItem>
                      <SelectItem value="COMPETITOR">Competitor</SelectItem>
                      <SelectItem value="RESELLER">Reseller</SelectItem>
                      <SelectItem value="PROSPECT">Prospect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="annualRevenue">Annual Revenue</Label>
                  <Input
                    id="annualRevenue"
                    type="number"
                    value={formData.annualRevenue}
                    onChange={(e) => setFormData({ ...formData, annualRevenue: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="numberOfEmployees">Number of Employees</Label>
                  <Input
                    id="numberOfEmployees"
                    type="number"
                    value={formData.numberOfEmployees}
                    onChange={(e) => setFormData({ ...formData, numberOfEmployees: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Account</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <ColumnMappingDialog
        open={mappingDialogOpen}
        onOpenChange={setMappingDialogOpen}
        columns={fileColumns}
        sampleRows={sampleRows}
        onConfirm={handleMappingConfirm}
        loading={uploading}
        standardFields={ACCOUNT_STANDARD_FIELDS}
      />

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Accounts from Excel/CSV</DialogTitle>
            <DialogDescription>
              Upload multiple accounts at once using an Excel (.xlsx, .xls) or CSV file. 
              Required columns: Name. 
              Optional columns: Type, Industry, Website, Phone, Email, Annual Revenue, Number of Employees, Description, Status, Rating.
            </DialogDescription>
          </DialogHeader>

          {!uploadResults ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold">Upload File</h4>
                  <p className="text-xs text-muted-foreground">
                    Select an Excel or CSV file with account data
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
                  <Label htmlFor="file-upload-account" className="cursor-pointer">
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      Click to select a file
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">or drag and drop</span>
                  </Label>
                  <Input
                    id="file-upload-account"
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
                  <span className="text-sm text-muted-foreground">Processing file...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className={`rounded-lg p-4 ${uploadResults.success ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'}`}>
                <div className="flex items-start gap-3">
                  {uploadResults.success ? (
                    <Users className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <Edit className="h-5 w-5 text-red-600 mt-0.5" />
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
                      </div>
                    )}
                    {uploadResults.error && (
                      <p className="text-sm text-red-700 dark:text-red-300 mt-2">{uploadResults.error}</p>
                    )}
                  </div>
                </div>
              </div>

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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="PARTNER">Partner</SelectItem>
                <SelectItem value="COMPETITOR">Competitor</SelectItem>
                <SelectItem value="RESELLER">Reseller</SelectItem>
                <SelectItem value="PROSPECT">Prospect</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Accounts ({accounts.length})</CardTitle>
          <CardDescription>Manage all customer accounts and relationships</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No accounts found. Create your first account to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Opportunities</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/sales-dashboard/accounts/${account.id}`}
                        className="hover:underline"
                      >
                        {account.name}
                      </Link>
                    </TableCell>
                    <TableCell>{getTypeBadge(account.type)}</TableCell>
                    <TableCell>{account.industry || '-'}</TableCell>
                    <TableCell>
                      {account.annualRevenue
                        ? `$${(account.annualRevenue / 1000000).toFixed(1)}M`
                        : '-'}
                    </TableCell>
                    <TableCell>{account.numberOfEmployees || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {account._count.contacts}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        {account._count.opportunities}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(account.status)}</TableCell>
                    <TableCell>{account.owner.name || account.owner.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/sales-dashboard/accounts/${account.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
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

