'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  FileText,
  Plus,
  Search,
  Eye,
  Download,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  CreditCard
} from 'lucide-react'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { format } from 'date-fns'
import Link from 'next/link'

interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  clientEmail: string | null
  subject: string
  invoiceDate: string
  dueDate: string
  totalAmount: number
  subtotal?: number
  taxAmount?: number
  currency: string
  status: string
  paymentStatus: string
  salesQuote?: {
    id: string
    quoteNumber: string
    name: string
  } | null
  salesOrder?: {
    id: string
    orderNumber: string
    name: string
  } | null
  createdBy: {
    id: string
    name: string | null
    email: string
  }
  payments: Array<{
    id: string
    amount: number
    paymentDate: string
    paymentMethod: string
  }>
}

function SalesInvoicesPageInner() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'WIRE',
    referenceNumber: '',
    notes: '',
  })
  const [recordingPayment, setRecordingPayment] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [statusFilter, paymentStatusFilter])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/finance/invoices?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        let invoicesList = data.invoices || []

        // Filter by payment status if needed
        if (paymentStatusFilter !== 'all') {
          invoicesList = invoicesList.filter((inv: Invoice) => {
            const totalPaid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0)
            const total = Number(inv.totalAmount)
            if (paymentStatusFilter === 'paid') return totalPaid >= total
            if (paymentStatusFilter === 'partial') return totalPaid > 0 && totalPaid < total
            if (paymentStatusFilter === 'unpaid') return totalPaid === 0
            return true
          })
        }

        // Filter by search term
        if (searchTerm) {
          invoicesList = invoicesList.filter((inv: Invoice) =>
            inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.subject.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }

        setInvoices(invoicesList)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/finance/invoices/${invoiceId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedInvoice(data.invoice)
        setViewDialogOpen(true)
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
    }
  }

  const handleRecordPayment = async () => {
    if (!selectedInvoice || !paymentForm.amount) return

    try {
      setRecordingPayment(true)
      const response = await fetch(`/api/finance/invoices/${selectedInvoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          paymentDate: paymentForm.paymentDate,
          paymentMethod: paymentForm.paymentMethod,
          referenceNumber: paymentForm.referenceNumber || undefined,
          notes: paymentForm.notes || undefined,
        }),
      })

      if (response.ok) {
        setPaymentDialogOpen(false)
        setPaymentForm({
          amount: '',
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'WIRE',
          referenceNumber: '',
          notes: '',
        })
        fetchInvoices()
        if (viewDialogOpen) {
          handleViewInvoice(selectedInvoice.id)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to record payment')
      }
    } catch (error) {
      console.error('Error recording payment:', error)
      alert('Failed to record payment')
    } finally {
      setRecordingPayment(false)
    }
  }

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/finance/export?type=INVOICE&id=${invoiceId}`, {
        method: 'GET',
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoiceId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download invoice PDF')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      DRAFT: { variant: 'secondary', label: 'Draft' },
      SENT: { variant: 'default', label: 'Sent' },
      VIEWED: { variant: 'default', label: 'Viewed' },
      PAID: { variant: 'default', label: 'Paid', className: 'bg-green-100 text-green-800' },
      OVERDUE: { variant: 'destructive', label: 'Overdue' },
      CANCELLED: { variant: 'outline', label: 'Cancelled' },
    }
    const config = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>
  }

  const getPaymentStatusBadge = (invoice: Invoice) => {
    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const total = Number(invoice.totalAmount)
    const balance = total - totalPaid

    if (totalPaid >= total) {
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>
    } else if (totalPaid > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
    } else {
      return <Badge variant="outline">Unpaid</Badge>
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  const filteredInvoices = invoices.filter((invoice) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        invoice.clientName.toLowerCase().includes(searchLower) ||
        invoice.subject.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  return (
    <SalesPageLayout
      title="Invoices & Payments"
      description="Manage invoices and track payments"
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
                <CardDescription>
                  Manage and track all invoices and payments
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading invoices...</div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No invoices found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
                    const total = Number(invoice.totalAmount)
                    const balance = total - totalPaid

                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.clientName}</TableCell>
                        <TableCell>{invoice.subject}</TableCell>
                        <TableCell>{format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{formatCurrency(total, invoice.currency)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getPaymentStatusBadge(invoice)}
                            {balance > 0 && (
                              <span className="text-xs text-muted-foreground">
                                Balance: {formatCurrency(balance, invoice.currency)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {invoice.salesQuote ? (
                            <Link
                              href={`/sales-dashboard/quotes/${invoice.salesQuote.id}`}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Quote: {invoice.salesQuote.quoteNumber}
                            </Link>
                          ) : invoice.salesOrder ? (
                            <Link
                              href={`/sales-dashboard/orders`}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Order: {invoice.salesOrder.orderNumber}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewInvoice(invoice.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPDF(invoice.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* View Invoice Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
              <DialogDescription>
                Invoice {selectedInvoice?.invoiceNumber}
              </DialogDescription>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Client</Label>
                    <p className="font-medium">{selectedInvoice.clientName}</p>
                    {selectedInvoice.clientEmail && (
                      <p className="text-sm text-muted-foreground">{selectedInvoice.clientEmail}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Invoice Date</Label>
                    <p className="font-medium">{format(new Date(selectedInvoice.invoiceDate), 'MMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Due Date</Label>
                    <p className="font-medium">{format(new Date(selectedInvoice.dueDate), 'MMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Subject</Label>
                  <p className="font-medium">{selectedInvoice.subject}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Line Items</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Line items would come from the API response */}
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Loading line items...
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>{formatCurrency(Number(selectedInvoice.subtotal || selectedInvoice.totalAmount), selectedInvoice.currency)}</span>
                    </div>
                    {(selectedInvoice.taxAmount ?? 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax:</span>
                        <span>{formatCurrency(Number(selectedInvoice.taxAmount), selectedInvoice.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(Number(selectedInvoice.totalAmount), selectedInvoice.currency)}</span>
                    </div>
                    {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                      <>
                        <div className="flex justify-between text-green-600">
                          <span>Paid:</span>
                          <span>
                            {formatCurrency(
                              selectedInvoice.payments.reduce((sum, p) => sum + Number(p.amount), 0),
                              selectedInvoice.currency
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-2">
                          <span>Balance:</span>
                          <span>
                            {formatCurrency(
                              Number(selectedInvoice.totalAmount) -
                              selectedInvoice.payments.reduce((sum, p) => sum + Number(p.amount), 0),
                              selectedInvoice.currency
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Payments</Label>
                  {selectedInvoice.payments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>{payment.paymentMethod}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(Number(payment.amount), selectedInvoice.currency)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">No payments recorded</p>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedInvoice(selectedInvoice)
                      setPaymentDialogOpen(true)
                    }}
                  >
                    Record Payment
                  </Button>
                  <Button onClick={() => handleDownloadPDF(selectedInvoice.id)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Record Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a payment for invoice {selectedInvoice?.invoiceNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select
                  value={paymentForm.paymentMethod}
                  onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WIRE">Wire Transfer</SelectItem>
                    <SelectItem value="CHECK">Check</SelectItem>
                    <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                    <SelectItem value="ACH">ACH</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  value={paymentForm.referenceNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Optional notes about this payment"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRecordPayment} disabled={recordingPayment || !paymentForm.amount}>
                {recordingPayment ? 'Recording...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SalesPageLayout>
  )
}

export default function SalesInvoicesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <SalesInvoicesPageInner />
    </Suspense>
  )
}
