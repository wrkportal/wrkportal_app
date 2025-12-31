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

export default function NewSprintPage() {
    const router = useRouter()
    const pathname = usePathname()
    const [isLoading, setIsLoading] = useState(false)
    const [projects, setProjects] = useState<any[]>([])
    const [formData, setFormData] = useState({
        name: "",
        goal: "",
        description: "",
        projectId: "",
        status: "PLANNED",
        startDate: "",
        endDate: "",
        storyPoints: "",
    })

    // Fetch data for dropdowns
    useEffect(() => {
        fetchProjects()
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const sprintData = {
                name: formData.name,
                goal: formData.goal,
                description: formData.description || undefined,
                projectId: formData.projectId,
                status: formData.status,
                startDate: formData.startDate,
                endDate: formData.endDate,
                storyPoints: formData.storyPoints ? parseInt(formData.storyPoints) : undefined,
            }

            const response = await fetch('/api/sprints', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sprintData),
            })

            if (response.ok) {
                router.push('/sprints')
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to create sprint. Please try again.')
            }
        } catch (error) {
            console.error('Error creating sprint:', error)
            alert('Failed to create sprint. Please try again.')
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
                                    Create New Sprint
                                </h1>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Plan a new sprint for your project
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
                                SP
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
                                <CardDescription>Essential sprint details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Sprint Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Sprint 1 - Q1 2024"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="goal">Sprint Goal *</Label>
                                    <Input
                                        id="goal"
                                        placeholder="e.g., Complete user authentication feature"
                                        value={formData.goal}
                                        onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe the sprint objectives and key deliverables..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="projectId">Project *</Label>
                                    <Select 
                                        value={formData.projectId} 
                                        onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a project" />
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
                            </CardContent>
                        </Card>

                        {/* Status & Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Status & Timeline</CardTitle>
                                <CardDescription>Set sprint status, dates, and story points</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                                            <SelectItem value="PLANNED">Planned</SelectItem>
                                            <SelectItem value="ACTIVE">Active</SelectItem>
                                            <SelectItem value="COMPLETED">Completed</SelectItem>
                                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">Start Date *</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
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

                                <div className="space-y-2">
                                    <Label htmlFor="storyPoints">Story Points (Optional)</Label>
                                    <Input
                                        id="storyPoints"
                                        type="number"
                                        min="0"
                                        placeholder="e.g., 21"
                                        value={formData.storyPoints}
                                        onChange={(e) => setFormData({ ...formData, storyPoints: e.target.value })}
                                    />
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
                                {isLoading ? 'Creating...' : 'Create Sprint'}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}

