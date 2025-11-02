'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Plus, FileText, Loader2 } from "lucide-react"

interface ChangesTabProps {
    projectId: string
}

export function ChangesTab({ projectId }: ChangesTabProps) {
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

    // Group by status
    const byStatus = {
        draft: changeRequests.filter(c => c.status === 'DRAFT'),
        submitted: changeRequests.filter(c => c.status === 'SUBMITTED'),
        underReview: changeRequests.filter(c => c.status === 'UNDER_REVIEW'),
        approved: changeRequests.filter(c => c.status === 'APPROVED'),
        rejected: changeRequests.filter(c => c.status === 'REJECTED'),
        implemented: changeRequests.filter(c => c.status === 'IMPLEMENTED'),
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Change Request Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Changes</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{changeRequests.length}</div>
                        <p className="text-xs text-muted-foreground">All change requests</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Review</CardTitle>
                        <FileText className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">
                            {byStatus.submitted.length + byStatus.underReview.length}
                        </div>
                        <p className="text-xs text-muted-foreground">Pending approval</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <FileText className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{byStatus.approved.length}</div>
                        <p className="text-xs text-muted-foreground">Ready for implementation</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Implemented</CardTitle>
                        <FileText className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{byStatus.implemented.length}</div>
                        <p className="text-xs text-muted-foreground">Completed changes</p>
                    </CardContent>
                </Card>
            </div>

            {/* Change Requests List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Change Requests</CardTitle>
                            <CardDescription>All change control items for this project</CardDescription>
                        </div>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Change Request
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {changeRequests.map((change) => (
                            <div key={change.id} className="p-4 border rounded-lg space-y-3 hover:bg-accent transition-colors cursor-pointer">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium">{change.title}</h4>
                                            <StatusBadge status={change.status} />
                                        </div>
                                        <p className="text-sm text-muted-foreground">{change.description}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Category:</span>
                                        <span className="ml-2 font-medium">{change.category}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Priority:</span>
                                        <span className="ml-2">
                                            <StatusBadge status={change.priority} />
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Requested:</span>
                                        <span className="ml-2">{formatDate(change.requestedDate)}</span>
                                    </div>
                                    {change.approvedDate && (
                                        <div>
                                            <span className="text-muted-foreground">Approved:</span>
                                            <span className="ml-2">{formatDate(change.approvedDate)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Impact Assessment */}
                                {(change.impact.cost || change.impact.schedule || change.impact.scope) && (
                                    <div className="pt-2 border-t">
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Impact Assessment:</p>
                                        <div className="grid grid-cols-3 gap-4 text-xs">
                                            {change.impact.cost && (
                                                <div>
                                                    <span className="text-muted-foreground">Cost:</span>
                                                    <span className="ml-2 font-medium">{formatCurrency(change.impact.cost)}</span>
                                                </div>
                                            )}
                                            {change.impact.schedule && (
                                                <div>
                                                    <span className="text-muted-foreground">Schedule:</span>
                                                    <span className="ml-2 font-medium">{change.impact.schedule} days</span>
                                                </div>
                                            )}
                                            {change.impact.scope && (
                                                <div>
                                                    <span className="text-muted-foreground">Scope:</span>
                                                    <span className="ml-2 font-medium">{change.impact.scope}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {changeRequests.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No change requests yet</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

