'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { Plus, Edit, Trash2, Eye, Download, CheckCircle2, XCircle, DollarSign } from 'lucide-react'
import { InvoiceDialog } from './invoice-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function InvoicesTab() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<string | undefined>()
  const [filterProject, setFilterProject] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  useEffect(() => {
    loadInvoices()
    loadProjects()
  }, [])

  useEffect(() => {
    loadInvoices()
  }, [filterProject, filterStatus])

  const loadInvoices = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filterProject) params.append('projectId', filterProject)
      if (filterStatus) params.append('status', filterStatus)

      const response = await fetch(`/api/finance/invoices?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error loading projects:', error)
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
      console.error('Error loading invoice:', error)
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return

    try {
      const response = await fetch(`/api/finance/invoices/${invoiceId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadInvoices()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete invoice')
      }
    } catch (error) {
      alert('Failed to delete invoice')
    }
  }

  const handleApproveInvoice = async (invoiceId: string, approved: boolean) => {
    try {
      const response = await fetch(`/api/finance/invoices/${invoiceId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, comments: '' }),
      })

      if (response.ok) {
        loadInvoices()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to process approval')
      }
    } catch (error) {
      alert('Failed to process approval')
    }
  }

  const handleExport = (format: 'excel' | 'pdf') => {
    const params = new URLSearchParams()
    params.append('type', 'INVOICE')
    params.append('format', format)
    if (filterProject) params.append('projectId', filterProject)

    window.open(`/api/finance/export?${params.toString()}`, '_blank')
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      DRAFT: { variant: 'secondary' as const, label: 'Draft' },
      SENT: { variant: 'default' as const, label: 'Sent' },
      VIEWED: { variant: 'default' as const, label: 'Viewed', className: 'bg-blue-500' },
      PARTIALLY_PAID: { variant: 'default' as const, label: 'Partially Paid', className: 'bg-amber-500' },
      PAID: { variant: 'default' as const, label: 'Paid', className: 'bg-green-500' },
      OVERDUE: { variant: 'default' as const, label: 'Overdue', className: 'bg-red-500' },
      CANCELLED: { variant: 'secondary' as const, label: 'Cancelled' },
    }
    const config = variants[status] || { variant: 'secondary' as const, label: status }
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>
  }

  const isOverdue = (invoice: any) => {
    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') return false
    const dueDate = new Date(invoice.dueDate)
    const today = new Date()
    return dueDate < today
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Billing and invoice management</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport('excel')}>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button variant="outline" onClick={() => handleExport('pdf')}>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button onClick={() => {
                setEditingInvoice(undefined)
                setInvoiceDialogOpen(true)
              }}>
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={filterProject || undefined} onValueChange={(value) => setFilterProject(value || '')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus || undefined} onValueChange={(value) => setFilterStatus(value || '')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="VIEWED">Viewed</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No invoices found</p>
              <Button onClick={() => setInvoiceDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Invoice
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const overdue = isOverdue(invoice)
                  return (
                    <TableRow key={invoice.id} className={overdue ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.clientName}</p>
                          {invoice.clientEmail && (
                            <p className="text-xs text-muted-foreground">{invoice.clientEmail}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{invoice.project?.name || 'N/A'}</TableCell>
                      <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell className={overdue ? 'text-red-600 font-medium' : ''}>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.total)}</TableCell>
                      <TableCell>{formatCurrency(invoice.paid)}</TableCell>
                      <TableCell className={invoice.balance > 0 ? 'font-medium' : ''}>
                        {formatCurrency(invoice.balance)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status)}
                        {overdue && <Badge variant="destructive" className="ml-2">Overdue</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(invoice.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {invoice.status === 'DRAFT' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingInvoice(invoice.id)
                                setInvoiceDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.status === 'DRAFT' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteInvoice(invoice.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.status === 'DRAFT' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApproveInvoice(invoice.id, true)}
                              className="text-green-600"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
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

      <InvoiceDialog
        open={invoiceDialogOpen}
        onClose={() => {
          setInvoiceDialogOpen(false)
          setEditingInvoice(undefined)
        }}
        onSuccess={() => {
          loadInvoices()
          setInvoiceDialogOpen(false)
          setEditingInvoice(undefined)
        }}
        invoiceId={editingInvoice}
      />

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice #{selectedInvoice?.invoiceNumber}</DialogTitle>
            <DialogDescription>Invoice details</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{selectedInvoice.clientName}</p>
                  {selectedInvoice.clientEmail && (
                    <p className="text-sm text-muted-foreground">{selectedInvoice.clientEmail}</p>
                  )}
                  {selectedInvoice.clientAddress && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedInvoice.clientAddress}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium">{selectedInvoice.project?.name || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Issue Date: {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Due Date: {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Line Items</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Tax Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.lineItems.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(Number(item.unitPrice))}</TableCell>
                          <TableCell>{item.taxRate}%</TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(item.amount))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p className="text-lg font-medium">{formatCurrency(selectedInvoice.subtotal)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tax</p>
                  <p className="text-lg font-medium">{formatCurrency(selectedInvoice.tax)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">{formatCurrency(selectedInvoice.total)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="text-lg font-medium">{formatCurrency(selectedInvoice.paid)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className={`text-lg font-bold ${selectedInvoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(selectedInvoice.balance)}
                  </p>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p>{selectedInvoice.notes}</p>
                </div>
              )}

              {selectedInvoice.terms && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Terms & Conditions</p>
                  <p>{selectedInvoice.terms}</p>
                </div>
              )}

              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Payment History</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.payments.map((payment: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                          <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                          <TableCell>{payment.paymentMethod}</TableCell>
                          <TableCell>{payment.referenceNumber || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

