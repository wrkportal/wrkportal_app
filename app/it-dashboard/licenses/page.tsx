'use client'

import { useState, useEffect } from 'react'
import { ITPageLayout } from '@/components/it/it-page-layout'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts'
import { 
  Plus, 
  Search, 
  Key,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

interface License {
  id: string
  software: string
  vendor: string
  licenseType: string
  totalLicenses: number
  usedLicenses: number
  expiryDate: string
  status: string
  cost: number
  renewalDate: string
}

const COLORS = ['#9333ea', '#10b981', '#f59e0b', '#ef4444']

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [licenseStats, setLicenseStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
    totalCost: 0,
  })

  useEffect(() => {
    fetchLicenses()
  }, [])

  const fetchLicenses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/it/licenses')
      if (!response.ok) throw new Error('Failed to fetch licenses')
      const data = await response.json()
      setLicenses(data.licenses || [])
      setLicenseStats(data.stats || {
        total: 0,
        active: 0,
        expiringSoon: 0,
        expired: 0,
        totalCost: 0,
      })
    } catch (error) {
      console.error('Error fetching licenses:', error)
      setLicenses([])
      setLicenseStats({
        total: 0,
        active: 0,
        expiringSoon: 0,
        expired: 0,
        totalCost: 0,
      })
    } finally {
      setLoading(false)
    }
  }
      renewalDate: '2025-05-01',
    },
    {
      id: 'LIC-003',
      software: 'Windows Server License',
      vendor: 'Microsoft',
      licenseType: 'Perpetual',
      totalLicenses: 10,
      usedLicenses: 8,
      expiryDate: 'N/A',
      status: 'ACTIVE',
      cost: 5000,
      renewalDate: 'N/A',
    },
    {
      id: 'LIC-004',
      software: 'Antivirus Enterprise',
      vendor: 'Symantec',
      licenseType: 'Annual',
      totalLicenses: 520,
      usedLicenses: 520,
      expiryDate: '2025-03-15',
      status: 'EXPIRING_SOON',
      cost: 8000,
      renewalDate: '2025-02-01',
    },
  ])

  const licenseStats = {
    total: licenses.length,
    active: licenses.filter(l => l.status === 'ACTIVE').length,
    expiringSoon: licenses.filter(l => l.status === 'EXPIRING_SOON').length,
    expired: licenses.filter(l => l.status === 'EXPIRED').length,
    totalCost: licenses.reduce((sum, l) => sum + l.cost, 0),
  }

  const statusData = [
    { name: 'Active', value: licenseStats.active },
    { name: 'Expiring Soon', value: licenseStats.expiringSoon },
    { name: 'Expired', value: licenseStats.expired },
  ]

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default'
      case 'EXPIRING_SOON':
        return 'destructive'
      case 'EXPIRED':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    if (expiryDate === 'N/A') return null
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <ITPageLayout 
      title="Software Licenses" 
      description="Manage software licenses, subscriptions, and renewals"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{licenseStats.total}</div>
              <p className="text-xs text-muted-foreground">License agreements</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{licenseStats.active}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{licenseStats.expiringSoon}</div>
              <p className="text-xs text-muted-foreground">Within 90 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(licenseStats.totalCost / 1000).toFixed(0)}K</div>
              <p className="text-xs text-muted-foreground">Annual cost</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>License Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Licenses Table */}
        <Card>
          <CardHeader>
            <CardTitle>Software Licenses</CardTitle>
            <CardDescription>
              {licenses.length} license(s) managed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License ID</TableHead>
                  <TableHead>Software</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Days Until Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((license) => {
                  const daysUntilExpiry = getDaysUntilExpiry(license.expiryDate)
                  return (
                    <TableRow key={license.id}>
                      <TableCell className="font-medium">{license.id}</TableCell>
                      <TableCell className="font-medium">{license.software}</TableCell>
                      <TableCell>{license.vendor}</TableCell>
                      <TableCell>{license.licenseType}</TableCell>
                      <TableCell>
                        {license.usedLicenses} / {license.totalLicenses}
                        <div className="w-32 bg-muted rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(license.usedLicenses / license.totalLicenses) * 100}%` }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {license.expiryDate === 'N/A' ? 'N/A' : new Date(license.expiryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {daysUntilExpiry !== null ? (
                          <span className={daysUntilExpiry < 90 ? 'text-red-600 font-medium' : ''}>
                            {daysUntilExpiry} days
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(license.status)}>
                          {license.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit License
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="mr-2 h-4 w-4" />
                              Renew License
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ITPageLayout>
  )
}

