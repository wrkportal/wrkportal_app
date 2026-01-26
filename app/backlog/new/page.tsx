'use client'

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"

export default function NewBacklogItemPage() {
    const router = useRouter()
    const pathname = usePathname()
    const [isLoading, setIsLoading] = useState(false)
    const [projects, setProjects] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        projectId: "",
        assigneeId: "",
        priority: "MEDIUM",
        status: "TODO",
        dueDate: "",
        estimatedHours: "",
        storyPoints: "",
    })

    // Fetch data for dropdowns
    useEffect(() => {
        fetchProjects()
        fetchUsers()
    }, [])

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const taskData = {
                title: formData.title,
                description: formData.description || undefined,
                projectId: formData.projectId || undefined,
                assigneeId: formData.assigneeId || undefined,
                priority: formData.priority,
                status: formData.status,
                dueDate: formData.dueDate || undefined,
                estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
            }

            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taskData),
            })

            if (response.ok) {
                if (router) {
                  router.push('/backlog')
                }
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to create backlog item. Please try again.')
            }
        } catch (error) {
            console.error('Error creating backlog item:', error)
            alert('Failed to create backlog item. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            <main className="flex-1 flex flex-col">
                {/* TOP BAR */}
                <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
                    <div className="px-4 lg:px-8 py-3">
                        <div className="flex items-center gap-6 mb-3">
                            <div className="flex flex-col gap-1 mr-auto">
                                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    Create New Backlog Item
                                </h1>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Add a new item to your product backlog
                                </p>
                            </div>

                            <button 
                                onClick={() => router.back()}
                                className="inline-flex items-center justify-center rounded-xl bg-slate-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-600 shrink-0"
                            >
                                <ArrowLeft className="h-3 w-3 mr-1" />
                                Back
                            </button>

                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-xs font-semibold shrink-0">
                                BL
                            </div>
                        </div>

                        <nav className="flex items-center gap-4 text-sm overflow-x-auto pb-1">
                            {[
                                "Home",
                                "Roadmap",
                                "Projects",
                                "Releases",
                                "Sprints",
                                "Backlog",
                                "Dependencies",
                                "Teams",
                            ].map((item) => {
                                // Special handling for Home button
                                const href = item === "Home" ? "/product-management" : `/${item.toLowerCase().replace(/ /g, "-")}`
                                const currentPath = pathname || ''
                                const isActive = item === "Home"
                                    ? currentPath === "/product-management"
                                    : currentPath === href || (currentPath.startsWith(href + '/') && href !== '/')

                                return (
                                    <Link
                                        key={item}
                                        href={href}
                                        className={`px-3 py-1.5 rounded-xl whitespace-nowrap border transition-all ${     
                                            isActive
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700 font-medium'
                                                : 'hover:bg-muted text-muted-foreground border-border'
                                        }`}
                                    >
                                        {item}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                </header>

                {/* SCROLL CONTENT */}
                <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
                    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Basic Information</CardTitle>
                                <CardDescription>Essential backlog item details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g., Implement user authentication"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe the backlog item..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="projectId">Project (Optional)</Label>
                                        <Select 
                                            value={formData.projectId || undefined} 
                                            onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a project (optional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {projects.map((project) => (
                                                    <SelectItem key={project.id} value={project.id}>
                                                        {project.name} ({project.code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="assigneeId">Assignee (Optional)</Label>
                                        <Select 
                                            value={formData.assigneeId || undefined} 
                                            onValueChange={(value) => setFormData({ ...formData, assigneeId: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select an assignee (optional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.map((user) => (
                                                    <SelectItem key={user.id} value={user.id}>
                                                        {user.firstName} {user.lastName} ({user.email})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Priority & Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Priority & Status</CardTitle>
                                <CardDescription>Set priority and initial status</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="priority">Priority *</Label>
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

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status *</Label>
                                        <Select 
                                            value={formData.status} 
                                            onValueChange={(value) => setFormData({ ...formData, status: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="TODO">To Do</SelectItem>
                                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                                                <SelectItem value="BLOCKED">Blocked</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timeline & Estimation */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Timeline & Estimation</CardTitle>
                                <CardDescription>Set due date and effort estimates</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="dueDate">Due Date</Label>
                                        <Input
                                            id="dueDate"
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="estimatedHours">Estimated Hours</Label>
                                        <Input
                                            id="estimatedHours"
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            placeholder="e.g., 8"
                                            value={formData.estimatedHours}
                                            onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="storyPoints">Story Points</Label>
                                        <Input
                                            id="storyPoints"
                                            type="number"
                                            min="0"
                                            placeholder="e.g., 5"
                                            value={formData.storyPoints}
                                            onChange={(e) => setFormData({ ...formData, storyPoints: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-indigo-500 hover:bg-indigo-600"
                            >
                                {isLoading ? 'Creating...' : 'Create Backlog Item'}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}

