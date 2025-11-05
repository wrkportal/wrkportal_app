'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/stores/authStore'
import { Calendar } from 'lucide-react'

interface CreateTaskFromMessageDialogProps {
    open: boolean
    onClose: () => void
    messageContent: string
    messageId: string
    collaborationId: string
    onSuccess?: () => void
}

interface OnboardedUser {
    id: string
    name?: string
    firstName?: string
    lastName?: string
    email: string
}

export function CreateTaskFromMessageDialog({
    open,
    onClose,
    messageContent,
    messageId,
    collaborationId,
    onSuccess,
}: CreateTaskFromMessageDialogProps) {
    const currentUser = useAuthStore((state) => state.user)
    const [loading, setLoading] = useState(false)
    const [projects, setProjects] = useState<any[]>([])
    const [users, setUsers] = useState<OnboardedUser[]>([])

    const [formData, setFormData] = useState({
        title: '',
        description: messageContent,
        projectId: '',
        assigneeId: '',
        priority: 'MEDIUM',
        status: 'TODO',
        dueDate: '',
        estimatedHours: '',
    })

    useEffect(() => {
        if (open) {
            // Reset form with message content
            setFormData({
                title: '',
                description: messageContent,
                projectId: '',
                assigneeId: currentUser?.id || '',
                priority: 'MEDIUM',
                status: 'TODO',
                dueDate: '',
                estimatedHours: '',
            })

            // Fetch projects and users
            const fetchData = async () => {
                try {
                    const [projectsRes, usersRes] = await Promise.all([
                        fetch('/api/projects'),
                        fetch('/api/users/onboarded'),
                    ])

                    if (projectsRes.ok) {
                        const data = await projectsRes.json()
                        setProjects(data.projects || [])
                    }

                    if (usersRes.ok) {
                        const data = await usersRes.json()
                        setUsers(data.users || [])
                    }
                } catch (error) {
                    console.error('Error fetching data:', error)
                }
            }
            fetchData()
        }
    }, [open, messageContent, currentUser])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    projectId: formData.projectId || undefined,
                    assigneeId: formData.assigneeId || currentUser?.id,
                    priority: formData.priority,
                    status: formData.status,
                    dueDate: formData.dueDate || undefined,
                    estimatedHours: formData.estimatedHours
                        ? parseFloat(formData.estimatedHours)
                        : undefined,
                    sourceType: 'MESSAGE',
                    sourceId: messageId,
                }),
            })

            if (response.ok) {
                onSuccess?.()
                onClose()
            } else {
                const error = await response.json()
                alert(`Error: ${error.error || 'Failed to create task'}`)
            }
        } catch (error) {
            console.error('Error creating task:', error)
            alert('Failed to create task')
        } finally {
            setLoading(false)
        }
    }

    const getDisplayName = (user: OnboardedUser) => {
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`
        }
        return user.name || user.email
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Task from Message</DialogTitle>
                    <DialogDescription>
                        Convert this message into a task
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="title">Task Title *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({ ...formData, title: e.target.value })
                            }
                            placeholder="Enter task title"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            placeholder="Task description"
                            rows={4}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="project">Project</Label>
                            <Select
                                value={formData.projectId}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, projectId: value === 'none' ? '' : value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select project (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Project</SelectItem>
                                    {projects.map((project) => (
                                        <SelectItem key={project.id} value={project.id}>
                                            {project.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="assignee">Assign To</Label>
                            <Select
                                value={formData.assigneeId}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, assigneeId: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select assignee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {getDisplayName(user)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, priority: value })
                                }
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
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, status: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TODO">To Do</SelectItem>
                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                    <SelectItem value="REVIEW">Review</SelectItem>
                                    <SelectItem value="DONE">Done</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, dueDate: e.target.value })
                                }
                                className="text-left"
                            />
                        </div>

                        <div>
                            <Label htmlFor="estimatedHours">Estimated Hours</Label>
                            <Input
                                id="estimatedHours"
                                type="number"
                                step="0.5"
                                min="0"
                                value={formData.estimatedHours}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        estimatedHours: e.target.value,
                                    })
                                }
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !formData.title}>
                            {loading ? 'Creating...' : 'Create Task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

