'use client'

import React, { useState, useEffect, Suspense } from 'react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { Plus, Edit, Trash2, Building2, TrendingUp, DollarSign, Package, Upload, FileSpreadsheet } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

interface ForecastItem {
  id: string
  accountId: string
  period: string
  forecastType: string
  forecastedAmount: number
  revenue: number
  unitPrice: number | null
  volume: number | null
  actualAmount: number
  account: {
    id: string
    name: string
    email: string | null
    type: string
  }
}

interface Account {
  id: string
  name: string
  email: string | null
}

function getCurrentPeriod() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function ForecastPageInner() {
  const { toast } = useToast()
  const [forecasts, setForecasts] = useState<ForecastItem[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<string>(getCurrentPeriod())
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedForecast, setSelectedForecast] = useState<ForecastItem | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    accountId: '',
    period: getCurrentPeriod(),
    forecastType: 'MONTHLY',
    unitPrice: '',
    volume: '',
    forecastedAmount: '',
  })

  useEffect(() => {
    fetchForecasts()
    fetchAccounts()
  }, [period])

  const fetchForecasts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (period) {
        params.append('period', period)
      }

      const response = await fetch(`/api/sales/forecast?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch forecasts' }))
        console.error('Error fetching forecasts:', errorData)
        setForecasts([])
        return
      }

      const data = await response.json()
      setForecasts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching forecasts:', error)
      setForecasts([])
    } finally {
      setLoading(false)
    }
  }

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

  const handleCreateForecast = async () => {
    if (!formData.accountId) {
      toast({
        title: 'Error',
        description: 'Please select a client',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/sales/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: formData.accountId,
          period: formData.period,
          forecastType: formData.forecastType,
          unitPrice: formData.unitPrice || null,
          volume: formData.volume || null,
          forecastedAmount: formData.forecastedAmount || null,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Forecast created successfully',
        })
        setCreateDialogOpen(false)
        setFormData({
          accountId: '',
          period: getCurrentPeriod(),
          forecastType: 'MONTHLY',
          unitPrice: '',
          volume: '',
          forecastedAmount: '',
        })
        fetchForecasts()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to create forecast',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error creating forecast:', error)
      toast({
        title: 'Error',
        description: 'Failed to create forecast',
        variant: 'destructive',
      })
    }
  }

  const handleEditForecast = (forecast: ForecastItem) => {
    setSelectedForecast(forecast)
    setFormData({
      accountId: forecast.accountId,
      period: forecast.period,
      forecastType: forecast.forecastType,
      unitPrice: forecast.unitPrice?.toString() || '',
      volume: forecast.volume?.toString() || '',
      forecastedAmount: forecast.revenue.toString(),
    })
    setEditDialogOpen(true)
  }

  const handleUpdateForecast = async () => {
    if (!selectedForecast) return

    try {
      const response = await fetch(`/api/sales/forecast/${selectedForecast.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: formData.period,
          forecastType: formData.forecastType,
          unitPrice: formData.unitPrice || null,
          volume: formData.volume || null,
          forecastedAmount: formData.forecastedAmount || null,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Forecast updated successfully',
        })
        setEditDialogOpen(false)
        setSelectedForecast(null)
        fetchForecasts()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to update forecast',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating forecast:', error)
      toast({
        title: 'Error',
        description: 'Failed to update forecast',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteForecast = async (id: string) => {
    if (!confirm('Are you sure you want to delete this forecast?')) return

    try {
      const response = await fetch(`/api/sales/forecast/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Forecast deleted successfully',
        })
        fetchForecasts()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete forecast',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting forecast:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete forecast',
        variant: 'destructive',
      })
    }
  }

  // Calculate revenue when unitPrice or volume changes
  useEffect(() => {
    if (formData.unitPrice && formData.volume) {
      const price = parseFloat(formData.unitPrice)
      const vol = parseFloat(formData.volume)
      if (!isNaN(price) && !isNaN(vol)) {
        setFormData((prev) => ({
          ...prev,
          forecastedAmount: (price * vol).toFixed(2),
        }))
      }
    }
  }, [formData.unitPrice, formData.volume])

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/sales/forecast/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: result.message || `Successfully uploaded ${result.results.success.length} forecast(s)`,
        })

        // Show errors if any
        if (result.results.errors && result.results.errors.length > 0) {
          const errorCount = result.results.errors.length
          toast({
            title: 'Partial Success',
            description: `${errorCount} row(s) had errors. Check console for details.`,
            variant: 'default',
          })
          console.error('Upload errors:', result.results.errors)
        }

        setUploadDialogOpen(false)
        fetchForecasts() // Refresh the forecast list
        fetchAccounts() // Refresh accounts in case new ones were needed
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to upload forecast file',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload forecast file',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      // Reset input
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const totalForecasted = forecasts.reduce(
    (sum, f) => sum + parseFloat(f.revenue.toString()),
    0
  )

  return (
    <SalesPageLayout
      title="Sales Forecast"
      description="Manage revenue forecasts at client level"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {generatePeriods().map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Excel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Forecast from Excel</DialogTitle>
                  <DialogDescription>
                    Upload an Excel file (.xlsx, .xls) with forecast data.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="excel-file">Select Excel File</Label>
                    <Input
                      id="excel-file"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelUpload}
                      disabled={isUploading}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Supported formats: .xlsx, .xls
                    </p>
                  </div>
                  {isUploading && (
                    <div className="text-sm text-muted-foreground">
                      Processing file...
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold">Expected columns:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Client Name / Account Name (required)</li>
                      <li>Period (required, format: YYYY-MM)</li>
                      <li>Unit Price (optional)</li>
                      <li>Volume (optional)</li>
                      <li>Revenue / Forecasted Amount (required if Price × Volume not provided)</li>
                      <li>Forecast Type (optional: MONTHLY, QUARTERLY, YEARLY)</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Forecast
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Forecast</DialogTitle>
                  <DialogDescription>
                    Create a forecast for a client/account
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="create-account">Client/Account *</Label>
                    <Select
                      value={formData.accountId}
                      onValueChange={(value) => setFormData({ ...formData, accountId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="create-period">Period *</Label>
                      <Input
                        id="create-period"
                        type="month"
                        value={formData.period}
                        onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="create-forecast-type">Forecast Type</Label>
                      <Select
                        value={formData.forecastType}
                        onValueChange={(value) => setFormData({ ...formData, forecastType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                          <SelectItem value="YEARLY">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="create-unit-price">Unit Price</Label>
                      <Input
                        id="create-unit-price"
                        type="number"
                        step="0.01"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="create-volume">Volume (Units)</Label>
                      <Input
                        id="create-volume"
                        type="number"
                        step="0.01"
                        value={formData.volume}
                        onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="create-revenue">Revenue (Auto-calculated)</Label>
                    <Input
                      id="create-revenue"
                      type="number"
                      step="0.01"
                      value={formData.forecastedAmount}
                      onChange={(e) => setFormData({ ...formData, forecastedAmount: e.target.value })}
                      placeholder="0.00"
                      readOnly={!!(formData.unitPrice && formData.volume)}
                    />
                    {formData.unitPrice && formData.volume && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Auto-calculated from Price × Volume
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateForecast}>
                      Create Forecast
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Forecast Summary</CardTitle>
            <CardDescription>Total forecasted revenue for {period}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${(totalForecasted / 1000).toFixed(1)}K
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {forecasts.length} client{forecasts.length !== 1 ? 's' : ''} forecasted
            </p>
          </CardContent>
        </Card>

        {/* Forecast Table */}
        <Card>
          <CardHeader>
            <CardTitle>Client Forecasts</CardTitle>
            <CardDescription>
              View and manage forecasts by client for {period}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : forecasts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No forecasts found for this period. Create a forecast to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecasts.map((forecast) => (
                    <TableRow key={forecast.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {forecast.account.name}
                        </div>
                      </TableCell>
                      <TableCell>{forecast.period}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{forecast.forecastType}</Badge>
                      </TableCell>
                      <TableCell>
                        {forecast.unitPrice ? (
                          <>${parseFloat(forecast.unitPrice.toString()).toFixed(2)}</>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {forecast.volume ? (
                          parseFloat(forecast.volume.toString()).toLocaleString()
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          ${(parseFloat(forecast.revenue.toString()) / 1000).toFixed(1)}K
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditForecast(forecast)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteForecast(forecast.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Forecast</DialogTitle>
              <DialogDescription>
                Update forecast details for {selectedForecast?.account.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="edit-period">Period *</Label>
                  <Input
                    id="edit-period"
                    type="month"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-forecast-type">Forecast Type</Label>
                  <Select
                    value={formData.forecastType}
                    onValueChange={(value) => setFormData({ ...formData, forecastType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="edit-unit-price">Unit Price</Label>
                  <Input
                    id="edit-unit-price"
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-volume">Volume (Units)</Label>
                  <Input
                    id="edit-volume"
                    type="number"
                    step="0.01"
                    value={formData.volume}
                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-revenue">Revenue (Auto-calculated)</Label>
                <Input
                  id="edit-revenue"
                  type="number"
                  step="0.01"
                  value={formData.forecastedAmount}
                  onChange={(e) => setFormData({ ...formData, forecastedAmount: e.target.value })}
                  placeholder="0.00"
                  readOnly={!!(formData.unitPrice && formData.volume)}
                />
                {formData.unitPrice && formData.volume && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-calculated from Price × Volume
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateForecast}>
                  Update Forecast
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SalesPageLayout>
  )
}

export default function ForecastPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <ForecastPageInner />
    </Suspense>
  )
}

function generatePeriods() {
  const periods: string[] = []
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  // Generate months for current year and next year
  for (let year = currentYear; year <= currentYear + 1; year++) {
    const startMonth = year === currentYear ? currentMonth : 0
    const endMonth = year === currentYear ? 11 : 11

    for (let month = startMonth; month <= endMonth; month++) {
      const monthStr = String(month + 1).padStart(2, '0')
      periods.push(`${year}-${monthStr}`)
    }
  }

  return periods
}
