'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, UserPlus, Search } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface CollaborationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: (collaboration?: any) => void
}

interface OnboardedUser {
    id: string
    name?: string
    firstName?: string
    lastName?: string
    email: string
    role: string
}

interface FormData {
    name: string
    description: string
    type: string
    projectId?: string
    taskId?: string
    memberIds: string[]
}

export function CollaborationDialog({ open, onOpenChange, onSuccess }: CollaborationDialogProps) {
    const user = useAuthStore((state) => state.user)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        type: 'GENERAL',
        memberIds: []
    })
    
    const [users, setUsers] = useState<OnboardedUser[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [tasks, setTasks] = useState<any[]>([])
    const [memberSearch, setMemberSearch] = useState('')
    const [showUserSuggestions, setShowUserSuggestions] = useState(false)

    useEffect(() => {
        if (open) {
            fetchUsers()
            fetchProjects()
            fetchTasks()
        }
    }, [open])

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users/onboarded')
            if (response.ok) {
                const data = await response.json()
                setUsers(data.users || [])
            }
        } catch (error) {
            console.error('Error fetching users:', error)
        }
    }

    const fetchProjects = async () => {
        try {
            const response = await fetch('/api/projects')
            if (response.ok) {
                const data = await response.json()
                setProjects(data.projects || [])
            }
        } catch (error) {
            console.error('Error fetching projects:', error)
        }
    }

    const fetchTasks = async () => {
        try {
            const response = await fetch('/api/tasks')
            if (response.ok) {
                const data = await response.json()
                setTasks(data.tasks || [])
            }
        } catch (error) {
            console.error('Error fetching tasks:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            alert('Please enter a collaboration name')
            return
        }

        setSubmitting(true)
        try {
            console.log('Submitting collaboration:', formData)
            const response = await fetch('/api/collaborations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            console.log('Response status:', response.status)
            
            if (response.ok) {
                const result = await response.json()
                console.log('Collaboration created:', result)
                onSuccess?.(result.collaboration)
                handleClose()
            } else {
                const error = await response.json()
                console.error('Error response:', error)
                alert(error.error || error.details || 'Failed to create collaboration')
            }
        } catch (error) {
            console.error('Error creating collaboration:', error)
            alert('Failed to create collaboration. Please check the console for details.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleClose = () => {
        setFormData({
            name: '',
            description: '',
            type: 'GENERAL',
            memberIds: []
        })
        setMemberSearch('')
        setShowUserSuggestions(false)
        onOpenChange(false)
    }

    const addMember = (userId: string) => {
        if (!formData.memberIds.includes(userId)) {
            setFormData({ ...formData, memberIds: [...formData.memberIds, userId] })
        }
        setMemberSearch('')
        setShowUserSuggestions(false)
    }

    const removeMember = (userId: string) => {
        setFormData({
            ...formData,
            memberIds: formData.memberIds.filter(id => id !== userId)
        })
    }

    const getDisplayName = (user: OnboardedUser) => {
        return user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.name || user.email
    }

    const filteredUsers = users.filter(u => 
        u.id !== user?.id && 
        !formData.memberIds.includes(u.id) &&
        (memberSearch === '' || 
            getDisplayName(u).toLowerCase().includes(memberSearch.toLowerCase()) ||
            u.email.toLowerCase().includes(memberSearch.toLowerCase()))
    )

    const selectedUsers = users.filter(u => formData.memberIds.includes(u.id))

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Collaboration</DialogTitle>
                    <DialogDescription>
                        Start a collaborative space for discussions, file sharing, and suggestions
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Collaboration Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Q4 Planning Discussion"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="What is this collaboration about?"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GENERAL">General Discussion</SelectItem>
                                <SelectItem value="PROJECT">Project Collaboration</SelectItem>
                                <SelectItem value="TASK">Task Collaboration</SelectItem>
                                <SelectItem value="BRAINSTORM">Brainstorming</SelectItem>
                                <SelectItem value="REVIEW">Review & Feedback</SelectItem>
                                <SelectItem value="PLANNING">Planning</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {formData.type === 'PROJECT' && (
                        <div className="space-y-2">
                            <Label htmlFor="project">Link to Project (Optional)</Label>
                            <Select
                                value={formData.projectId || 'none'}
                                onValueChange={(value) => setFormData({ ...formData, projectId: value === 'none' ? undefined : value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a project" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {projects.map((project) => (
                                        <SelectItem key={project.id} value={project.id}>
                                            {project.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {formData.type === 'TASK' && (
                        <div className="space-y-2">
                            <Label htmlFor="task">Link to Task (Optional)</Label>
                            <Select
                                value={formData.taskId || 'none'}
                                onValueChange={(value) => setFormData({ ...formData, taskId: value === 'none' ? undefined : value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a task" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {tasks.map((task) => (
                                        <SelectItem key={task.id} value={task.id}>
                                            {task.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Add Members</Label>
                        <div className="relative">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={memberSearch}
                                    onChange={(e) => {
                                        setMemberSearch(e.target.value)
                                        setShowUserSuggestions(true)
                                    }}
                                    onFocus={() => setShowUserSuggestions(true)}
                                    placeholder="Search for users to add..."
                                    className="pl-8"
                                />
                            </div>
                            
                            {showUserSuggestions && filteredUsers.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    {filteredUsers.map((u) => (
                                        <button
                                            key={u.id}
                                            type="button"
                                            onClick={() => addMember(u.id)}
                                            className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2"
                                        >
                                            <UserPlus className="h-4 w-4" />
                                            <div>
                                                <p className="text-sm font-medium">{getDisplayName(u)}</p>
                                                <p className="text-xs text-muted-foreground">{u.email}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedUsers.map((u) => (
                                    <Badge key={u.id} variant="secondary" className="flex items-center gap-1">
                                        {getDisplayName(u)}
                                        <button
                                            type="button"
                                            onClick={() => removeMember(u.id)}
                                            className="ml-1 hover:bg-accent rounded-full"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            You will be automatically added as the owner
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? 'Creating...' : 'Create Collaboration'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

