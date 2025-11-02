'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { mockProjects, mockUsers } from '@/lib/mock-data'

interface RAIDDialogProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: any, type: 'risk' | 'issue') => void
}

export function RAIDDialog({ open, onClose, onSubmit }: RAIDDialogProps) {
    const [type, setType] = useState<'risk' | 'issue'>('risk')
    const [riskData, setRiskData] = useState({
        title: '',
        description: '',
        projectId: '',
        category: 'TECHNICAL',
        priority: 'MEDIUM',
        probability: 50,
        impact: 5,
        mitigation: '',
        ownerId: '',
    })

    const [issueData, setIssueData] = useState({
        title: '',
        description: '',
        projectId: '',
        category: 'TECHNICAL',
        priority: 'MEDIUM',
        assigneeId: '',
        resolution: '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(type === 'risk' ? riskData : issueData, type)
        onClose()
        // Reset forms
        setRiskData({
            title: '',
            description: '',
            projectId: '',
            category: 'TECHNICAL',
            priority: 'MEDIUM',
            probability: 50,
            impact: 5,
            mitigation: '',
            ownerId: '',
        })
        setIssueData({
            title: '',
            description: '',
            projectId: '',
            category: 'TECHNICAL',
            priority: 'MEDIUM',
            assigneeId: '',
            resolution: '',
        })
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Log New Item</DialogTitle>
                    <DialogDescription>
                        Log a new risk or issue for your project.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={type} onValueChange={(v) => setType(v as 'risk' | 'issue')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="risk">Risk</TabsTrigger>
                        <TabsTrigger value="issue">Issue</TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit}>
                        <TabsContent value="risk" className="space-y-4">
                            <div>
                                <Label htmlFor="risk-title">Risk Title *</Label>
                                <Input
                                    id="risk-title"
                                    placeholder="Enter risk title"
                                    value={riskData.title}
                                    onChange={(e) => setRiskData({ ...riskData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="risk-description">Description *</Label>
                                <Textarea
                                    id="risk-description"
                                    placeholder="Describe the risk..."
                                    rows={3}
                                    value={riskData.description}
                                    onChange={(e) => setRiskData({ ...riskData, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="risk-project">Project *</Label>
                                    <Select
                                        value={riskData.projectId}
                                        onValueChange={(value) => setRiskData({ ...riskData, projectId: value })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {mockProjects.map((project) => (
                                                <SelectItem key={project.id} value={project.id}>
                                                    {project.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="risk-category">Category</Label>
                                    <Select
                                        value={riskData.category}
                                        onValueChange={(value) => setRiskData({ ...riskData, category: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="TECHNICAL">Technical</SelectItem>
                                            <SelectItem value="RESOURCE">Resource</SelectItem>
                                            <SelectItem value="FINANCIAL">Financial</SelectItem>
                                            <SelectItem value="SCHEDULE">Schedule</SelectItem>
                                            <SelectItem value="EXTERNAL">External</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="risk-priority">Priority</Label>
                                    <Select
                                        value={riskData.priority}
                                        onValueChange={(value) => setRiskData({ ...riskData, priority: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="LOW">Low</SelectItem>
                                            <SelectItem value="MEDIUM">Medium</SelectItem>
                                            <SelectItem value="HIGH">High</SelectItem>
                                            <SelectItem value="CRITICAL">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="risk-probability">Probability (%)</Label>
                                    <Input
                                        id="risk-probability"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={riskData.probability}
                                        onChange={(e) => setRiskData({ ...riskData, probability: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="risk-impact">Impact (1-10)</Label>
                                    <Input
                                        id="risk-impact"
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={riskData.impact}
                                        onChange={(e) => setRiskData({ ...riskData, impact: parseInt(e.target.value) || 5 })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="risk-mitigation">Mitigation Strategy</Label>
                                <Textarea
                                    id="risk-mitigation"
                                    placeholder="How will you mitigate this risk?"
                                    rows={2}
                                    value={riskData.mitigation}
                                    onChange={(e) => setRiskData({ ...riskData, mitigation: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="risk-owner">Risk Owner</Label>
                                <Select
                                    value={riskData.ownerId}
                                    onValueChange={(value) => setRiskData({ ...riskData, ownerId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select owner" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {mockUsers.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.firstName} {user.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </TabsContent>

                        <TabsContent value="issue" className="space-y-4">
                            <div>
                                <Label htmlFor="issue-title">Issue Title *</Label>
                                <Input
                                    id="issue-title"
                                    placeholder="Enter issue title"
                                    value={issueData.title}
                                    onChange={(e) => setIssueData({ ...issueData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="issue-description">Description *</Label>
                                <Textarea
                                    id="issue-description"
                                    placeholder="Describe the issue..."
                                    rows={3}
                                    value={issueData.description}
                                    onChange={(e) => setIssueData({ ...issueData, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="issue-project">Project *</Label>
                                    <Select
                                        value={issueData.projectId}
                                        onValueChange={(value) => setIssueData({ ...issueData, projectId: value })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {mockProjects.map((project) => (
                                                <SelectItem key={project.id} value={project.id}>
                                                    {project.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="issue-category">Category</Label>
                                    <Select
                                        value={issueData.category}
                                        onValueChange={(value) => setIssueData({ ...issueData, category: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="TECHNICAL">Technical</SelectItem>
                                            <SelectItem value="RESOURCE">Resource</SelectItem>
                                            <SelectItem value="FINANCIAL">Financial</SelectItem>
                                            <SelectItem value="PROCESS">Process</SelectItem>
                                            <SelectItem value="QUALITY">Quality</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="issue-priority">Priority</Label>
                                    <Select
                                        value={issueData.priority}
                                        onValueChange={(value) => setIssueData({ ...issueData, priority: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="LOW">Low</SelectItem>
                                            <SelectItem value="MEDIUM">Medium</SelectItem>
                                            <SelectItem value="HIGH">High</SelectItem>
                                            <SelectItem value="CRITICAL">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="issue-assignee">Assigned To</Label>
                                    <Select
                                        value={issueData.assigneeId}
                                        onValueChange={(value) => setIssueData({ ...issueData, assigneeId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select assignee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {mockUsers.map((user) => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {user.firstName} {user.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="issue-resolution">Proposed Resolution</Label>
                                <Textarea
                                    id="issue-resolution"
                                    placeholder="How will this issue be resolved?"
                                    rows={2}
                                    value={issueData.resolution}
                                    onChange={(e) => setIssueData({ ...issueData, resolution: e.target.value })}
                                />
                            </div>
                        </TabsContent>

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                Log {type === 'risk' ? 'Risk' : 'Issue'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

