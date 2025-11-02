'use client'

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function EditProjectPage() {
    const router = useRouter()
    const params = useParams()
    const projectId = params.id as string

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [programs, setPrograms] = useState<any[]>([])
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        startDate: '',
        endDate: '',
        budget: '',
        status: 'PLANNED',
        programId: '',
    })

    // Fetch project data and programs
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectRes, programsRes] = await Promise.all([
                    fetch(`/api/projects/${projectId}`),
                    fetch('/api/programs')
                ])

                if (projectRes.ok) {
                    const projectData = await projectRes.json()
                    const project = projectData.project

                    // Populate form with existing project data
                    setFormData({
                        name: project.name || '',
                        code: project.code || '',
                        description: project.description || '',
                        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
                        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
                        budget: project.budget?.total?.toString() || '0',
                        status: project.status || 'PLANNED',
                        programId: project.programId || '',
                    })
                } else {
                    alert('Failed to load project')
                    router.push('/projects')
                }

                if (programsRes.ok) {
                    const data = await programsRes.json()
                    setPrograms(data.programs || [])
                }
            } catch (error) {
                console.error('Error fetching data:', error)
                alert('Failed to load project')
                router.push('/projects')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [projectId, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    budget: formData.budget ? parseFloat(formData.budget) : 0,
                    programId: formData.programId || null,
                }),
            })

            if (response.ok) {
                alert('Project updated successfully!')
                router.push(`/projects/${projectId}`)
            } else {
                const error = await response.json()
                alert(`Error: ${error.error || 'Failed to update project'}`)
            }
        } catch (error) {
            console.error('Error updating project:', error)
            alert('Failed to update project. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading project...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Edit Project</h1>
                    <p className="text-muted-foreground mt-0.5">Update project details</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Project Information</CardTitle>
                    <CardDescription>Update the details for this project</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Project Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Customer Portal Redesign"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="code">Project Code *</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="CP-2024"
                                    required
                                    disabled
                                    title="Project code cannot be changed"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the project..."
                                    rows={4}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="program">Program (Optional)</Label>
                                <Select value={formData.programId || "NONE"} onValueChange={(value) => setFormData({ ...formData, programId: value === "NONE" ? "" : value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="No program" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NONE">No Program</SelectItem>
                                        {programs.map((program) => (
                                            <SelectItem key={program.id} value={program.id}>
                                                {program.name}
                                            </SelectItem>
                                        ))}
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
                                        <SelectItem value="PLANNED">Planned</SelectItem>
                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                        <SelectItem value="ON_HOLD">On Hold</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="budget">Budget ($)</Label>
                                <Input
                                    id="budget"
                                    type="number"
                                    value={formData.budget}
                                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                    placeholder="100000"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date *</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                    className="[color-scheme:light] dark:[color-scheme:dark]"
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
                                    className="[color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Project'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

