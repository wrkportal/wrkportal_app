'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import {
  ArrowLeft,
  DollarSign,
  Download,
  Package,
  Building2,
  Target,
  FileText,
} from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface OrderDetail {
  id: string
  orderNumber: string
  name: string
  description: string | null
  status: string
  orderDate: string
  requestedShipDate: string | null
  subtotal: number
  taxAmount: number
  taxRate: number
  shippingAmount: number
  discount: number
  totalAmount: number
  currency: string
  paymentTerms: string | null
  shippingAddress: any
  billingAddress: any
  notes: string | null
  account: {
    id: string
    name: string
  } | null
  opportunity: {
    id: string
    name: string
  } | null
  quote: {
    id: string
    quoteNumber: string
    name: string
  } | null
  lineItems: Array<{
    id: string
    name: string
    description: string | null
    quantity: number
    unitPrice: number
    discount: number
    totalPrice: number
    product: {
      id: string
      name: string
      code: string | null
    } | null
  }>
  createdBy: {
    id: string
    name: string | null
    email: string
  }
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const orderId = params?.id as string

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingInvoice, setCreatingInvoice] = useState(false)

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sales/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
      } else {
        console.error('Failed to fetch order')
        toast({
          title: 'Error',
          description: 'Failed to fetch order',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch order',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvoice = async () => {
    if (!confirm('Create an invoice from this order? This will generate a new invoice with all order line items.')) {
      return
    }

    try {
      setCreatingInvoice(true)
      const response = await fetch(`/api/sales/orders/${orderId}/invoice`, {
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      DRAFT: { variant: 'secondary', label: 'Draft' },
      PENDING_APPROVAL: { variant: 'default', label: 'Pending Approval' },
      APPROVED: { variant: 'default', label: 'Approved' },
      IN_FULFILLMENT: { variant: 'default', label: 'In Fulfillment' },
      SHIPPED: { variant: 'default', label: 'Shipped' },
      DELIVERED: { variant: 'default', label: 'Delivered', className: 'bg-green-100 text-green-800' },
      CANCELLED: { variant: 'destructive', label: 'Cancelled' },
      RETURNED: { variant: 'outline', label: 'Returned' },
    }
    const config = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  if (loading) {
    return (
      <SalesPageLayout title="Order Details" description="View order information">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">Loading order...</div>
          </div>
        </div>
      </SalesPageLayout>
    )
  }

  if (!order) {
    return (
      <SalesPageLayout title="Order Details" description="View order information">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">Order not found</div>
            <Button onClick={() => router.push('/sales-dashboard/orders')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </div>
        </div>
      </SalesPageLayout>
    )
  }

  return (
    <SalesPageLayout title="Order Details" description="View and manage order information">
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/sales-dashboard/orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Orders
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {getStatusBadge(order.status)}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleCreateInvoice}
              disabled={creatingInvoice || order.status === 'CANCELLED'}
              title={order.status === 'CANCELLED' ? 'Cannot create invoice for cancelled order' : 'Create Invoice'}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              {creatingInvoice ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{order.name}</h3>
                  <p className="text-sm text-muted-foreground">Order #{order.orderNumber}</p>
                </div>

                {order.description && (
                  <div>
                    <p className="text-sm">{order.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-medium">{format(new Date(order.orderDate), 'MMM dd, yyyy')}</p>
                  </div>
                  {order.requestedShipDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Requested Ship Date</p>
                      <p className="font-medium">{format(new Date(order.requestedShipDate), 'MMM dd, yyyy')}</p>
                    </div>
                  )}
                  {order.paymentTerms && (
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Terms</p>
                      <p className="font-medium">{order.paymentTerms}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle>Line Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.description && (
                              <div className="text-sm text-muted-foreground">{item.description}</div>
                            )}
                            {item.product?.code && (
                              <div className="text-xs text-muted-foreground">SKU: {item.product.code}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{Number(item.quantity).toFixed(2)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.unitPrice), order.currency)}</TableCell>
                        <TableCell className="text-right">
                          {item.discount > 0 ? `${Number(item.discount).toFixed(2)}%` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(item.totalPrice), order.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Totals */}
                <div className="mt-6 flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>{formatCurrency(Number(order.subtotal), order.currency)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount:</span>
                        <span>-{formatCurrency(Number(order.discount), order.currency)}</span>
                      </div>
                    )}
                    {order.shippingAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping:</span>
                        <span>{formatCurrency(Number(order.shippingAmount), order.currency)}</span>
                      </div>
                    )}
                    {order.taxAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax:</span>
                        <span>{formatCurrency(Number(order.taxAmount), order.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(Number(order.totalAmount), order.currency)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Records */}
            {order.account && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link 
                    href={`/sales-dashboard/accounts/${order.account.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {order.account.name}
                  </Link>
                </CardContent>
              </Card>
            )}

            {order.opportunity && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Opportunity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link 
                    href={`/sales-dashboard/opportunities/${order.opportunity.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {order.opportunity.name}
                  </Link>
                </CardContent>
              </Card>
            )}

            {order.quote && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quote</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link 
                    href={`/sales-dashboard/quotes/${order.quote.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {order.quote.quoteNumber} - {order.quote.name}
                  </Link>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Created By</p>
                  <p className="text-sm font-medium">{order.createdBy.name || order.createdBy.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Currency</p>
                  <p className="text-sm font-medium">{order.currency}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SalesPageLayout>
  )
}

