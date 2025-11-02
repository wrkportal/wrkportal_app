'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { mockProjects, mockUsers } from '@/lib/mock-data'

interface ResourceDialogProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: any) => void
}

export function ResourceDialog({ open, onClose, onSubmit }: ResourceDialogProps) {
    const [formData, setFormData] = useState({
        userId: '',
        projectId: '',
        role: '',
        allocation: 100,
        startDate: '',
        endDate: '',
        bookingType: 'HARD',
        billRate: '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
        onClose()
        setFormData({
            userId: '',
            projectId: '',
            role: '',
            allocation: 100,
            startDate: '',
            endDate: '',
            bookingType: 'HARD',
            billRate: '',
        })
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Allocate Resource</DialogTitle>
                    <DialogDescription>
                        Assign a team member to a project with allocation details.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="user">Team Member *</Label>
                                <Select
                                    value={formData.userId}
                                    onValueChange={(value) => setFormData({ ...formData, userId: value })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select team member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {mockUsers.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.firstName} {user.lastName} - {user.role}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="project">Project *</Label>
                                <Select
                                    value={formData.projectId}
                                    onValueChange={(value) => setFormData({ ...formData, projectId: value })}
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="role">Role on Project *</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Developer">Developer</SelectItem>
                                        <SelectItem value="Designer">Designer</SelectItem>
                                        <SelectItem value="QA">QA Engineer</SelectItem>
                                        <SelectItem value="DevOps">DevOps</SelectItem>
                                        <SelectItem value="BA">Business Analyst</SelectItem>
                                        <SelectItem value="Architect">Architect</SelectItem>
                                        <SelectItem value="PM">Project Manager</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="allocation">Allocation (%) *</Label>
                                <Input
                                    id="allocation"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.allocation}
                                    onChange={(e) => setFormData({ ...formData, allocation: parseInt(e.target.value) || 100 })}
                                    required
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    100% = Full-time, 50% = Half-time
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="startDate">Start Date *</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="endDate">End Date *</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="bookingType">Booking Type</Label>
                                <Select
                                    value={formData.bookingType}
                                    onValueChange={(value) => setFormData({ ...formData, bookingType: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="HARD">Hard Booking (Committed)</SelectItem>
                                        <SelectItem value="SOFT">Soft Booking (Tentative)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="billRate">Bill Rate ($/hr)</Label>
                                <Input
                                    id="billRate"
                                    type="number"
                                    min="0"
                                    placeholder="150"
                                    value={formData.billRate}
                                    onChange={(e) => setFormData({ ...formData, billRate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                                <strong>Note:</strong> Resource allocation will be visible in the resource schedule and capacity planning views.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Allocate Resource
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

