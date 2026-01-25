'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import {
  Download,
  Mail,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Copy,
  PenTool,
  History,
  AlertCircle,
  Send,
  Save,
  DollarSign,
  FileCheck,
  AlertTriangle,
  MessageSquare,
  CheckSquare,
  Plus,
  Upload,
} from 'lucide-react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface QuoteDetail {
  id: string
  quoteNumber: string
  name: string
  description: string | null
  status: string
  validUntil: string | null
  subtotal: number
  taxAmount: number
  taxRate: number
  discount: number
  discountType: string
  totalAmount: number
  currency: string
  terms: string | null
  notes: string | null
  sentAt: string | null
  acceptedAt: string | null
  rejectedAt: string | null
  createdAt: string
  versionNumber: number
  parentQuoteId: string | null
  requiresApproval: boolean
  approvedAt: string | null
  approvalNotes: string | null
  signedByName: string | null
  signedByEmail: string | null
  signedAt: string | null
  account: {
    id: string
    name: string
  } | null
  opportunity: {
    id: string
    name: string
  } | null
  lineItems: Array<{
    id: string
    name: string
    description: string | null
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  createdBy: {
    name: string | null
    email: string
  }
  approvedBy: {
    name: string | null
    email: string
  } | null
}

export default function QuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [signDialogOpen, setSignDialogOpen] = useState(false)
  const [versionsDialogOpen, setVersionsDialogOpen] = useState(false)
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false)
  const [versions, setVersions] = useState<QuoteDetail[]>([])
  const [templateData, setTemplateData] = useState({
    templateName: '',
    description: '',
    isDefault: false,
  })

  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    message: '',
  })

  const [approvalData, setApprovalData] = useState({
    approvalNotes: '',
  })

  const [signatureData, setSignatureData] = useState({
    signedByName: '',
    signedByEmail: '',
    signatureData: null as any,
  })
  const [creatingInvoice, setCreatingInvoice] = useState(false)

  // Contract/SOW state
  const [contracts, setContracts] = useState<any[]>([])
  const [loadingContracts, setLoadingContracts] = useState(false)
  const [selectedContract, setSelectedContract] = useState<string | null>(null)

  useEffect(() => {
    fetchQuote()
    fetchContracts()
  }, [params.id])

  const fetchContracts = async () => {
    try {
      setLoadingContracts(true)
      const response = await fetch(`/api/sales/quotes/${params.id}/contracts`)
      if (response.ok) {
        const data = await response.json()
        setContracts(Array.isArray(data) ? data : [])
        if (data.length > 0 && !selectedContract) {
          setSelectedContract(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoadingContracts(false)
    }
  }

  const handleCreateContract = async () => {
    try {
      const response = await fetch(`/api/sales/quotes/${params.id}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Contract for ${quote?.name || 'Quote'}`,
          type: 'SOW',
        }),
      })
      if (response.ok) {
        const newContract = await response.json()
        toast({
          title: 'Success',
          description: 'Contract created successfully',
        })
        fetchContracts()
        setSelectedContract(newContract.id)
      }
    } catch (error) {
      console.error('Error creating contract:', error)
      toast({
        title: 'Error',
        description: 'Failed to create contract',
        variant: 'destructive',
      })
    }
  }

  const fetchQuote = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sales/quotes/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setQuote(data)

        // Pre-fill email data
        if (data.account?.email) {
          setEmailData({
            to: data.account.email,
            subject: `Quote ${data.quoteNumber} - ${data.name}`,
            message: `Dear ${data.account.name},\n\nPlease find attached quote ${data.quoteNumber} for your review.\n\nBest regards`,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching quote:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch quote',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    window.open(`/api/sales/quotes/${params.id}/pdf`, '_blank')
  }

  const handleCreateInvoice = async () => {
    if (!confirm('Create an invoice from this quote? This will generate a new invoice with all quote line items.')) {
      return
    }

    try {
      setCreatingInvoice(true)
      const response = await fetch(`/api/sales/quotes/${params.id}/invoice`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Success',
          description: 'Invoice created successfully',
        })
        router.push(`/sales-dashboard/invoices`)
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to create invoice',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive',
      })
    } finally {
      setCreatingInvoice(false)
    }
  }

  const handleSendEmail = async () => {
    try {
      const response = await fetch(`/api/sales/quotes/${params.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Quote sent successfully',
        })
        setEmailDialogOpen(false)
        fetchQuote()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to send quote',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error sending email:', error)
      toast({
        title: 'Error',
        description: 'Failed to send quote',
        variant: 'destructive',
      })
    }
  }

  const handleApprove = async () => {
    try {
      const response = await fetch(`/api/sales/quotes/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalData),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Quote approved successfully',
        })
        setApproveDialogOpen(false)
        fetchQuote()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to approve quote',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error approving quote:', error)
      toast({
        title: 'Error',
        description: 'Failed to approve quote',
        variant: 'destructive',
      })
    }
  }

  const handleCreateVersion = async () => {
    try {
      const response = await fetch(`/api/sales/quotes/${params.id}/versions`, {
        method: 'POST',
      })

      if (response.ok) {
        const newVersion = await response.json()
        toast({
          title: 'Success',
          description: 'New version created successfully',
        })
        router.push(`/sales-dashboard/quotes/${newVersion.id}`)
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to create version',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error creating version:', error)
      toast({
        title: 'Error',
        description: 'Failed to create version',
        variant: 'destructive',
      })
    }
  }

  const handleSign = async () => {
    if (!signatureData.signedByName) {
      toast({
        title: 'Error',
        description: 'Please enter your name',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch(`/api/sales/quotes/${params.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signedByName: signatureData.signedByName,
          signedByEmail: signatureData.signedByEmail,
          signatureData: signatureData.signatureData || { signed: true, timestamp: new Date().toISOString() },
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Quote signed successfully',
        })
        setSignDialogOpen(false)
        fetchQuote()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to sign quote',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error signing quote:', error)
      toast({
        title: 'Error',
        description: 'Failed to sign quote',
        variant: 'destructive',
      })
    }
  }

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/sales/quotes/${params.id}/versions`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data)
      }
    } catch (error) {
      console.error('Error fetching versions:', error)
    }
  }

  const handleSaveAsTemplate = async () => {
    if (!templateData.templateName) {
      toast({
        title: 'Error',
        description: 'Template name is required',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch(`/api/sales/quotes/${params.id}/save-as-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Template saved successfully',
        })
        setSaveTemplateDialogOpen(false)
        setTemplateData({ templateName: '', description: '', isDefault: false })
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to save template',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      DRAFT: { variant: 'secondary', label: 'Draft' },
      IN_REVIEW: { variant: 'default', label: 'In Review' },
      APPROVED: { variant: 'default', label: 'Approved' },
      SENT: { variant: 'default', label: 'Sent' },
      ACCEPTED: { variant: 'default', label: 'Accepted' },
      REJECTED: { variant: 'destructive', label: 'Rejected' },
      EXPIRED: { variant: 'outline', label: 'Expired' },
      CANCELLED: { variant: 'destructive', label: 'Cancelled' },
    }
    const config = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <SalesPageLayout title="Quote Details" description="View and manage quote">
        <div className="text-center py-8">Loading...</div>
      </SalesPageLayout>
    )
  }

  if (!quote) {
    return (
      <SalesPageLayout title="Quote Details" description="View and manage quote">
        <div className="text-center py-8">Quote not found</div>
      </SalesPageLayout>
    )
  }

  return (
    <SalesPageLayout
      title={`Quote ${quote.quoteNumber}`}
      description={quote.name}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            {getStatusBadge(quote.status)}
            {quote.versionNumber > 1 && (
              <Badge variant="outline">Version {quote.versionNumber}</Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>

            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Send Quote via Email</DialogTitle>
                  <DialogDescription>
                    Send this quote to the customer via email
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email-to">To *</Label>
                    <Input
                      id="email-to"
                      type="email"
                      value={emailData.to}
                      onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email-subject">Subject *</Label>
                    <Input
                      id="email-subject"
                      value={emailData.subject}
                      onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email-message">Message</Label>
                    <Textarea
                      id="email-message"
                      value={emailData.message}
                      onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                      rows={5}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSendEmail}>
                      <Send className="mr-2 h-4 w-4" />
                      Send Quote
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {quote.requiresApproval && quote.status === 'IN_REVIEW' && (
              <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Approve Quote</DialogTitle>
                    <DialogDescription>
                      Approve this quote for sending
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
                      <Textarea
                        id="approval-notes"
                        value={approvalData.approvalNotes}
                        onChange={(e) => setApprovalData({ approvalNotes: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleApprove}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Quote
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {quote.status === 'SENT' || quote.status === 'APPROVED' ? (
              <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <PenTool className="mr-2 h-4 w-4" />
                    Sign Quote
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sign Quote</DialogTitle>
                    <DialogDescription>
                      Sign this quote to accept it
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sign-name">Full Name *</Label>
                      <Input
                        id="sign-name"
                        value={signatureData.signedByName}
                        onChange={(e) => setSignatureData({ ...signatureData, signedByName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="sign-email">Email</Label>
                      <Input
                        id="sign-email"
                        type="email"
                        value={signatureData.signedByEmail}
                        onChange={(e) => setSignatureData({ ...signatureData, signedByEmail: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setSignDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSign}>
                        <PenTool className="mr-2 h-4 w-4" />
                        Sign & Accept
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : null}

            <Button variant="outline" onClick={handleCreateVersion}>
              <Copy className="mr-2 h-4 w-4" />
              Create Version
            </Button>

            {quote.parentQuoteId && (
              <Button variant="outline" asChild>
                <Link href={`/sales-dashboard/quotes/${params.id}/compare`}>
                  <History className="mr-2 h-4 w-4" />
                  Compare Versions
                </Link>
              </Button>
            )}

            <Dialog open={versionsDialogOpen} onOpenChange={setVersionsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={fetchVersions}>
                  <History className="mr-2 h-4 w-4" />
                  View Versions
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Quote Versions</DialogTitle>
                  <DialogDescription>
                    View all versions of this quote
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {versions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Version</TableHead>
                          <TableHead>Quote Number</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {versions.map((version) => (
                          <TableRow key={version.id}>
                            <TableCell>v{version.versionNumber}</TableCell>
                            <TableCell>{version.quoteNumber}</TableCell>
                            <TableCell>{getStatusBadge(version.status)}</TableCell>
                            <TableCell>{format(new Date(version.createdAt), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>${(version.totalAmount / 1000).toFixed(1)}K</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                              >
                                <Link href={`/sales-dashboard/quotes/${version.id}`}>
                                  View
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No versions found
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Save className="mr-2 h-4 w-4" />
                  Save as Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Quote as Template</DialogTitle>
                  <DialogDescription>
                    Save this quote structure as a reusable template
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template-name">Template Name *</Label>
                    <Input
                      id="template-name"
                      value={templateData.templateName}
                      onChange={(e) => setTemplateData({ ...templateData, templateName: e.target.value })}
                      placeholder="Standard Quote Template"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-description">Description</Label>
                    <Textarea
                      id="template-description"
                      value={templateData.description}
                      onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                      rows={3}
                      placeholder="Template description..."
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="template-default"
                      checked={templateData.isDefault}
                      onChange={(e) => setTemplateData({ ...templateData, isDefault: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="template-default">Set as default template</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSaveTemplateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveAsTemplate}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quote Information */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quote Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Quote Number</Label>
                <p className="font-medium">{quote.quoteNumber}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-medium">{quote.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p>{format(new Date(quote.createdAt), 'MMM dd, yyyy')}</p>
              </div>
              {quote.validUntil && (
                <div>
                  <Label className="text-muted-foreground">Valid Until</Label>
                  <p>{format(new Date(quote.validUntil), 'MMM dd, yyyy')}</p>
                </div>
              )}
              {quote.account && (
                <div>
                  <Label className="text-muted-foreground">Account</Label>
                  <p>
                    <Link
                      href={`/sales-dashboard/accounts/${quote.account.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {quote.account.name}
                    </Link>
                  </p>
                </div>
              )}
              {quote.opportunity && (
                <div>
                  <Label className="text-muted-foreground">Opportunity</Label>
                  <p>
                    <Link
                      href={`/sales-dashboard/opportunities/${quote.opportunity.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {quote.opportunity.name}
                    </Link>
                  </p>
                </div>
              )}
              {quote.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p>{quote.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status & Approval</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quote.requiresApproval && quote.approvedAt && (
                <div>
                  <Label className="text-muted-foreground">Approved By</Label>
                  <p className="font-medium">
                    {quote.approvedBy?.name || quote.approvedBy?.email || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(quote.approvedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              )}
              {quote.signedByName && (
                <div>
                  <Label className="text-muted-foreground">Signed By</Label>
                  <p className="font-medium">{quote.signedByName}</p>
                  {quote.signedByEmail && <p className="text-sm">{quote.signedByEmail}</p>}
                  {quote.signedAt && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(quote.signedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}
                </div>
              )}
              {quote.sentAt && (
                <div>
                  <Label className="text-muted-foreground">Sent At</Label>
                  <p>{format(new Date(quote.sentAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              )}
              {quote.acceptedAt && (
                <div>
                  <Label className="text-muted-foreground">Accepted At</Label>
                  <p>{format(new Date(quote.acceptedAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      ${parseFloat(item.unitPrice.toString()).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${parseFloat(item.totalPrice.toString()).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    Subtotal:
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${parseFloat(quote.subtotal.toString()).toFixed(2)}
                  </TableCell>
                </TableRow>
                {parseFloat(quote.discount.toString()) > 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-right">
                      Discount:
                    </TableCell>
                    <TableCell className="text-right">
                      -${parseFloat(quote.discount.toString()).toFixed(2)}
                    </TableCell>
                  </TableRow>
                )}
                {parseFloat(quote.taxAmount.toString()) > 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-right">
                      Tax ({parseFloat(quote.taxRate.toString())}%):
                    </TableCell>
                    <TableCell className="text-right">
                      ${parseFloat(quote.taxAmount.toString()).toFixed(2)}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold text-lg">
                    Total:
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    ${parseFloat(quote.totalAmount.toString()).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Terms & Notes */}
        {(quote.terms || quote.notes) && (
          <div className="grid gap-6 md:grid-cols-2">
            {quote.terms && (
              <Card>
                <CardHeader>
                  <CardTitle>Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{quote.terms}</p>
                </CardContent>
              </Card>
            )}
            {quote.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Internal Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{quote.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Contract/SOW Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Contracts / SOW
              </CardTitle>
              <Button onClick={handleCreateContract} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Contract
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingContracts ? (
              <div className="text-center py-8">Loading contracts...</div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No contracts or SOWs yet.</p>
                <p className="text-sm mt-2">Create one to manage versions, clauses, risk flags, and legal comments.</p>
              </div>
            ) : (
              <Tabs value={selectedContract || undefined} onValueChange={setSelectedContract}>
                <TabsList className="mb-4">
                  {contracts.map((contract) => (
                    <TabsTrigger key={contract.id} value={contract.id}>
                      {contract.name} ({contract.type})
                    </TabsTrigger>
                  ))}
                </TabsList>

                {contracts.map((contract) => (
                  <TabsContent key={contract.id} value={contract.id} className="space-y-6">
                    {/* Contract Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Contract Number</Label>
                        <p className="font-medium">{contract.contractNumber}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <div>
                          <Badge variant={contract.status === 'APPROVED' ? 'default' : contract.status === 'EXECUTED' ? 'default' : 'secondary'}>
                            {contract.status}
                          </Badge>
                        </div>
                      </div>
                      {contract.predictedTimeline && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Predicted Timeline</Label>
                          <p className="font-medium text-blue-600">{contract.predictedTimeline}</p>
                        </div>
                      )}
                    </div>

                    {/* Risk Flags */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          Risk Flags
                        </h3>
                      </div>
                      {contract.riskFlags && contract.riskFlags.length > 0 ? (
                        <div className="space-y-2">
                          {contract.riskFlags.map((flag: any) => (
                            <div key={flag.id} className={`p-3 border rounded-lg ${flag.severity === 'CRITICAL' ? 'border-red-300 bg-red-50' :
                              flag.severity === 'HIGH' ? 'border-orange-300 bg-orange-50' :
                                flag.severity === 'MEDIUM' ? 'border-yellow-300 bg-yellow-50' :
                                  'border-gray-200'
                              }`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant={flag.severity === 'CRITICAL' ? 'destructive' : flag.severity === 'HIGH' ? 'default' : 'secondary'}>
                                      {flag.riskType} - {flag.severity}
                                    </Badge>
                                  </div>
                                  <p className="text-sm">{flag.description}</p>
                                  {flag.clauseReference && (
                                    <p className="text-xs text-muted-foreground mt-1">Ref: {flag.clauseReference}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No risk flags identified</p>
                      )}
                    </div>

                    {/* Clauses with Unusual Clause Alert */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">Clause Library</h3>
                      </div>
                      {contract.clauses && contract.clauses.length > 0 ? (
                        <div className="space-y-3">
                          {contract.clauses.map((clause: any) => (
                            <div key={clause.id} className="border rounded-lg p-3">
                              {clause.isUnusual && (
                                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-red-800">Customer asks unusual clause</p>
                                    <p className="text-xs text-red-600 mt-1">This clause contains unusual terms that may require legal review.</p>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-start justify-between mb-2">
                                <Badge variant="outline">{clause.clauseType}</Badge>
                                {clause.isStandard && <Badge variant="secondary" className="text-xs">Standard</Badge>}
                              </div>
                              <p className="text-sm mb-2">{clause.clauseText}</p>
                              {clause.suggestedClause && (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                  <p className="text-xs font-semibold text-blue-800 mb-1">💡 Suggestion:</p>
                                  <p className="text-xs text-blue-700">{clause.suggestedClause}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No clauses added yet</p>
                      )}
                    </div>

                    {/* Legal Comments */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Legal Comments & Customer Requests
                        </h3>
                      </div>
                      {contract.legalComments && contract.legalComments.length > 0 ? (
                        <div className="space-y-3">
                          {contract.legalComments.map((comment: any) => (
                            <div key={comment.id} className={`border rounded-lg p-3 ${comment.commentType === 'CUSTOMER_REQUEST' ? 'border-blue-200 bg-blue-50' :
                              comment.commentType === 'LEGAL_REVIEW' ? 'border-purple-200 bg-purple-50' :
                                'border-gray-200'
                              }`}>
                              <div className="flex items-start justify-between mb-2">
                                <Badge variant={comment.commentType === 'CUSTOMER_REQUEST' ? 'default' : comment.commentType === 'LEGAL_REVIEW' ? 'secondary' : 'outline'}>
                                  {comment.commentType.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                                </span>
                              </div>
                              <p className="text-sm">{comment.content}</p>
                              {comment.clauseReference && (
                                <p className="text-xs text-muted-foreground mt-1">Ref: {comment.clauseReference}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                By {comment.createdBy?.name || comment.createdBy?.email || 'Unknown'}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No comments yet</p>
                      )}
                    </div>

                    {/* Open Items */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <CheckSquare className="h-4 w-4" />
                          Open Items
                        </h3>
                      </div>
                      {contract.openItems && contract.openItems.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>Owner</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Due Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contract.openItems.map((item: any) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-sm">{item.item}</p>
                                    {item.description && (
                                      <p className="text-xs text-muted-foreground">{item.description}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {item.owner?.name || item.owner?.email || 'Unassigned'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={item.status === 'COMPLETED' ? 'default' : item.status === 'IN_PROGRESS' ? 'secondary' : 'outline'}>
                                    {item.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {item.dueDate ? format(new Date(item.dueDate), 'MMM dd, yyyy') : '—'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground">No open items</p>
                      )}
                    </div>

                    {/* Versions */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <History className="h-4 w-4" />
                          Versions & Redlines
                        </h3>
                      </div>
                      {contract.versions && contract.versions.length > 0 ? (
                        <div className="space-y-2">
                          {contract.versions.map((version: any) => (
                            <div key={version.id} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge>v{version.versionNumber}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(version.createdAt), 'MMM dd, yyyy HH:mm')}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  By {version.createdBy?.name || version.createdBy?.email || 'Unknown'}
                                </span>
                              </div>
                              {version.changeSummary && (
                                <p className="text-sm mb-2">{version.changeSummary}</p>
                              )}
                              <div className="flex gap-2">
                                {version.documentUrl && (
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={version.documentUrl} target="_blank" rel="noopener noreferrer">
                                      <FileText className="h-3 w-3 mr-1" />
                                      Document
                                    </a>
                                  </Button>
                                )}
                                {version.redlineUrl && (
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={version.redlineUrl} target="_blank" rel="noopener noreferrer">
                                      <Edit className="h-3 w-3 mr-1" />
                                      Redline
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No versions yet</p>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </SalesPageLayout>
  )
}

