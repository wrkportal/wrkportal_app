'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface InvoiceDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  invoiceId?: string
  projectId?: string
}

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  amount: number
}

export function InvoiceDialog({ open, onClose, onSuccess, invoiceId, projectId }: InvoiceDialogProps) {
  const [projects, setProjects] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '')
  const [selectedQuoteId, setSelectedQuoteId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return date.toISOString().split('T')[0]
  })
  const [currency, setCurrency] = useState('USD')
  const [status, setStatus] = useState<'DRAFT' | 'SENT' | 'VIEWED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED'>('DRAFT')
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 }
  ])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadProjects()
      if (invoiceId) {
        loadInvoice()
      } else {
        resetForm()
        generateInvoiceNumber()
      }
    }
  }, [open, invoiceId])

  useEffect(() => {
    if (selectedProjectId) {
      loadQuotes()
    }
  }, [selectedProjectId])

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

  const loadQuotes = async () => {
    // Quotes API not yet implemented - skip for now
    setQuotes([])
  }

  const loadInvoice = async () => {
    try {
      const response = await fetch(`/api/finance/invoices/${invoiceId}`)
      if (response.ok) {
        const data = await response.json()
        const inv = data.invoice
        setSelectedProjectId(inv.projectId || '')
        setSelectedQuoteId(inv.quoteId || '')
        setInvoiceNumber(inv.invoiceNumber)
        setClientName(inv.clientName)
        setClientEmail(inv.clientEmail || '')
        setClientAddress(inv.clientAddress || '')
        setIssueDate(new Date(inv.issueDate).toISOString().split('T')[0])
        setDueDate(new Date(inv.dueDate).toISOString().split('T')[0])
        setCurrency(inv.currency)
        setStatus(inv.status)
        setNotes(inv.notes || '')
        setTerms(inv.terms || '')
        setLineItems(inv.lineItems.map((item: any) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxRate: Number(item.taxRate),
          amount: Number(item.amount),
        })))
      }
    } catch (error) {
      console.error('Error loading invoice:', error)
    }
  }

  const generateInvoiceNumber = () => {
    const prefix = 'INV'
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    setInvoiceNumber(`${prefix}-${year}${month}-${random}`)
  }

  const resetForm = () => {
    setSelectedProjectId(projectId || '')
    setSelectedQuoteId('')
    setClientName('')
    setClientEmail('')
    setClientAddress('')
    setIssueDate(new Date().toISOString().split('T')[0])
    const date = new Date()
    date.setDate(date.getDate() + 30)
    setDueDate(date.toISOString().split('T')[0])
    setCurrency('USD')
    setStatus('DRAFT')
    setNotes('')
    setTerms('')
    setLineItems([{ description: '', quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 }])
  }

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 }])
  }

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...lineItems]
    const item = newItems[index]
    newItems[index] = { ...item, [field]: value }
    
    // Recalculate amount
    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice
    }
    
    setLineItems(newItems)
  }

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
    const tax = lineItems.reduce((sum, item) => sum + (item.amount * item.taxRate) / 100, 0)
    const total = subtotal + tax
    return { subtotal, tax, total }
  }

  const handleSave = async () => {
    if (!invoiceNumber || !clientName || !issueDate || !dueDate) {
      alert('Please fill in required fields')
      return
    }

    if (lineItems.length === 0 || lineItems.some(item => !item.description || item.amount <= 0)) {
      alert('Please add at least one valid line item')
      return
    }

    setIsLoading(true)
    try {
      const url = invoiceId
        ? `/api/finance/invoices/${invoiceId}`
        : '/api/finance/invoices'
      const method = invoiceId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId || undefined,
          quoteId: selectedQuoteId || undefined,
          invoiceNumber,
          clientName,
          clientEmail: clientEmail || undefined,
          clientAddress: clientAddress || undefined,
          issueDate,
          dueDate,
          currency,
          status,
          notes: notes || undefined,
          terms: terms || undefined,
          lineItems: lineItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            amount: item.amount,
          })),
        }),
      })

      if (response.ok) {
        onSuccess()
        handleClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save invoice')
      }
    } catch (error) {
      console.error('Error saving invoice:', error)
      alert('Failed to save invoice')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const { subtotal, tax, total } = calculateTotals()

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoiceId ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
          <DialogDescription>
            Create and manage invoices
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number *</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-2024-001"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project">Project (Optional)</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quote">Quote (Optional)</Label>
              <Select value={selectedQuoteId} onValueChange={setSelectedQuoteId} disabled={!selectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select quote" />
                </SelectTrigger>
                <SelectContent>
                  {quotes.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.quoteNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="clientName">Client Name *</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client company name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@example.com"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency *</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="CAD">CAD (C$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="clientAddress">Client Address</Label>
            <Textarea
              id="clientAddress"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Client billing address"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issueDate">Issue Date *</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Line Items *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-4">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-muted/50 rounded-lg">
                  <div className="col-span-4">
                    <Label className="text-xs">Description *</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Quantity *</Label>
                    <Input
                      type="number"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Unit Price *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Tax Rate %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.taxRate}
                      onChange={(e) => updateLineItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs">Amount</Label>
                    <Input
                      value={formatCurrency(item.amount)}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="text-lg font-medium">{formatCurrency(subtotal)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tax</p>
              <p className="text-lg font-medium">{formatCurrency(tax)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{formatCurrency(total)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Payment terms"
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

