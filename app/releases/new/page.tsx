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

export default function NewReleasePage() {
    const router = useRouter()
    const pathname = usePathname()
    const [isLoading, setIsLoading] = useState(false)
    const [projects, setProjects] = useState<any[]>([])
    const [formData, setFormData] = useState({
        name: "",
        version: "",
        description: "",
        projectId: "",
        status: "PLANNED",
        releaseDate: "",
        targetDate: "",
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
            const releaseData = {
                name: formData.name,
                version: formData.version,
                description: formData.description || undefined,
                projectId: formData.projectId || undefined,
                status: formData.status,
                releaseDate: formData.releaseDate || undefined,
                targetDate: formData.targetDate,
            }

            const response = await fetch('/api/releases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(releaseData),
            })

            if (response.ok) {
                router.push('/releases')
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to create release. Please try again.')
            }
        } catch (error) {
            console.error('Error creating release:', error)
            alert('Failed to create release. Please try again.')
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
                                    Create New Release
                                </h1>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Plan and schedule a new product release
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
                                RL
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
                                <CardDescription>Essential release details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Release Name *</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g., Q1 2024 Release"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="version">Version *</Label>
                                        <Input
                                            id="version"
                                            placeholder="e.g., v1.0.0"
                                            value={formData.version}
                                            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe the release and its key features..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                    />
                                </div>

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
                            </CardContent>
                        </Card>

                        {/* Status & Dates */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Status & Timeline</CardTitle>
                                <CardDescription>Set release status and dates</CardDescription>
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
                                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                            <SelectItem value="RELEASED">Released</SelectItem>
                                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="targetDate">Target Date *</Label>
                                        <Input
                                            id="targetDate"
                                            type="date"
                                            value={formData.targetDate}
                                            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="releaseDate">Release Date (Optional)</Label>
                                        <Input
                                            id="releaseDate"
                                            type="date"
                                            value={formData.releaseDate}
                                            onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
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
                                {isLoading ? 'Creating...' : 'Create Release'}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}

