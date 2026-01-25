'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockRisks, mockIssues } from "@/lib/mock-data"
import { formatDate, getPriorityColor, cn } from "@/lib/utils"
import { AlertTriangle, Shield, Search, Plus, TrendingUp, TrendingDown } from "lucide-react"
import { Priority } from "@/types"
import { RAIDDialog } from "@/components/dialogs/raid-dialog"

export default function RAIDPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [filterPriority, setFilterPriority] = useState<string>('all')
    const [raidDialogOpen, setRaidDialogOpen] = useState(false)

    // Filter risks and issues
    const filteredRisks = mockRisks.filter(risk => {
        const matchesSearch = risk.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            risk.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesPriority = filterPriority === 'all' || risk.level === filterPriority
        return matchesSearch && matchesPriority
    })

    const filteredIssues = mockIssues.filter(issue => {
        const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesPriority = filterPriority === 'all' || issue.severity === filterPriority
        return matchesSearch && matchesPriority
    })

    // Calculate stats
    const activeRisks = mockRisks.filter(r => r.status !== 'CLOSED').length
    const activeIssues = mockIssues.filter(i => i.status === 'OPEN').length
    const highPriorityRisks = mockRisks.filter(r => r.level === 'HIGH' || r.level === 'CRITICAL').length
    const highPriorityIssues = mockIssues.filter(i => i.severity === 'HIGH').length

    const getRiskStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            IDENTIFIED: 'bg-blue-100 text-blue-700',
            ACTIVE: 'bg-amber-100 text-amber-700',
            MITIGATED: 'bg-green-100 text-green-700',
            CLOSED: 'bg-slate-100 text-slate-700',
        }
        return variants[status] || 'bg-gray-100 text-gray-700'
    }

    const getIssueStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            OPEN: 'bg-red-100 text-red-700',
            IN_PROGRESS: 'bg-blue-100 text-blue-700',
            RESOLVED: 'bg-green-100 text-green-700',
            CLOSED: 'bg-slate-100 text-slate-700',
        }
        return variants[status] || 'bg-gray-100 text-gray-700'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Risks & Issues (RAID)
                    </h1>
                    <p className="text-slate-600 mt-2">
                        Monitor and manage risks, assumptions, issues, and dependencies
                    </p>
                </div>
                <Button className="gap-2" onClick={() => setRaidDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Log New
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                <Card className="hover-lift border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Active Risks</CardTitle>
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-600">{activeRisks}</div>
                        <p className="text-xs text-slate-500 mt-1">{highPriorityRisks} high priority</p>
                    </CardContent>
                </Card>

                <Card className="hover-lift border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Open Issues</CardTitle>
                        <Shield className="h-5 w-5 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">{activeIssues}</div>
                        <p className="text-xs text-slate-500 mt-1">{highPriorityIssues} high priority</p>
                    </CardContent>
                </Card>

                <Card className="hover-lift border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Mitigated</CardTitle>
                        <TrendingDown className="h-5 w-5 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                            {mockRisks.filter(r => r.status === 'CLOSED').length}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Successfully handled</p>
                    </CardContent>
                </Card>

                <Card className="hover-lift border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Items</CardTitle>
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            {mockRisks.length + mockIssues.length}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Across all projects</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card className="p-4">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Search risks and issues..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="CRITICAL">Critical</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="LOW">Low</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {/* RAID Tabs */}
            <Tabs defaultValue="risks" className="space-y-4">
                <TabsList className="bg-white border">
                    <TabsTrigger value="risks">
                        Risks ({filteredRisks.length})
                    </TabsTrigger>
                    <TabsTrigger value="issues">
                        Issues ({filteredIssues.length})
                    </TabsTrigger>
                    <TabsTrigger value="assumptions">
                        Assumptions
                    </TabsTrigger>
                    <TabsTrigger value="dependencies">
                        Dependencies
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="risks" className="space-y-4">
                    {filteredRisks.map((risk) => (
                        <Card key={risk.id} className="hover-lift cursor-pointer">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Badge className={cn("text-xs", getPriorityColor(risk.level))}>
                                                {risk.level}
                                            </Badge>
                                            <Badge className={cn("text-xs", getRiskStatusBadge(risk.status))}>
                                                {risk.status}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                Impact: {risk.impact}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                Probability: {risk.probability}%
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-lg">{risk.title}</CardTitle>
                                        <CardDescription className="mt-2">{risk.description}</CardDescription>
                                    </div>
                                    <AlertTriangle className={cn("h-6 w-6 ml-4",
                                        risk.level === 'CRITICAL' ? 'text-red-600' :
                                            risk.level === 'HIGH' ? 'text-amber-600' : 'text-slate-400'
                                    )} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-600">Mitigation:</span>
                                        <p className="text-slate-900 mt-1">{risk.mitigation}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600">Owner:</span>
                                        <p className="text-slate-900 mt-1">{risk.ownerId}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600">Identified:</span>
                                        <p className="text-slate-900 mt-1">{formatDate(risk.identifiedDate)}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600">Risk Score:</span>
                                        <p className="text-slate-900 mt-1 font-semibold">
                                            {Math.round(risk.impact * risk.probability / 100)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="issues" className="space-y-4">
                    {filteredIssues.map((issue) => (
                        <Card key={issue.id} className="hover-lift cursor-pointer">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Badge className={cn("text-xs", getPriorityColor(issue.severity))}>
                                                {issue.severity}
                                            </Badge>
                                            <Badge className={cn("text-xs", getIssueStatusBadge(issue.status))}>
                                                {issue.status.replace('_', ' ')}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                Level {issue.escalationLevel}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-lg">{issue.title}</CardTitle>
                                        <CardDescription className="mt-2">{issue.description}</CardDescription>
                                    </div>
                                    <Shield className={cn("h-6 w-6 ml-4",
                                        issue.status === 'OPEN' ? 'text-red-600' :
                                            issue.status === 'IN_PROGRESS' ? 'text-blue-600' :
                                                issue.status === 'RESOLVED' ? 'text-green-600' : 'text-slate-400'
                                    )} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-600">Resolution:</span>
                                        <p className="text-slate-900 mt-1">{issue.resolution || 'Pending'}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600">Owner:</span>
                                        <p className="text-slate-900 mt-1">{issue.ownerId || 'Unassigned'}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600">Identified:</span>
                                        <p className="text-slate-900 mt-1">{formatDate(issue.identifiedDate)}</p>
                                    </div>
                                    {issue.resolvedDate && (
                                        <div>
                                            <span className="text-slate-600">Resolved:</span>
                                            <p className="text-slate-900 mt-1">{formatDate(issue.resolvedDate)}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="assumptions" className="space-y-4">
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-600">Assumptions tracking coming soon</p>
                            <p className="text-sm text-slate-400 mt-2">Document project assumptions and constraints</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="dependencies" className="space-y-4">
                    <Card>
                        <CardContent className="p-8 text-center">
                            <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-600">Dependencies tracking coming soon</p>
                            <p className="text-sm text-slate-400 mt-2">Manage project dependencies and blockers</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* RAID Dialog */}
            <RAIDDialog
                open={raidDialogOpen}
                onClose={() => setRaidDialogOpen(false)}
                onSubmit={(data, type) => {
                    console.log(`${type} logged:`, data)
                    alert(`✅ ${type === 'risk' ? 'Risk' : 'Issue'} logged successfully!`)
                    setRaidDialogOpen(false)
                }}
            />
        </div>
    )
}

