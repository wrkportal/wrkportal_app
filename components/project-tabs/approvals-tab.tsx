'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import { formatDate, formatCurrency } from "@/lib/utils"
import { CheckCircle, Clock, XCircle, Loader2 } from "lucide-react"

interface ApprovalsTabProps {
    projectId: string
}

export function ApprovalsTab({ projectId }: ApprovalsTabProps) {
    const [changeRequests, setChangeRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch change requests from database
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const response = await fetch(`/api/projects/${projectId}/change-requests`)
                if (response.ok) {
                    const data = await response.json()
                    setChangeRequests(data.changeRequests || [])
                }
            } catch (error) {
                console.error('Error fetching change requests:', error)
            } finally {
                setLoading(false)
            }
        }

        if (projectId) {
            fetchData()
        }
    }, [projectId])

    // Filter change requests for this project that need approval
    const pendingApprovals = changeRequests.filter(c =>
        c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW'
    )
    const approvedChanges = changeRequests.filter(c => c.status === 'APPROVED')
    const rejectedChanges = changeRequests.filter(c => c.status === 'REJECTED')

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Approval Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{pendingApprovals.length}</div>
                        <p className="text-xs text-muted-foreground">Awaiting review</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{approvedChanges.length}</div>
                        <p className="text-xs text-muted-foreground">Approved items</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{rejectedChanges.length}</div>
                        <p className="text-xs text-muted-foreground">Declined</p>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Approvals */}
            <Card>
                <CardHeader>
                    <CardTitle>Pending Approvals</CardTitle>
                    <CardDescription>Items awaiting your approval</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {pendingApprovals.map((change) => (
                            <div key={change.id} className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-medium">{change.title}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">{change.description}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline">
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Reject
                                        </Button>
                                        <Button size="sm">
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <StatusBadge status={change.status} />
                                    <StatusBadge status={change.priority} />
                                    <span className="text-muted-foreground">
                                        Requested: {formatDate(change.requestedDate)}
                                    </span>
                                    {change.impact.cost && (
                                        <span className="text-muted-foreground">
                                            Cost Impact: {formatCurrency(change.impact.cost)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {pendingApprovals.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No pending approvals</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Recently Processed */}
            {(approvedChanges.length > 0 || rejectedChanges.length > 0) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recently Processed</CardTitle>
                        <CardDescription>Latest approval decisions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[...approvedChanges, ...rejectedChanges]
                                .sort((a, b) => {
                                    const dateA = a.approvedDate || a.requestedDate
                                    const dateB = b.approvedDate || b.requestedDate
                                    return new Date(dateB).getTime() - new Date(dateA).getTime()
                                })
                                .slice(0, 5)
                                .map((change) => (
                                    <div key={change.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <h5 className="font-medium text-sm">{change.title}</h5>
                                            <p className="text-xs text-muted-foreground">
                                                {change.approvedDate ? formatDate(change.approvedDate) : formatDate(change.requestedDate)}
                                            </p>
                                        </div>
                                        <StatusBadge status={change.status} />
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

