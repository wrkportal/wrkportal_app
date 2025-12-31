'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Plus, Trash2, Save, X } from 'lucide-react'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/use-toast'

interface Account {
  id: string
  name: string
}

interface Opportunity {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
}

interface LineItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export default function NewQuotePage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; description: string | null }>>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('none')
  const [formData, setFormData] = useState({
    accountId: 'none',
    opportunityId: 'none',
    name: '',
    description: '',
    validUntil: '',
    taxRate: '0',
    discount: '0',
    discountType: 'AMOUNT',
    terms: '',
    notes: '',
  })
  const [lineItems, setLineItems] = useState<LineItem[]>([])

  useEffect(() => {
    fetchAccounts()
    fetchOpportunities()
    fetchProducts()
    fetchTemplates()
  }, [])

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
      const response = await fetch('/api/sales/opportunities')
      if (response.ok) {
        const data = await response.json()
        setOpportunities(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/sales/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/sales/quotes/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplateId(templateId)
    if (templateId === 'none') return

    try {
      const response = await fetch(`/api/sales/quotes/templates/${templateId}`)
      if (response.ok) {
        const template = await response.json()
        if (template.templateData) {
          // Load template data into form
          const data = template.templateData as any
          if (data.lineItems) {
            setLineItems(data.lineItems.map((item: any) => ({
              productId: item.productId || 'manual',
              productName: item.name || 'New Item',
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0,
              totalPrice: item.totalPrice || 0,
            })))
          }
          if (data.taxRate !== undefined) setFormData({ ...formData, taxRate: data.taxRate.toString() })
          if (data.discount !== undefined) setFormData({ ...formData, discount: data.discount.toString() })
          if (data.discountType) setFormData({ ...formData, discountType: data.discountType })
          if (data.terms) setFormData({ ...formData, terms: data.terms })
        }
      }
    } catch (error) {
      console.error('Error loading template:', error)
    }
  }

  const handleAddLineItem = () => {
    // If no products available, create a manual line item
    if (products.length === 0) {
      setLineItems([
        ...lineItems,
        {
          productId: 'manual',
          productName: 'New Item',
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
        },
      ])
      return
    }

    const defaultProduct = products[0]
    setLineItems([
      ...lineItems,
      {
        productId: defaultProduct.id,
        productName: defaultProduct.name,
        quantity: 1,
        unitPrice: parseFloat(defaultProduct.unitPrice.toString()),
        totalPrice: parseFloat(defaultProduct.unitPrice.toString()),
      },
    ])
  }

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const handleLineItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }

    if (field === 'productId') {
      const product = products.find((p) => p.id === value)
      if (product) {
        updated[index].productName = product.name
        updated[index].unitPrice = parseFloat(product.unitPrice.toString())
        updated[index].totalPrice =
          updated[index].quantity * parseFloat(product.unitPrice.toString())
      }
    } else if (field === 'quantity' || field === 'unitPrice') {
      updated[index].totalPrice = updated[index].quantity * updated[index].unitPrice
    }

    setLineItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      toast({
        title: 'Error',
        description: 'Quote name is required',
        variant: 'destructive',
      })
      return
    }

    if (lineItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one line item',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/sales/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          accountId: formData.accountId && formData.accountId !== 'none' ? formData.accountId : null,
          opportunityId: formData.opportunityId && formData.opportunityId !== 'none' ? formData.opportunityId : null,
          lineItems: lineItems.map((item) => ({
            productId: item.productId && item.productId !== 'manual' ? item.productId : null,
            name: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Quote created successfully',
        })
        router.push('/sales-dashboard/quotes')
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to create quote',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error creating quote:', error)
      toast({
        title: 'Error',
        description: 'Failed to create quote',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const discountAmount =
    formData.discountType === 'PERCENTAGE'
      ? (subtotal * parseFloat(formData.discount || '0')) / 100
      : parseFloat(formData.discount || '0')
  const afterDiscount = subtotal - discountAmount
  const taxAmount = (afterDiscount * parseFloat(formData.taxRate || '0')) / 100
  const totalAmount = afterDiscount + taxAmount

  return (
    <SalesPageLayout
      title="Create Quote"
      description="Create a new sales quote for your customer"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter quote details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="template">Template (Optional)</Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None - Start from scratch</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templates.length === 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  No templates available. Create a template by saving a quote as a template.
                </p>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Quote Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Q1 2024 Proposal"
                  required
                />
              </div>
              <div>
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Quote description..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="accountId">Account</Label>
                <Select
                  value={formData.accountId}
                  onValueChange={(value) => setFormData({ ...formData, accountId: value })}
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
                <Label htmlFor="opportunityId">Opportunity</Label>
                <Select
                  value={formData.opportunityId}
                  onValueChange={(value) => setFormData({ ...formData, opportunityId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select opportunity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {opportunities.map((opportunity) => (
                      <SelectItem key={opportunity.id} value={opportunity.id}>
                        {opportunity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Line Items</CardTitle>
                <CardDescription>Add products or services to the quote</CardDescription>
              </div>
              <Button type="button" onClick={handleAddLineItem} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {lineItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No line items. Click "Add Item" to add products.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {products.length > 0 ? (
                          <Select
                            value={item.productId}
                            onValueChange={(value) =>
                              handleLineItemChange(index, 'productId', value)
                            }
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">Manual Entry</SelectItem>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={item.productName}
                            onChange={(e) =>
                              handleLineItemChange(index, 'productName', e.target.value)
                            }
                            placeholder="Product name"
                            className="w-[200px]"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleLineItemChange(
                              index,
                              'quantity',
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleLineItemChange(
                              index,
                              'unitPrice',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>${item.totalPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLineItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pricing & Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Terms</CardTitle>
            <CardDescription>Configure pricing, discounts, and terms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="discountType">Discount Type</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value) => setFormData({ ...formData, discountType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AMOUNT">Amount</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discount">Discount</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                step="0.01"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                placeholder="Payment terms, delivery terms, etc."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal notes..."
                rows={2}
              />
            </div>

            {/* Summary */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount:</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax:</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Creating...' : 'Create Quote'}
          </Button>
        </div>
      </form>
    </SalesPageLayout>
  )
}

