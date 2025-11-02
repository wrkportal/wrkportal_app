'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus } from "lucide-react"
import { ProgramDialog } from "@/components/dialogs/program-dialog"

export default function NewProjectPage() {
    const router = useRouter()
    const [programs, setPrograms] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [programDialogOpen, setProgramDialogOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: "",
        programId: "",
        managerId: "",
        status: "PLANNED",
        startDate: "",
        endDate: "",
        budget: "",
    })

    // Fetch programs and users for dropdowns
    useEffect(() => {
        fetchPrograms()
        fetchUsers()
    }, [])

    const fetchPrograms = async () => {
        try {
            const response = await fetch('/api/programs')
            if (response.ok) {
                const data = await response.json()
                setPrograms(data.programs || [])
            }
        } catch (error) {
            console.error('Error fetching programs:', error)
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
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    budget: formData.budget ? parseFloat(formData.budget) : 0,
                    programId: formData.programId || undefined,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                alert('Project created successfully!')
                router.push(`/projects/${data.project.id}`)
            } else {
                const error = await response.json()
                alert(`Error: ${error.error || 'Failed to create project'}`)
            }
        } catch (error) {
            console.error('Error creating project:', error)
            alert('Failed to create project. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Create New Project
                    </h1>
                    <p className="text-muted-foreground mt-0.5">
                        Fill in the details to create a new project
                    </p>
                </div>
            </div>

            {/* Project Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Essential project details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Project Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="Enter project name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="code">Project Code *</Label>
                                    <Input
                                        id="code"
                                        placeholder="e.g., PROJ-001"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe the project objectives and scope"
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="program">Program (Optional)</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setProgramDialogOpen(true)}
                                            className="h-auto py-1 px-2 text-xs"
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            New Program
                                        </Button>
                                    </div>
                                    <Select
                                        value={formData.programId || "NONE"}
                                        onValueChange={(value) => setFormData({ ...formData, programId: value === "NONE" ? "" : value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select program" />
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
                                    <Label htmlFor="manager">Project Manager *</Label>
                                    <Select
                                        value={formData.managerId}
                                        onValueChange={(value) => setFormData({ ...formData, managerId: value })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select project manager" />
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

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
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
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Timeline & Budget</CardTitle>
                            <CardDescription>Project schedule and financial details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
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

                                <div className="space-y-2">
                                    <Label htmlFor="budget">Budget (USD) *</Label>
                                    <Input
                                        id="budget"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={formData.budget}
                                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <div className="flex justify-end items-center gap-4 mt-6">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" className="gap-2" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4" />
                                Create Project
                            </>
                        )}
                    </Button>
                </div>
            </form>

            {/* Program Creation Dialog */}
            <ProgramDialog
                open={programDialogOpen}
                onClose={() => {
                    setProgramDialogOpen(false)
                    fetchPrograms() // Refresh programs list after creation
                }}
            />
        </div>
    )
}

