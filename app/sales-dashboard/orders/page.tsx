'use client'

import { useState, useEffect, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { ShoppingCart, Plus, Eye, DollarSign, Package } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'

interface OrderItem {
  id: string
  orderNumber: string
  name: string
  status: string
  orderDate: string
  totalAmount: number
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
  } | null
  createdBy: {
    id: string
    name: string | null
    email: string
  }
}

function OrdersPageInner() {
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/sales/orders?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch orders' }))
        console.error('Error fetching orders:', errorData)
        setOrders([])
        return
      }

      const data = await response.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      DRAFT: { variant: 'secondary', label: 'Draft' },
      PENDING_APPROVAL: { variant: 'default', label: 'Pending Approval' },
      APPROVED: { variant: 'default', label: 'Approved' },
      IN_FULFILLMENT: { variant: 'default', label: 'In Fulfillment' },
      SHIPPED: { variant: 'default', label: 'Shipped' },
      DELIVERED: { variant: 'default', label: 'Delivered' },
      CANCELLED: { variant: 'destructive', label: 'Cancelled' },
      RETURNED: { variant: 'outline', label: 'Returned' },
    }
    const config = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <SalesPageLayout
      title="Orders"
      description="Process and track sales orders"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild>
            <Link href="/sales-dashboard/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="IN_FULFILLMENT">In Fulfillment</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="RETURNED">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders ({orders.length})</CardTitle>
            <CardDescription>Manage all sales orders and fulfillment</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No orders found. Create your first order to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Quote</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{order.name}</TableCell>
                      <TableCell>
                        {order.account ? (
                          <Link
                            href={`/sales-dashboard/accounts/${order.account.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {order.account.name}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {order.quote ? (
                          <Link
                            href={`/sales-dashboard/quotes/${order.quote.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {order.quote.quoteNumber}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          ${(order.totalAmount / 1000).toFixed(1)}K
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {format(new Date(order.orderDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{order.createdBy.name || order.createdBy.email}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/sales-dashboard/orders/${order.id}`}>
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

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <OrdersPageInner />
    </Suspense>
  )
}
