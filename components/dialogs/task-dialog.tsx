'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'

interface TaskDialogProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: any) => void
}

interface OnboardedUser {
    id: string
    name?: string
    firstName?: string
    lastName?: string
    email: string
    role: string
}

// Roles that can assign to anyone
const MANAGER_ROLES = [
    'TENANT_SUPER_ADMIN',
    'ORG_ADMIN',
    'PMO_LEAD',
    'PROJECT_MANAGER',
    'RESOURCE_MANAGER'
]

export function TaskDialog({ open, onClose, onSubmit }: TaskDialogProps) {
    const currentUser = useAuthStore((state) => state.user)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        projectId: '',
        assigneeId: '',
        assigneeName: '',
        priority: 'MEDIUM',
        status: 'TODO',
        dueDate: '',
        estimatedHours: 0,
        frequency: '',
        referencePoint: '',
    })

    const [onboardedUsers, setOnboardedUsers] = useState<OnboardedUser[]>([])
    const [assignableUsers, setAssignableUsers] = useState<OnboardedUser[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [showUserSuggestions, setShowUserSuggestions] = useState(false)
    const [filteredUsers, setFilteredUsers] = useState<OnboardedUser[]>([])
    const [assigneeInput, setAssigneeInput] = useState('')

    // Determine assignable users based on current user role
    useEffect(() => {
        if (!currentUser || onboardedUsers.length === 0) return

        const isManager = MANAGER_ROLES.includes(currentUser.role)

        if (isManager) {
            // Managers can assign to anyone
            setAssignableUsers(onboardedUsers)
        } else {
            // TEAM_MEMBER can only assign to themselves or other TEAM_MEMBERS
            const teamMembers = onboardedUsers.filter(
                user => user.role === 'TEAM_MEMBER' || user.id === currentUser.id
            )
            setAssignableUsers(teamMembers)

            // Auto-assign to themselves if no assignee set
            if (!formData.assigneeId && currentUser) {
                const displayName = currentUser.firstName && currentUser.lastName 
                    ? `${currentUser.firstName} ${currentUser.lastName}`
                    : currentUser.name || currentUser.email
                setFormData(prev => ({
                    ...prev,
                    assigneeId: currentUser.id,
                    assigneeName: displayName
                }))
                setAssigneeInput(displayName)
            }
        }
    }, [currentUser, onboardedUsers])

    // Fetch onboarded users and projects on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, projectsRes] = await Promise.all([
                    fetch('/api/users/onboarded'),
                    fetch('/api/projects')
                ])

                if (usersRes.ok) {
                    const data = await usersRes.json()
                    setOnboardedUsers(data.users || [])
                }

                if (projectsRes.ok) {
                    const data = await projectsRes.json()
                    setProjects(data.projects || [])
                }
            } catch (error) {
                console.error('Error fetching data:', error)
                setOnboardedUsers([])
                setProjects([])
            }
        }
        if (open) {
            fetchData()
        }
    }, [open])

    // Handle @ mention typing
    const handleAssigneeInputChange = (value: string) => {
        setAssigneeInput(value)

        if (value.includes('@')) {
            const searchTerm = value.split('@').pop()?.toLowerCase() || ''
            // Filter from assignableUsers instead of all onboardedUsers
            const filtered = assignableUsers.filter(user =>
                user.firstName.toLowerCase().includes(searchTerm) ||
                user.lastName.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm)
            )
            setFilteredUsers(filtered)
            setShowUserSuggestions(true)
        } else {
            setShowUserSuggestions(false)
        }
    }

    const selectUser = (user: OnboardedUser) => {
        const displayName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.name || user.email
        setFormData({
            ...formData,
            assigneeId: user.id,
            assigneeName: displayName
        })
        setAssigneeInput(displayName)
        setShowUserSuggestions(false)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        // Ensure assigneeId is set - default to current user if empty
        const submissionData = {
            ...formData,
            assigneeId: formData.assigneeId && formData.assigneeId.trim() !== '' 
                ? formData.assigneeId 
                : currentUser?.id || ''
        }
        
        onSubmit(submissionData)
        onClose()
        // Reset form
        setFormData({
            title: '',
            description: '',
            projectId: '',
            assigneeId: '',
            assigneeName: '',
            priority: 'MEDIUM',
            status: 'TODO',
            dueDate: '',
            estimatedHours: 0,
            frequency: '',
            referencePoint: '',
        })
        setAssigneeInput('')
    }

    const isNotAProject = formData.projectId === 'NOT_A_PROJECT'

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                        Add a new task to your project. Fill in the details below.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="title">Task Title *</Label>
                            <Input
                                id="title"
                                placeholder="Enter task title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe the task..."
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="project">Project *</Label>
                                <Select
                                    value={formData.projectId}
                                    onValueChange={(value) => setFormData({
                                        ...formData,
                                        projectId: value,
                                        // Reset frequency and reference when switching
                                        frequency: value === 'NOT_A_PROJECT' ? formData.frequency : '',
                                        referencePoint: value === 'NOT_A_PROJECT' ? formData.referencePoint : ''
                                    })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NOT_A_PROJECT">
                                            <span className="font-medium text-purple-600">🚫 Not a Project</span>
                                        </SelectItem>
                                        {projects.length > 0 ? (
                                            projects.map((project) => (
                                                <SelectItem key={project.id} value={project.id}>
                                                    {project.name} ({project.code})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="NO_PROJECTS" disabled>
                                                No projects available
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="relative">
                                <Label htmlFor="assignee">
                                    Assign To
                                    {currentUser?.role === 'TEAM_MEMBER' && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                            (You or team members only)
                                        </span>
                                    )}
                                </Label>
                                <Input
                                    id="assignee"
                                    placeholder="Type @ to mention users"
                                    value={assigneeInput}
                                    onChange={(e) => handleAssigneeInputChange(e.target.value)}
                                    onFocus={() => {
                                        if (assigneeInput.includes('@')) {
                                            setShowUserSuggestions(true)
                                        }
                                    }}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {currentUser?.role === 'TEAM_MEMBER'
                                        ? 'Type @ to see team members'
                                        : 'Type @ to see all users'}
                                </p>

                                {/* User Suggestions Dropdown */}
                                {showUserSuggestions && filteredUsers.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border rounded-md shadow-lg max-h-48 overflow-auto">
                                        {filteredUsers.map((user) => (
                                            <div
                                                key={user.id}
                                                className="px-3 py-2 hover:bg-accent cursor-pointer flex items-center justify-between"
                                                onClick={() => selectUser(user)}
                                            >
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {user.firstName && user.lastName 
                                                            ? `${user.firstName} ${user.lastName}` 
                                                            : user.name || user.email}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    {user.role}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {showUserSuggestions && filteredUsers.length === 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border rounded-md shadow-lg p-3">
                                        <p className="text-sm text-muted-foreground">No users found</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Additional Fields for "Not a Project" */}
                        {isNotAProject && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <div>
                                    <Label htmlFor="frequency">Frequency *</Label>
                                    <Select
                                        value={formData.frequency}
                                        onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                                        required={isNotAProject}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DAILY">Daily</SelectItem>
                                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                                            <SelectItem value="BI_WEEKLY">Bi-Weekly</SelectItem>
                                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                                            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                            <SelectItem value="YEARLY">Yearly</SelectItem>
                                            <SelectItem value="ONE_TIME">One Time</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        How often this task repeats
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="referencePoint">Reference Point *</Label>
                                    <Input
                                        id="referencePoint"
                                        placeholder="e.g., Every Monday, 1st of month"
                                        value={formData.referencePoint}
                                        onChange={(e) => setFormData({ ...formData, referencePoint: e.target.value })}
                                        required={isNotAProject}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Starting point or reference date
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="priority">Priority</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
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
                                <Label htmlFor="dueDate">Due Date</Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    className="[color-scheme:light] dark:[color-scheme:dark] text-left"
                                />
                            </div>

                            <div>
                                <Label htmlFor="hours">Est. Hours</Label>
                                <Input
                                    id="hours"
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={formData.estimatedHours}
                                    onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Create Task
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

