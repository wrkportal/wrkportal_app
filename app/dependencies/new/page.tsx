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

export default function NewDependencyPage() {
    const router = useRouter()
    const pathname = usePathname()
    const [isLoading, setIsLoading] = useState(false)
    const [projects, setProjects] = useState<any[]>([])
    const [tasks, setTasks] = useState<any[]>([])
    const [releases, setReleases] = useState<any[]>([])
    const [sprints, setSprints] = useState<any[]>([])
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        type: "DEPENDS_ON",
        status: "ACTIVE",
        priority: "MEDIUM",
        impact: "",
        mitigation: "",
        sourceType: "PROJECT",
        sourceId: "",
        targetType: "PROJECT",
        targetId: "",
    })

    // Fetch data for source/target dropdowns
    useEffect(() => {
        fetchProjects()
        fetchTasks()
        fetchReleases()
        fetchSprints()
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

    const fetchReleases = async () => {
        try {
            const response = await fetch('/api/releases')
            if (response.ok) {
                const data = await response.json()
                setReleases(data.releases || [])
            }
        } catch (error) {
            console.error('Error fetching releases:', error)
        }
    }

    const fetchSprints = async () => {
        try {
            const response = await fetch('/api/sprints')
            if (response.ok) {
                const data = await response.json()
                setSprints(data.sprints || [])
            }
        } catch (error) {
            console.error('Error fetching sprints:', error)
        }
    }

    const getSourceOptions = () => {
        switch (formData.sourceType) {
            case 'PROJECT':
                return projects.map(p => ({ id: p.id, name: p.name }))
            case 'TASK':
                return tasks.map(t => ({ id: t.id, name: t.title }))
            case 'RELEASE':
                return releases.map(r => ({ id: r.id, name: r.name }))
            case 'SPRINT':
                return sprints.map(s => ({ id: s.id, name: s.name }))
            default:
                return []
        }
    }

    const getTargetOptions = () => {
        switch (formData.targetType) {
            case 'PROJECT':
                return projects.map(p => ({ id: p.id, name: p.name }))
            case 'TASK':
                return tasks.map(t => ({ id: t.id, name: t.title }))
            case 'RELEASE':
                return releases.map(r => ({ id: r.id, name: r.name }))
            case 'SPRINT':
                return sprints.map(s => ({ id: s.id, name: s.name }))
            default:
                return []
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch('/api/dependencies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                router.push('/dependencies')
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to create dependency. Please try again.')
            }
        } catch (error) {
            console.error('Error creating dependency:', error)
            alert('Failed to create dependency. Please try again.')
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
                                    Create New Dependency
                                </h1>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Track relationships and dependencies between projects, tasks, releases, and sprints
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
                                DP
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
                                <CardDescription>Essential dependency details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Dependency Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Feature A depends on Feature B"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe the dependency relationship..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Dependency Type *</Label>
                                        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DEPENDS_ON">Depends On</SelectItem>
                                                <SelectItem value="BLOCKED_BY">Blocked By</SelectItem>
                                                <SelectItem value="BLOCKS">Blocks</SelectItem>
                                                <SelectItem value="RELATED_TO">Related To</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status *</Label>
                                        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ACTIVE">Active</SelectItem>
                                                <SelectItem value="AT_RISK">At Risk</SelectItem>
                                                <SelectItem value="BLOCKED">Blocked</SelectItem>
                                                <SelectItem value="RESOLVED">Resolved</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="priority">Priority *</Label>
                                        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
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
                                </div>
                            </CardContent>
                        </Card>

                        {/* Source Item */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Source Item</CardTitle>
                                <CardDescription>The item that has the dependency</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="sourceType">Source Type *</Label>
                                        <Select 
                                            value={formData.sourceType} 
                                            onValueChange={(value) => setFormData({ ...formData, sourceType: value, sourceId: '' })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PROJECT">Project</SelectItem>
                                                <SelectItem value="TASK">Task</SelectItem>
                                                <SelectItem value="RELEASE">Release</SelectItem>
                                                <SelectItem value="SPRINT">Sprint</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="sourceId">Source Item *</Label>
                                        <Select 
                                            value={formData.sourceId} 
                                            onValueChange={(value) => setFormData({ ...formData, sourceId: value })}
                                            disabled={!formData.sourceType}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select source item" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getSourceOptions().map((item) => (
                                                    <SelectItem key={item.id} value={item.id}>
                                                        {item.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Target Item */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Target Item</CardTitle>
                                <CardDescription>The item that the source depends on</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="targetType">Target Type *</Label>
                                        <Select 
                                            value={formData.targetType} 
                                            onValueChange={(value) => setFormData({ ...formData, targetType: value, targetId: '' })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PROJECT">Project</SelectItem>
                                                <SelectItem value="TASK">Task</SelectItem>
                                                <SelectItem value="RELEASE">Release</SelectItem>
                                                <SelectItem value="SPRINT">Sprint</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="targetId">Target Item *</Label>
                                        <Select 
                                            value={formData.targetId} 
                                            onValueChange={(value) => setFormData({ ...formData, targetId: value })}
                                            disabled={!formData.targetType}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select target item" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getTargetOptions().map((item) => (
                                                    <SelectItem key={item.id} value={item.id}>
                                                        {item.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Impact & Mitigation */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Impact & Mitigation</CardTitle>
                                <CardDescription>Describe the impact and mitigation strategy</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="impact">Impact *</Label>
                                    <Textarea
                                        id="impact"
                                        placeholder="Describe the impact of this dependency..."
                                        value={formData.impact}
                                        onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                                        rows={3}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="mitigation">Mitigation Strategy</Label>
                                    <Textarea
                                        id="mitigation"
                                        placeholder="Describe how to mitigate risks from this dependency..."
                                        value={formData.mitigation}
                                        onChange={(e) => setFormData({ ...formData, mitigation: e.target.value })}
                                        rows={3}
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
                                {isLoading ? 'Creating...' : 'Create Dependency'}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}

