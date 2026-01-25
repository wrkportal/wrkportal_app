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
import { Users, Plus, Search, Eye, Mail, Phone, Building2, Upload, FileSpreadsheet, Download, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { ColumnMappingDialog, CONTACT_STANDARD_FIELDS } from '@/components/sales/lead-column-mapping-dialog'

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  mobile: string | null
  title: string | null
  department: string | null
  status: string
  account: {
    id: string
    name: string
  } | null
  owner: {
    id: string
    name: string | null
    email: string
  }
  _count: {
    activities: number
    opportunities: number
  }
}

function ContactsInner() {
  const searchParams = useSearchParams()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<any>(null)
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false)
  const [fileColumns, setFileColumns] = useState<string[]>([])
  const [sampleRows, setSampleRows] = useState<Record<string, any>[]>([])
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    accountId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    title: '',
    department: '',
    description: '',
  })

  useEffect(() => {
    fetchContacts()
    fetchAccounts()
  }, [statusFilter])

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
    }
  }

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/sales/contacts?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch contacts' }))
        console.error('Error fetching contacts:', errorData)
        setContacts([])
        return
      }

      const data = await response.json()
      setContacts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
      setContacts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchContacts()
  }

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/sales/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        setFormData({
          accountId: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          mobile: '',
          title: '',
          department: '',
          description: '',
        })
        fetchContacts()
      }
    } catch (error) {
      console.error('Error creating contact:', error)
    }
  }

  const handleFileSelect = async (file: File) => {
    try {
      setUploading(true)
      const previewFormData = new FormData()
      previewFormData.append('file', file)
      const previewResponse = await fetch('/api/sales/contacts/upload/preview', {
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
      const response = await fetch('/api/sales/contacts/upload', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      if (response.ok) {
        setUploadResults(result)
        fetchContacts()
        setPendingFile(null)
        setFileColumns([])
        setSampleRows([])
      } else {
        setUploadResults({
          success: false,
          error: result.error || 'Failed to upload contacts',
          summary: { total: 0, successful: 0, failed: 1, duplicates: 0 },
        })
      }
    } catch (error: any) {
      console.error('Error uploading file:', error)
      setUploadResults({
        success: false,
        error: error.message || 'Failed to upload contacts',
        summary: { total: 0, successful: 0, failed: 1, duplicates: 0 },
      })
    } finally {
      setUploading(false)
      setUploadDialogOpen(true)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/sales/contacts/template')
      if (!response.ok) throw new Error('Failed to download template')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'contact-upload-template.xlsx'
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
    <SalesPageLayout
      title="Contact Management"
      description="Manage customer contacts and stakeholders"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Contacts
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Contact</DialogTitle>
                  <DialogDescription>
                    Add a new contact with complete information
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateContact} className="space-y-4">
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
                        {Array.isArray(accounts) && accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
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
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="mobile">Mobile</Label>
                      <Input
                        id="mobile"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
                    <Button type="submit">Create Contact</Button>
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
          standardFields={[...CONTACT_STANDARD_FIELDS]}
        />

        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Contacts from Excel/CSV</DialogTitle>
              <DialogDescription>
                Upload multiple contacts at once. Required: First Name, Last Name.
                Optional: Email, Phone, Mobile, Title, Department, Account Name, Lead Source, Description, Status.
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
                  <Label htmlFor="file-upload-contact" className="cursor-pointer">
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-700">Click to select a file</span>
                    <span className="text-sm text-muted-foreground ml-2">or drag and drop</span>
                  </Label>
                  <Input id="file-upload-contact" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => {
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

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contacts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Contacts ({contacts.length})</CardTitle>
            <CardDescription>Manage all customer contacts and stakeholders</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No contacts found. Create your first contact to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Activities</TableHead>
                    <TableHead>Opportunities</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">
                        {contact.firstName} {contact.lastName}
                      </TableCell>
                      <TableCell>
                        {contact.account ? (
                          <Link
                            href={`/sales-dashboard/accounts/${contact.account.id}`}
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <Building2 className="h-4 w-4" />
                            {contact.account.name}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{contact.title || '-'}</TableCell>
                      <TableCell>
                        {contact.email ? (
                          <a
                            href={`mailto:${contact.email}`}
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <Mail className="h-4 w-4" />
                            {contact.email}
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.phone || contact.mobile ? (
                          <a
                            href={`tel:${contact.phone || contact.mobile}`}
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <Phone className="h-4 w-4" />
                            {contact.phone || contact.mobile}
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{contact._count.activities}</TableCell>
                      <TableCell>{contact._count.opportunities}</TableCell>
                      <TableCell>
                        <Badge variant={contact.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {contact.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/sales-dashboard/contacts/${contact.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
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

export default function ContactsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading contacts...</div>
      </div>
    }>
      <ContactsInner />
    </Suspense>
  )
}
