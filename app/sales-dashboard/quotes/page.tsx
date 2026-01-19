'use client'

import { useState, useEffect } from 'react'
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
import { Quote, Plus, Search, Eye, DollarSign, FileText } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'

interface QuoteItem {
  id: string
  quoteNumber: string
  name: string
  status: string
  totalAmount: number
  validUntil: string | null
  account: {
    id: string
    name: string
  } | null
  opportunity: {
    id: string
    name: string
  } | null
  createdBy: {
    id: string
    name: string | null
    email: string
  }
  createdAt: string
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchQuotes()
  }, [statusFilter])

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/sales/quotes?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch quotes' }))
        console.error('Error fetching quotes:', errorData)
        setQuotes([])
        return
      }

      const data = await response.json()
      setQuotes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching quotes:', error)
      setQuotes([])
    } finally {
      setLoading(false)
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

  return (
    <SalesPageLayout>
      <div className="space-y-6">
        {/* Header with Title and Create Button */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Pricing</h2>
            <p className="text-sm text-muted-foreground mt-1">Create and manage professional pricing quotes</p>
          </div>
          <Button asChild>
            <Link href="/sales-dashboard/quotes/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Quote
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
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing ({quotes.length})</CardTitle>
          <CardDescription>Manage all pricing quotes and proposals</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pricing quotes found. Create your first quote to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                    <TableCell>{quote.name}</TableCell>
                    <TableCell>
                      {quote.account ? (
                        <Link
                          href={`/sales-dashboard/accounts/${quote.account.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {quote.account.name}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {quote.opportunity ? (
                        <Link
                          href={`/sales-dashboard/opportunities/${quote.opportunity.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {quote.opportunity.name}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        ${(quote.totalAmount / 1000).toFixed(1)}K
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell>
                      {quote.validUntil
                        ? format(new Date(quote.validUntil), 'MMM dd, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>{quote.createdBy.name || quote.createdBy.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/sales-dashboard/quotes/${quote.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            window.open(`/api/sales/quotes/${quote.id}/pdf`, '_blank')
                          }}
                          title="Download PDF"
                        >
                          <FileText className="h-4 w-4" />
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

