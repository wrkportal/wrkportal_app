'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import { CheckCircle, XCircle, User, Calendar, FileText, Users } from 'lucide-react'

interface ApprovalDetailDialogProps {
    open: boolean
    onClose: () => void
    approval: any
    onApprove: (comments?: string) => void
    onReject: (comments: string) => void
    currentUserId: string
}

export function ApprovalDetailDialog({
    open,
    onClose,
    approval,
    onApprove,
    onReject,
    currentUserId
}: ApprovalDetailDialogProps) {
    const [action, setAction] = useState<'approve' | 'reject' | null>(null)
    const [comments, setComments] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!approval) return null

    const currentUserApprover = approval.approvers?.find((a: any) => a.userId === currentUserId)
    const hasResponded = currentUserApprover && currentUserApprover.status !== 'PENDING'

    const handleSubmit = async () => {
        if (action === 'reject' && !comments.trim()) {
            alert('Comments are required when rejecting')
            return
        }

        setIsSubmitting(true)
        try {
            if (action === 'approve') {
                await onApprove(comments)
            } else if (action === 'reject') {
                await onReject(comments)
            }
            setAction(null)
            setComments('')
            onClose()
        } catch (error) {
            console.error('Error submitting approval:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const getTypeLabel = (type: string) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
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

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {approval.title}
                    </DialogTitle>
                    <DialogDescription>
                        <Badge variant="outline" className={getStatusColor(approval.status)}>
                            {approval.status}
                        </Badge>
                        <span className="ml-2">{getTypeLabel(approval.type)}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Request Details */}
                    <div>
                        <h3 className="font-medium mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Request Details
                        </h3>
                        <div className="p-4 border rounded-lg space-y-2 bg-muted/50">
                            <div>
                                <span className="text-sm text-muted-foreground">Description:</span>
                                <p className="text-sm mt-1">{approval.description || 'No description provided'}</p>
                            </div>
                            {approval.message && (
                                <div>
                                    <span className="text-sm text-muted-foreground">Message from requester:</span>
                                    <p className="text-sm mt-1 italic">{approval.message}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Project Closure Details */}
                    {approval.type === 'PROJECT_CLOSURE' && approval.documentData && (
                        <div>
                            <h3 className="font-medium mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Closure Details
                            </h3>
                            <div className="space-y-3">
                                {/* Closure Checklist */}
                                {approval.documentData.closureChecklist && (
                                    <div className="p-3 border rounded-lg">
                                        <p className="text-sm font-medium mb-2">Closure Checklist</p>
                                        <div className="space-y-1">
                                            {approval.documentData.closureChecklist.map((item: any) => (
                                                <div key={item.id} className="flex items-center gap-2 text-sm">
                                                    {item.completed ? (
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4 text-gray-400" />
                                                    )}
                                                    <span className={item.completed ? 'text-green-700' : 'text-muted-foreground'}>
                                                        {item.item}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Lessons Learned */}
                                {approval.documentData.lessonsLearned && (
                                    <div className="p-3 border rounded-lg">
                                        <p className="text-sm font-medium mb-2">Lessons Learned</p>
                                        <div className="space-y-2 text-sm">
                                            {approval.documentData.lessonsLearned.whatWentWell && (
                                                <div>
                                                    <p className="font-medium text-green-700">What Went Well:</p>
                                                    <p className="text-muted-foreground whitespace-pre-wrap">{approval.documentData.lessonsLearned.whatWentWell}</p>
                                                </div>
                                            )}
                                            {approval.documentData.lessonsLearned.whatCouldBeImproved && (
                                                <div>
                                                    <p className="font-medium text-orange-700">What Could Be Improved:</p>
                                                    <p className="text-muted-foreground whitespace-pre-wrap">{approval.documentData.lessonsLearned.whatCouldBeImproved}</p>
                                                </div>
                                            )}
                                            {approval.documentData.lessonsLearned.recommendations && (
                                                <div>
                                                    <p className="font-medium text-blue-700">Recommendations:</p>
                                                    <p className="text-muted-foreground whitespace-pre-wrap">{approval.documentData.lessonsLearned.recommendations}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Requester Info */}
                    <div>
                        <h3 className="font-medium mb-2 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Requested By
                        </h3>
                        <div className="p-3 border rounded-lg flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="font-medium">
                                    {approval.requestedBy?.firstName} {approval.requestedBy?.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">{approval.requestedBy?.email}</p>
                            </div>
                            <div className="ml-auto text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4 inline mr-1" />
                                {formatDate(approval.requestedAt)}
                            </div>
                        </div>
                    </div>

                    {/* Approvers */}
                    <div>
                        <h3 className="font-medium mb-2 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Approvers
                        </h3>
                        <div className="space-y-2">
                            {approval.approvers?.map((approver: any) => (
                                <div key={approver.id} className="p-3 border rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <User className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {approver.user?.firstName} {approver.user?.lastName}
                                            </p>
                                            <p className="text-sm text-muted-foreground">{approver.user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={getStatusColor(approver.status)}>
                                            {approver.status}
                                        </Badge>
                                        {approver.approvedAt && (
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(approver.approvedAt)}
                                            </span>
                                        )}
                                        {approver.rejectedAt && (
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(approver.rejectedAt)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Section */}
                    {!hasResponded && currentUserApprover && (
                        <div className="p-4 border-2 border-dashed rounded-lg bg-yellow-50">
                            {!action && (
                                <div className="space-y-3">
                                    <p className="font-medium text-sm">Your approval is required</p>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => setAction('approve')}
                                            className="flex-1"
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve
                                        </Button>
                                        <Button
                                            onClick={() => setAction('reject')}
                                            variant="destructive"
                                            className="flex-1"
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {action && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-sm">
                                            {action === 'approve' ? 'Approving Request' : 'Rejecting Request'}
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setAction(null)
                                                setComments('')
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                    <div>
                                        <Label>
                                            Comments {action === 'reject' && <span className="text-destructive">*</span>}
                                        </Label>
                                        <Textarea
                                            placeholder={action === 'approve' ? 'Add optional comments...' : 'Please provide a reason for rejection...'}
                                            value={comments}
                                            onChange={(e) => setComments(e.target.value)}
                                            rows={4}
                                            className="mt-2"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || (action === 'reject' && !comments.trim())}
                                        className="w-full"
                                        variant={action === 'approve' ? 'default' : 'destructive'}
                                    >
                                        {isSubmitting ? 'Submitting...' : action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {hasResponded && (
                        <div className="p-4 border rounded-lg bg-muted/50">
                            <p className="text-sm font-medium mb-2">Your Response</p>
                            <Badge variant="outline" className={getStatusColor(currentUserApprover.status)}>
                                {currentUserApprover.status}
                            </Badge>
                            {currentUserApprover.comments && (
                                <p className="text-sm mt-2 text-muted-foreground">
                                    <span className="font-medium">Comments:</span> {currentUserApprover.comments}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

