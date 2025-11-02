'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate } from "@/lib/utils"
import { CheckCircle, Clock, XCircle, AlertCircle, User, FileText, Loader2 } from "lucide-react"
import { ApprovalDetailDialog } from "@/components/dialogs/approval-detail-dialog"

export default function ApprovalsPage() {
    const [approvals, setApprovals] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all' | 'requested'>('pending')
    const [selectedApproval, setSelectedApproval] = useState<any>(null)
    const [showDetailDialog, setShowDetailDialog] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0
    })

    useEffect(() => {
        fetchCurrentUser()
    }, [])

    useEffect(() => {
        if (currentUser) {
            fetchApprovals()
            fetchStats()
        }
    }, [filter, currentUser])

    const fetchCurrentUser = async () => {
        try {
            const response = await fetch('/api/user/me')
            if (response.ok) {
                const data = await response.json()
                setCurrentUser(data.user)
            }
        } catch (error) {
            console.error('Error fetching current user:', error)
        }
    }

    const fetchApprovals = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/approvals?filter=${filter}`)
            if (response.ok) {
                const data = await response.json()
                setApprovals(data.approvals || [])
            }
        } catch (error) {
            console.error('Error fetching approvals:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
                fetch('/api/approvals?filter=pending'),
                fetch('/api/approvals?filter=approved'),
                fetch('/api/approvals?filter=rejected')
            ])

            if (pendingRes.ok && approvedRes.ok && rejectedRes.ok) {
                const [pending, approved, rejected] = await Promise.all([
                    pendingRes.json(),
                    approvedRes.json(),
                    rejectedRes.json()
                ])

                setStats({
                    pending: pending.approvals?.length || 0,
                    approved: approved.approvals?.length || 0,
                    rejected: rejected.approvals?.length || 0
                })
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    const handleApprove = async (approvalId: string, comments?: string) => {
        try {
            const response = await fetch(`/api/approvals/${approvalId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comments })
            })

            if (response.ok) {
                alert('✅ Approval submitted successfully!')
                fetchApprovals()
                fetchStats()
            } else {
                const error = await response.json()
                alert(`❌ Error: ${error.error}`)
            }
        } catch (error) {
            console.error('Error approving:', error)
            alert('❌ Failed to approve')
        }
    }

    const handleReject = async (approvalId: string, comments: string) => {
        try {
            const response = await fetch(`/api/approvals/${approvalId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comments })
            })

            if (response.ok) {
                alert('✅ Rejection submitted successfully!')
                fetchApprovals()
                fetchStats()
            } else {
                const error = await response.json()
                alert(`❌ Error: ${error.error}`)
            }
        } catch (error) {
            console.error('Error rejecting:', error)
            alert('❌ Failed to reject')
        }
    }

    const handleViewDetails = (approval: any) => {
        setSelectedApproval(approval)
        setShowDetailDialog(true)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-green-50 text-green-700 border-green-200'
            case 'REJECTED':
                return 'bg-red-50 text-red-700 border-red-200'
            case 'PENDING':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200'
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200'
        }
    }

    const getTypeLabel = (type: string) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Approvals</h1>
                    <p className="text-muted-foreground mt-0.5">
                        Review and approve requests, changes, and timesheets
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('pending')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                        <p className="text-xs text-muted-foreground">Awaiting your approval</p>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('approved')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                        <p className="text-xs text-muted-foreground">By you</p>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('rejected')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
                        <p className="text-xs text-muted-foreground">By you</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
                <TabsList>
                    <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                    <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
                    <TabsTrigger value="requested">My Requests</TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>

                <TabsContent value={filter} className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {filter === 'pending' && 'Pending Approvals'}
                                {filter === 'approved' && 'Approved Requests'}
                                {filter === 'rejected' && 'Rejected Requests'}
                                {filter === 'requested' && 'Requests I Submitted'}
                                {filter === 'all' && 'All Approvals'}
                            </CardTitle>
                            <CardDescription>
                                {filter === 'pending' && 'Items requiring your approval'}
                                {filter === 'approved' && 'Requests you have approved'}
                                {filter === 'rejected' && 'Requests you have rejected'}
                                {filter === 'requested' && 'Approval requests you submitted'}
                                {filter === 'all' && 'All approval requests'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center h-32">
                                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {approvals.map((approval) => {
                                        const currentUserApprover = approval.approvers?.find((a: any) => a.userId === currentUser?.id)
                                        const userStatus = currentUserApprover?.status

                                        return (
                                            <div key={approval.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                                            <h4 className="font-medium">{approval.title}</h4>
                                                            <Badge variant="outline">
                                                                {getTypeLabel(approval.type)}
                                                            </Badge>
                                                            <Badge variant="outline" className={getStatusColor(approval.status)}>
                                                                {approval.status}
                                                            </Badge>
                                                            {userStatus && userStatus !== approval.status && (
                                                                <Badge variant="outline" className={getStatusColor(userStatus)}>
                                                                    You: {userStatus}
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                                            {approval.description || 'No description'}
                                                        </p>

                                                        <div className="flex items-center gap-4 text-sm">
                                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                                <User className="h-3 w-3" />
                                                                <span>
                                                                    {approval.requestedBy?.firstName} {approval.requestedBy?.lastName}
                                                                </span>
                                                            </div>
                                                            <span className="text-muted-foreground">•</span>
                                                            <span className="text-muted-foreground">
                                                                {formatDate(approval.requestedAt)}
                                                            </span>
                                                            <span className="text-muted-foreground">•</span>
                                                            <span className="text-muted-foreground">
                                                                {approval.approvers?.length || 0} approver(s)
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 ml-4">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleViewDetails(approval)}
                                                        >
                                                            View Details
                                                        </Button>
                                                        {filter === 'pending' && currentUserApprover && currentUserApprover.status === 'PENDING' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="default"
                                                                    onClick={() => handleViewDetails(approval)}
                                                                >
                                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                                    Review
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {approvals.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg">
                                            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                                            <p className="text-muted-foreground">No approvals found</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Approval Detail Dialog */}
            <ApprovalDetailDialog
                open={showDetailDialog}
                onClose={() => setShowDetailDialog(false)}
                approval={selectedApproval}
                onApprove={(comments) => handleApprove(selectedApproval?.id, comments)}
                onReject={(comments) => handleReject(selectedApproval?.id, comments)}
                currentUserId={currentUser?.id}
            />
        </div>
    )
}

