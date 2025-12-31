'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Badge } from '@/components/ui/badge'
import {
    Database,
    Search,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Eye,
    Share2,
    FileText,
    BarChart3,
    GitBranch,
    Shield,
    Filter,
    Download,
    Loader2,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/lib/utils'

export default function DataGovernancePage() {
    const currentUser = useAuthStore((state) => state.user)
    const [activeTab, setActiveTab] = useState('catalog')
    const [isLoading, setIsLoading] = useState(true)
    
    // Data Catalog
    const [catalogEntries, setCatalogEntries] = useState<any[]>([])
    const [catalogSearch, setCatalogSearch] = useState('')
    const [catalogCategory, setCatalogCategory] = useState('ALL')
    
    // Data Lineage
    const [lineageData, setLineageData] = useState<any>(null)
    const [lineageResourceType, setLineageResourceType] = useState('dataset')
    const [lineageResourceId, setLineageResourceId] = useState('')
    
    // Data Quality
    const [qualityMetrics, setQualityMetrics] = useState<any[]>([])
    const [qualityResourceType, setQualityResourceType] = useState('dataset')
    const [qualityResourceId, setQualityResourceId] = useState('')
    
    // Usage Analytics
    const [usageStats, setUsageStats] = useState<any>(null)
    const [usageResourceType, setUsageResourceType] = useState('dataset')
    const [usageResourceId, setUsageResourceId] = useState('')
    
    // Compliance Reports
    const [complianceReports, setComplianceReports] = useState<any[]>([])

    const isAdmin = currentUser?.role === 'ORG_ADMIN' || 
                   currentUser?.role === 'TENANT_SUPER_ADMIN' || 
                   currentUser?.role === 'PLATFORM_OWNER' ||
                   currentUser?.role === 'COMPLIANCE_AUDITOR'

    useEffect(() => {
        if (isAdmin) {
            fetchData()
        }
    }, [activeTab, catalogCategory, catalogSearch])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            if (activeTab === 'catalog') {
                const params = new URLSearchParams()
                if (catalogSearch) params.append('search', catalogSearch)
                if (catalogCategory !== 'ALL') params.append('category', catalogCategory)
                const res = await fetch(`/api/governance/catalog?${params}`)
                if (res.ok) {
                    const data = await res.json()
                    setCatalogEntries(data.entries || [])
                }
            } else if (activeTab === 'quality' && qualityResourceId) {
                const res = await fetch(
                    `/api/governance/quality?resourceType=${qualityResourceType}&resourceId=${qualityResourceId}&summary=true`
                )
                if (res.ok) {
                    const data = await res.json()
                    setQualityMetrics([data.summary])
                }
            } else if (activeTab === 'usage' && usageResourceId) {
                const res = await fetch(
                    `/api/governance/usage?resourceType=${usageResourceType}&resourceId=${usageResourceId}&type=stats`
                )
                if (res.ok) {
                    const data = await res.json()
                    setUsageStats(data.stats)
                }
            } else if (activeTab === 'lineage' && lineageResourceId) {
                const res = await fetch(
                    `/api/governance/lineage?resourceType=${lineageResourceType}&resourceId=${lineageResourceId}&direction=both`
                )
                if (res.ok) {
                    const data = await res.json()
                    setLineageData(data.lineage)
                }
            } else if (activeTab === 'compliance') {
                const res = await fetch('/api/governance/compliance/reports')
                if (res.ok) {
                    const data = await res.json()
                    setComplianceReports(data.reports || [])
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isAdmin) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground">
                            You don't have permission to access this page.
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Shield className="h-8 w-8" />
                        Data Governance
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage data catalog, lineage, quality, and compliance
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="catalog">Data Catalog</TabsTrigger>
                    <TabsTrigger value="lineage">Data Lineage</TabsTrigger>
                    <TabsTrigger value="quality">Data Quality</TabsTrigger>
                    <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance Reports</TabsTrigger>
                </TabsList>

                {/* Data Catalog Tab */}
                <TabsContent value="catalog" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Data Catalog</CardTitle>
                            <CardDescription>
                                Browse and manage data assets in your organization
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Search catalog..."
                                        value={catalogSearch}
                                        onChange={(e) => setCatalogSearch(e.target.value)}
                                        className="max-w-sm"
                                    />
                                </div>
                                <Select value={catalogCategory} onValueChange={setCatalogCategory}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Categories</SelectItem>
                                        <SelectItem value="datasets">Datasets</SelectItem>
                                        <SelectItem value="dashboards">Dashboards</SelectItem>
                                        <SelectItem value="reports">Reports</SelectItem>
                                        <SelectItem value="tables">Database Tables</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Classification</TableHead>
                                            <TableHead>Owner</TableHead>
                                            <TableHead>Updated</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {catalogEntries.map((entry) => (
                                            <TableRow key={entry.id}>
                                                <TableCell className="font-medium">
                                                    {entry.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{entry.resourceType}</Badge>
                                                </TableCell>
                                                <TableCell>{entry.category || 'N/A'}</TableCell>
                                                <TableCell>
                                                    {entry.classification ? (
                                                        <Badge variant="secondary">
                                                            {entry.classification}
                                                        </Badge>
                                                    ) : (
                                                        'N/A'
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {entry.owner?.email || 'Unassigned'}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDate(entry.updatedAt)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {catalogEntries.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                    No catalog entries found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Data Lineage Tab */}
                <TabsContent value="lineage" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Data Lineage</CardTitle>
                            <CardDescription>
                                Track data dependencies and relationships
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-4">
                                <Select value={lineageResourceType} onValueChange={setLineageResourceType}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dataset">Dataset</SelectItem>
                                        <SelectItem value="dashboard">Dashboard</SelectItem>
                                        <SelectItem value="report">Report</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    placeholder="Resource ID"
                                    value={lineageResourceId}
                                    onChange={(e) => setLineageResourceId(e.target.value)}
                                    className="max-w-sm"
                                />
                                <Button onClick={fetchData}>
                                    <GitBranch className="h-4 w-4 mr-2" />
                                    View Lineage
                                </Button>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : lineageData ? (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold mb-2">Upstream (Sources)</h3>
                                        {lineageData.upstream?.length > 0 ? (
                                            <div className="space-y-2">
                                                {lineageData.upstream.map((item: any) => (
                                                    <div key={item.id} className="p-3 border rounded">
                                                        <div className="flex items-center gap-2">
                                                            <Badge>{item.sourceType}</Badge>
                                                            <span>{item.sourceId}</span>
                                                            <Badge variant="outline">
                                                                {item.relationshipType}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">No upstream dependencies</p>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-2">Downstream (Dependencies)</h3>
                                        {lineageData.downstream?.length > 0 ? (
                                            <div className="space-y-2">
                                                {lineageData.downstream.map((item: any) => (
                                                    <div key={item.id} className="p-3 border rounded">
                                                        <div className="flex items-center gap-2">
                                                            <Badge>{item.targetType}</Badge>
                                                            <span>{item.targetId}</span>
                                                            <Badge variant="outline">
                                                                {item.relationshipType}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">No downstream dependencies</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-8">
                                    Enter a resource ID and click "View Lineage" to see dependencies
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Data Quality Tab */}
                <TabsContent value="quality" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Data Quality</CardTitle>
                            <CardDescription>
                                Monitor data quality metrics and scores
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-4">
                                <Select value={qualityResourceType} onValueChange={setQualityResourceType}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dataset">Dataset</SelectItem>
                                        <SelectItem value="table">Table</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    placeholder="Resource ID"
                                    value={qualityResourceId}
                                    onChange={(e) => setQualityResourceId(e.target.value)}
                                    className="max-w-sm"
                                />
                                <Button onClick={fetchData}>
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    View Quality
                                </Button>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : qualityMetrics && qualityMetrics.length > 0 ? (
                                <div className="space-y-4">
                                    {qualityMetrics.map((summary: any) => (
                                        <div key="summary" className="space-y-4">
                                            <div className="flex items-center justify-between p-4 border rounded">
                                                <div>
                                                    <div className="font-semibold">Overall Quality Score</div>
                                                    <div className="text-2xl font-bold">
                                                        {(summary.overallScore * 100).toFixed(1)}%
                                                    </div>
                                                </div>
                                                <div>
                                                    {summary.overallStatus === 'PASS' ? (
                                                        <Badge className="bg-green-600">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            PASS
                                                        </Badge>
                                                    ) : summary.overallStatus === 'WARNING' ? (
                                                        <Badge className="bg-yellow-600">
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            WARNING
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="destructive">
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            FAIL
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4">
                                                {Object.entries(summary.metrics || {}).map(([type, metric]: [string, any]) => (
                                                    <Card key={type}>
                                                        <CardContent className="pt-4">
                                                            <div className="text-sm text-muted-foreground">{type}</div>
                                                            <div className="text-2xl font-bold mt-2">
                                                                {(metric.metricValue * 100).toFixed(1)}%
                                                            </div>
                                                            <Badge
                                                                variant={
                                                                    metric.status === 'PASS'
                                                                        ? 'default'
                                                                        : metric.status === 'WARNING'
                                                                        ? 'secondary'
                                                                        : 'destructive'
                                                                }
                                                                className="mt-2"
                                                            >
                                                                {metric.status}
                                                            </Badge>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-8">
                                    Enter a resource ID and click "View Quality" to see quality metrics
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Usage Analytics Tab */}
                <TabsContent value="usage" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Usage Analytics</CardTitle>
                            <CardDescription>
                                Track how data resources are being used
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-4">
                                <Select value={usageResourceType} onValueChange={setUsageResourceType}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dataset">Dataset</SelectItem>
                                        <SelectItem value="dashboard">Dashboard</SelectItem>
                                        <SelectItem value="report">Report</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    placeholder="Resource ID"
                                    value={usageResourceId}
                                    onChange={(e) => setUsageResourceId(e.target.value)}
                                    className="max-w-sm"
                                />
                                <Button onClick={fetchData}>
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    View Usage
                                </Button>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : usageStats ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-sm text-muted-foreground">Total Views</div>
                                            <div className="text-2xl font-bold mt-2">{usageStats.totalViews || 0}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-sm text-muted-foreground">Total Exports</div>
                                            <div className="text-2xl font-bold mt-2">{usageStats.totalExports || 0}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-sm text-muted-foreground">Total Shares</div>
                                            <div className="text-2xl font-bold mt-2">{usageStats.totalShares || 0}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-sm text-muted-foreground">Unique Users</div>
                                            <div className="text-2xl font-bold mt-2">{usageStats.uniqueUsers || 0}</div>
                                        </CardContent>
                                    </Card>

                                    {usageStats.usageByAction && usageStats.usageByAction.length > 0 && (
                                        <div className="col-span-full">
                                            <h3 className="font-semibold mb-4">Usage by Action</h3>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Action</TableHead>
                                                        <TableHead>Count</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {usageStats.usageByAction.map((item: any, idx: number) => (
                                                        <TableRow key={idx}>
                                                            <TableCell>
                                                                <Badge variant="outline">{item.action}</Badge>
                                                            </TableCell>
                                                            <TableCell>{item.count}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-8">
                                    Enter a resource ID and click "View Usage" to see usage statistics
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Compliance Reports Tab */}
                <TabsContent value="compliance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Compliance Reports</CardTitle>
                                    <CardDescription>
                                        Generate and manage compliance reports
                                    </CardDescription>
                                </div>
                                <Button>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Generate Report
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Period</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Generated By</TableHead>
                                            <TableHead>Generated At</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {complianceReports.map((report) => (
                                            <TableRow key={report.id}>
                                                <TableCell className="font-medium">
                                                    {report.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{report.reportType}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(report.periodStart)} - {formatDate(report.periodEnd)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            report.status === 'APPROVED'
                                                                ? 'default'
                                                                : report.status === 'DRAFT'
                                                                ? 'secondary'
                                                                : 'outline'
                                                        }
                                                    >
                                                        {report.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{report.generatedBy?.email || 'N/A'}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDate(report.generatedAt)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm">
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {complianceReports.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                                    No compliance reports found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

