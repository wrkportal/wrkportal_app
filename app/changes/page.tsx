'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockChangeRequests } from "@/lib/mock-data"
import { formatDate, cn } from "@/lib/utils"
import { FileText, Search, Plus, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import { ChangeRequestStatus, Priority, ChangeRequest } from "@/types"

export default function ChangeControlPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>('all')

    // Filter change requests
    const filteredChanges = mockChangeRequests.filter(cr => {
        const matchesSearch = cr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cr.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = filterStatus === 'all' || cr.status === filterStatus
        return matchesSearch && matchesStatus
    })

    // Calculate stats
    const pendingCount = mockChangeRequests.filter(cr =>
        cr.status === ChangeRequestStatus.SUBMITTED ||
        cr.status === ChangeRequestStatus.UNDER_REVIEW ||
        cr.status === ChangeRequestStatus.DRAFT
    ).length
    const approvedCount = mockChangeRequests.filter(cr => cr.status === ChangeRequestStatus.APPROVED).length
    const implementedCount = mockChangeRequests.filter(cr => cr.status === ChangeRequestStatus.IMPLEMENTED).length
    const rejectedCount = mockChangeRequests.filter(cr => cr.status === ChangeRequestStatus.REJECTED).length

    const getStatusIcon = (status: ChangeRequestStatus) => {
        if (status === ChangeRequestStatus.DRAFT ||
            status === ChangeRequestStatus.SUBMITTED ||
            status === ChangeRequestStatus.UNDER_REVIEW) {
            return <Clock className="h-5 w-5 text-amber-600" />
        }
        if (status === ChangeRequestStatus.APPROVED) {
            return <CheckCircle className="h-5 w-5 text-green-600" />
        }
        if (status === ChangeRequestStatus.REJECTED) {
            return <XCircle className="h-5 w-5 text-red-600" />
        }
        if (status === ChangeRequestStatus.IMPLEMENTED) {
            return <CheckCircle className="h-5 w-5 text-blue-600" />
        }
        return <AlertCircle className="h-5 w-5 text-slate-600" />
    }

    const getStatusBadge = (status: ChangeRequestStatus) => {
        if (status === ChangeRequestStatus.DRAFT) return 'bg-slate-100 text-slate-700'
        if (status === ChangeRequestStatus.SUBMITTED) return 'bg-blue-100 text-blue-700'
        if (status === ChangeRequestStatus.UNDER_REVIEW) return 'bg-amber-100 text-amber-700'
        if (status === ChangeRequestStatus.APPROVED) return 'bg-green-100 text-green-700'
        if (status === ChangeRequestStatus.REJECTED) return 'bg-red-100 text-red-700'
        if (status === ChangeRequestStatus.IMPLEMENTED) return 'bg-purple-100 text-purple-700'
        return 'bg-slate-100 text-slate-700'
    }

    const getPriorityBadge = (priority: Priority) => {
        if (priority === Priority.CRITICAL) return 'bg-red-600 text-white'
        if (priority === Priority.HIGH) return 'bg-orange-500 text-white'
        if (priority === Priority.MEDIUM) return 'bg-amber-500 text-white'
        if (priority === Priority.LOW) return 'bg-slate-500 text-white'
        return 'bg-slate-500 text-white'
    }

    const getImpactLevel = (impact: ChangeRequest['impact']) => {
        const cost = impact.cost || 0
        const schedule = impact.schedule || 0

        if (cost > 40000 || schedule > 20) return 'HIGH'
        if (cost > 20000 || schedule > 10) return 'MEDIUM'
        return 'LOW'
    }

    const getImpactColor = (impactLevel: string) => {
        if (impactLevel === 'HIGH') return 'text-red-600 bg-red-50'
        if (impactLevel === 'MEDIUM') return 'text-amber-600 bg-amber-50'
        if (impactLevel === 'LOW') return 'text-green-600 bg-green-50'
        return 'text-slate-600 bg-slate-50'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Change Control
                    </h1>
                    <p className="text-slate-600 mt-2">
                        Manage and track change requests across all projects
                    </p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Change Request
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                <Card className="hover-lift border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Pending Review</CardTitle>
                        <Clock className="h-5 w-5 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-600">{pendingCount}</div>
                        <p className="text-xs text-slate-500 mt-1">Awaiting approval</p>
                    </CardContent>
                </Card>

                <Card className="hover-lift border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Approved</CardTitle>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">{approvedCount}</div>
                        <p className="text-xs text-slate-500 mt-1">Ready for implementation</p>
                    </CardContent>
                </Card>

                <Card className="hover-lift border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Implemented</CardTitle>
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{implementedCount}</div>
                        <p className="text-xs text-slate-500 mt-1">Successfully deployed</p>
                    </CardContent>
                </Card>

                <Card className="hover-lift border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Rejected</CardTitle>
                        <XCircle className="h-5 w-5 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">{rejectedCount}</div>
                        <p className="text-xs text-slate-500 mt-1">Not approved</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card className="p-4">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Search change requests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value={ChangeRequestStatus.DRAFT}>Draft</SelectItem>
                            <SelectItem value={ChangeRequestStatus.SUBMITTED}>Submitted</SelectItem>
                            <SelectItem value={ChangeRequestStatus.UNDER_REVIEW}>Under Review</SelectItem>
                            <SelectItem value={ChangeRequestStatus.APPROVED}>Approved</SelectItem>
                            <SelectItem value={ChangeRequestStatus.REJECTED}>Rejected</SelectItem>
                            <SelectItem value={ChangeRequestStatus.IMPLEMENTED}>Implemented</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {/* Change Requests List */}
            <div className="space-y-4">
                {filteredChanges.map((cr) => (
                    <Card key={cr.id} className="hover-lift cursor-pointer">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Badge className={cn("text-xs", getPriorityBadge(cr.priority))}>
                                            {cr.priority}
                                        </Badge>
                                        <Badge className={cn("text-xs", getStatusBadge(cr.status))}>
                                            {cr.status.replace('_', ' ')}
                                        </Badge>
                                        <Badge className={cn("text-xs px-3 py-1", getImpactColor(getImpactLevel(cr.impact)))}>
                                            Impact: {getImpactLevel(cr.impact)}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                            {cr.category}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg">{cr.title}</CardTitle>
                                    <CardDescription className="mt-2">{cr.description}</CardDescription>
                                </div>
                                <div className="ml-4">
                                    {getStatusIcon(cr.status)}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-600 block mb-1">Requestor</span>
                                    <p className="text-slate-900 font-medium">User {cr.requestedBy}</p>
                                </div>
                                <div>
                                    <span className="text-slate-600 block mb-1">Requested Date</span>
                                    <p className="text-slate-900">{formatDate(cr.requestedDate)}</p>
                                </div>
                                {cr.approvedDate && (
                                    <div>
                                        <span className="text-slate-600 block mb-1">Approved Date</span>
                                        <p className="text-slate-900">{formatDate(cr.approvedDate)}</p>
                                    </div>
                                )}
                                {cr.implementedDate && (
                                    <div>
                                        <span className="text-slate-600 block mb-1">Implemented Date</span>
                                        <p className="text-slate-900">{formatDate(cr.implementedDate)}</p>
                                    </div>
                                )}
                            </div>

                            {/* Justification */}
                            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                                <h4 className="text-sm font-semibold text-slate-700 mb-2">Business Justification</h4>
                                <p className="text-sm text-slate-600">{cr.justification}</p>
                            </div>

                            {/* Impact Details */}
                            {(cr.impact.cost || cr.impact.schedule || cr.impact.scope) && (
                                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Impact Assessment</h4>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        {cr.impact.cost && (
                                            <div>
                                                <span className="text-slate-600 block">Cost Impact</span>
                                                <p className="text-slate-900 font-semibold">${(cr.impact.cost).toLocaleString()}</p>
                                            </div>
                                        )}
                                        {cr.impact.schedule && (
                                            <div>
                                                <span className="text-slate-600 block">Schedule Impact</span>
                                                <p className="text-slate-900 font-semibold">{cr.impact.schedule} days</p>
                                            </div>
                                        )}
                                        {cr.impact.scope && (
                                            <div className="col-span-3">
                                                <span className="text-slate-600 block">Scope Impact</span>
                                                <p className="text-slate-900">{cr.impact.scope}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            {(cr.status === ChangeRequestStatus.SUBMITTED || cr.status === ChangeRequestStatus.UNDER_REVIEW) && (
                                <div className="flex gap-2 mt-4">
                                    <Button size="sm" variant="default">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve
                                    </Button>
                                    <Button size="sm" variant="destructive">
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject
                                    </Button>
                                    <Button size="sm" variant="outline">
                                        <FileText className="h-4 w-4 mr-2" />
                                        View Details
                                    </Button>
                                </div>
                            )}

                            {cr.status === ChangeRequestStatus.APPROVED && (
                                <div className="flex gap-2 mt-4">
                                    <Button size="sm" variant="default">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Mark as Implemented
                                    </Button>
                                    <Button size="sm" variant="outline">
                                        <FileText className="h-4 w-4 mr-2" />
                                        View Details
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredChanges.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">No change requests found</p>
                        <p className="text-sm text-slate-400 mt-2">Try adjusting your search or filters</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
