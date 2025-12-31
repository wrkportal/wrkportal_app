'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface QuoteVersion {
  id: string
  quoteNumber: string
  versionNumber: number
  totalAmount: number
  status: string
  createdAt: string
  lineItems: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
}

export default function QuoteComparePage() {
  const params = useParams()
  const router = useRouter()
  const [versions, setVersions] = useState<QuoteVersion[]>([])
  const [selectedVersion1, setSelectedVersion1] = useState<string>('')
  const [selectedVersion2, setSelectedVersion2] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVersions()
  }, [params.id])

  const fetchVersions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sales/quotes/${params.id}/versions`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data)
        if (data.length >= 2) {
          setSelectedVersion1(data[0].id)
          setSelectedVersion2(data[1].id)
        } else if (data.length === 1) {
          setSelectedVersion1(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const version1 = versions.find((v) => v.id === selectedVersion1)
  const version2 = versions.find((v) => v.id === selectedVersion2)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      DRAFT: { variant: 'secondary', label: 'Draft' },
      SENT: { variant: 'default', label: 'Sent' },
      ACCEPTED: { variant: 'default', label: 'Accepted' },
    }
    const config = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <SalesPageLayout title="Compare Quote Versions" description="Compare different versions of a quote">
        <div className="text-center py-8">Loading...</div>
      </SalesPageLayout>
    )
  }

  if (versions.length < 2) {
    return (
      <SalesPageLayout title="Compare Quote Versions" description="Compare different versions of a quote">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">At least 2 versions are required for comparison</p>
          <Button asChild>
            <Link href={`/sales-dashboard/quotes/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quote
            </Link>
          </Button>
        </div>
      </SalesPageLayout>
    )
  }

  return (
    <SalesPageLayout
      title="Compare Quote Versions"
      description="Compare different versions of this quote"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link href={`/sales-dashboard/quotes/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quote
            </Link>
          </Button>
          <div className="flex gap-4">
            <Select value={selectedVersion1} onValueChange={setSelectedVersion1}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select version 1" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    Version {v.versionNumber} - {v.quoteNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedVersion2} onValueChange={setSelectedVersion2}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select version 2" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    Version {v.versionNumber} - {v.quoteNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {version1 && version2 && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Version {version1.versionNumber}</span>
                  {getStatusBadge(version1.status)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {version1.quoteNumber} • {format(new Date(version1.createdAt), 'MMM dd, yyyy')}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Line Items</p>
                    <div className="space-y-2">
                      {version1.lineItems.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm border-b pb-2">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-muted-foreground">
                              {item.quantity} × ${parseFloat(item.unitPrice.toString()).toFixed(2)}
                            </p>
                          </div>
                          <p className="font-medium">
                            ${parseFloat(item.totalPrice.toString()).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${(parseFloat(version1.totalAmount.toString()) / 1000).toFixed(1)}K</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Version {version2.versionNumber}</span>
                  {getStatusBadge(version2.status)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {version2.quoteNumber} • {format(new Date(version2.createdAt), 'MMM dd, yyyy')}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Line Items</p>
                    <div className="space-y-2">
                      {version2.lineItems.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm border-b pb-2">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-muted-foreground">
                              {item.quantity} × ${parseFloat(item.unitPrice.toString()).toFixed(2)}
                            </p>
                          </div>
                          <p className="font-medium">
                            ${parseFloat(item.totalPrice.toString()).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${(parseFloat(version2.totalAmount.toString()) / 1000).toFixed(1)}K</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {version1 && version2 && (
          <Card>
            <CardHeader>
              <CardTitle>Difference Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Difference:</span>
                  <span className={`font-bold ${
                    parseFloat(version2.totalAmount.toString()) > parseFloat(version1.totalAmount.toString())
                      ? 'text-green-600'
                      : parseFloat(version2.totalAmount.toString()) < parseFloat(version1.totalAmount.toString())
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    ${(
                      (parseFloat(version2.totalAmount.toString()) - parseFloat(version1.totalAmount.toString())) /
                      1000
                    ).toFixed(1)}K
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Percentage Change:</span>
                  <span className="font-medium">
                    {(
                      ((parseFloat(version2.totalAmount.toString()) - parseFloat(version1.totalAmount.toString())) /
                        parseFloat(version1.totalAmount.toString())) *
                      100
                    ).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SalesPageLayout>
  )
}

