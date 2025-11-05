'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus } from 'lucide-react'
import { ProgramDialog } from './program-dialog'

interface InitiativeDialogProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: any) => void
}

interface Program {
    id: string
    name: string
    startDate?: string
    endDate?: string
}

interface User {
    id: string
    firstName: string
    lastName: string
}

export function InitiativeDialog({ open, onClose, onSubmit }: InitiativeDialogProps) {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        programId: '',
        managerId: '',
        status: 'PLANNED',
        budget: '',
        startDate: '',
        endDate: '',
    })
    const [programs, setPrograms] = useState<Program[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [programDialogOpen, setProgramDialogOpen] = useState(false)

    // Fetch programs and users when dialog opens
    useEffect(() => {
        if (open) {
            fetchData()
        }
    }, [open])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [programsRes, usersRes] = await Promise.all([
                fetch('/api/programs'),
                fetch('/api/users/onboarded')
            ])

            if (programsRes.ok) {
                const programsData = await programsRes.json()
                console.log('[Initiative Dialog] Fetched programs:', programsData.programs)
                setPrograms(programsData.programs || [])
            } else {
                console.error('[Initiative Dialog] Failed to fetch programs:', await programsRes.text())
            }

            if (usersRes.ok) {
                const usersData = await usersRes.json()
                console.log('[Initiative Dialog] Fetched users:', usersData.users)
                setUsers(usersData.users || [])
            } else {
                console.error('[Initiative Dialog] Failed to fetch users:', await usersRes.text())
            }
        } catch (error) {
            console.error('[Initiative Dialog] Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleProgramCreated = () => {
        // Refetch programs after creating a new one
        fetchData()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        // Validate project dates against program dates
        if (formData.programId && formData.programId !== 'none') {
            const selectedProgram = programs.find(p => p.id === formData.programId)
            if (selectedProgram && selectedProgram.startDate && selectedProgram.endDate) {
                const projectStart = new Date(formData.startDate)
                const projectEnd = new Date(formData.endDate)
                const programStart = new Date(selectedProgram.startDate)
                const programEnd = new Date(selectedProgram.endDate)
                
                if (projectStart < programStart) {
                    alert(`❌ Project start date must be on or after the program start date (${new Date(selectedProgram.startDate).toLocaleDateString()})`)
                    return
                }
                
                if (projectEnd > programEnd) {
                    alert(`❌ Project end date must be on or before the program end date (${new Date(selectedProgram.endDate).toLocaleDateString()})`)
                    return
                }
            }
        }
        
        setSubmitting(true)
        
        try {
            await onSubmit(formData)
        } catch (error) {
            console.error('Error submitting initiative:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleClose = () => {
        onClose()
        // Reset form after closing
        setTimeout(() => {
            setFormData({
                name: '',
                code: '',
                description: '',
                programId: '',
                managerId: '',
                status: 'PLANNED',
                budget: '',
                startDate: '',
                endDate: '',
            })
        }, 300)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Initiative</DialogTitle>
                    <DialogDescription>
                        Create a new strategic initiative (project) for your roadmap.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Project Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="Enter project name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        disabled={submitting}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="code">Project Code *</Label>
                                    <Input
                                        id="code"
                                        placeholder="e.g., PROJ-001"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe the project..."
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    disabled={submitting}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label htmlFor="program">Program</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setProgramDialogOpen(true)}
                                            className="h-auto py-1 px-2 text-xs"
                                            disabled={submitting}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            New Program
                                        </Button>
                                    </div>
                                    <Select
                                        value={formData.programId || "none"}
                                        onValueChange={(value) => setFormData({ ...formData, programId: value === "none" ? "" : value })}
                                        disabled={submitting}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select program (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {programs.length === 0 ? (
                                                <SelectItem value="no-programs" disabled>
                                                    No programs available
                                                </SelectItem>
                                            ) : (
                                                programs.map((program) => (
                                                    <SelectItem key={program.id} value={program.id}>
                                                        {program.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="manager">Project Manager *</Label>
                                    <Select
                                        value={formData.managerId}
                                        onValueChange={(value) => setFormData({ ...formData, managerId: value })}
                                        required
                                        disabled={submitting}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select manager" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {user.firstName} {user.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                                        disabled={submitting}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PLANNED">Planned</SelectItem>
                                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                            <SelectItem value="ON_HOLD">On Hold</SelectItem>
                                            <SelectItem value="COMPLETED">Completed</SelectItem>
                                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="budget">Budget</Label>
                                    <Input
                                        id="budget"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={formData.budget}
                                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                        disabled={submitting}
                                    />
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
                                        className="text-left [color-scheme:light] dark:[color-scheme:dark]"
                                        required
                                        disabled={submitting}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="endDate">End Date *</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="text-left [color-scheme:light] dark:[color-scheme:dark]"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Add Initiative'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>

            {/* Program Dialog */}
            <ProgramDialog
                open={programDialogOpen}
                onClose={() => {
                    setProgramDialogOpen(false)
                    handleProgramCreated()
                }}
            />
        </Dialog>
    )
}

