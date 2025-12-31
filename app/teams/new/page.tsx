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
import { ArrowLeft, Plus, X, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface TeamMember {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    avatar?: string
}

export default function NewTeamPage() {
    const router = useRouter()
    const pathname = usePathname()
    const [users, setUsers] = useState<any[]>([])
    const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        department: "",
        status: "ACTIVE",
    })

    // Fetch users for member selection
    useEffect(() => {
        fetchUsers()
    }, [])

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

    const handleAddMember = (userId: string) => {
        const user = users.find(u => u.id === userId)
        if (user && !selectedMembers.find(m => m.id === user.id)) {
            setSelectedMembers([
                ...selectedMembers,
                {
                    id: user.id,
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email || '',
                    role: 'Team Member',
                    avatar: user.avatar
                }
            ])
        }
    }

    const handleRemoveMember = (memberId: string) => {
        setSelectedMembers(selectedMembers.filter(m => m.id !== memberId))
    }

    const handleUpdateMemberRole = (memberId: string, role: string) => {
        setSelectedMembers(selectedMembers.map(m => 
            m.id === memberId ? { ...m, role } : m
        ))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // In a real app, this would be: const response = await fetch('/api/teams', { ... })
            // For now, we'll simulate the API call
            const teamData = {
                ...formData,
                members: selectedMembers.map(m => ({
                    userId: m.id,
                    role: m.role
                }))
            }

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Mock response - in real app, use actual API
            console.log('Team data to create:', teamData)
            
            alert('Team created successfully!')
            router.push('/teams')
        } catch (error) {
            console.error('Error creating team:', error)
            alert('Failed to create team. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const availableUsers = users.filter(u => !selectedMembers.find(m => m.id === u.id))

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            <main className="flex-1 flex flex-col">
                {/* TOP BAR */}
                <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
                    <div className="px-4 lg:px-8 py-3">
                        <div className="flex items-center gap-6 mb-3">
                            <div className="flex flex-col gap-1 mr-auto">
                                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    Create New Team
                                </h1>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Fill in the details to create a new team
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
                                TM
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
                    {/* Team Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="md:col-span-2 rounded-2xl border border-border">
                                <CardHeader>
                                    <CardTitle className="text-base">Basic Information</CardTitle>
                                    <CardDescription>Essential team details</CardDescription>
                                </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Team Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="Enter team name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Input
                                        id="department"
                                        placeholder="e.g., Engineering, Design, QA"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe the team's purpose and responsibilities"
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                            <Card className="md:col-span-2 rounded-2xl border border-border">
                                <CardHeader>
                                    <CardTitle className="text-base">Team Members</CardTitle>
                                    <CardDescription>Add members to your team</CardDescription>
                                </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Add Member Section */}
                            <div className="space-y-2">
                                <Label htmlFor="addMember">Add Team Member</Label>
                                <div className="flex gap-2">
                                    <Select
                                        value=""
                                        onValueChange={handleAddMember}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a user to add" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableUsers.length === 0 ? (
                                                <SelectItem value="no-users" disabled>
                                                    {users.length === 0 ? 'No users available' : 'All users added'}
                                                </SelectItem>
                                            ) : (
                                                availableUsers.map((user) => (
                                                    <SelectItem key={user.id} value={user.id}>
                                                        {user.firstName && user.lastName 
                                                            ? `${user.firstName} ${user.lastName}` 
                                                            : user.name || user.email}
                                                        {user.email && ` (${user.email})`}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Selected Members List */}
                            {selectedMembers.length > 0 && (
                                <div className="space-y-3">
                                    <Label>Team Members ({selectedMembers.length})</Label>
                                    <div className="space-y-2">
                                        {selectedMembers.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                                            >
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={member.avatar} />
                                                    <AvatarFallback>
                                                        {getInitials(`${member.firstName} ${member.lastName}`)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {member.firstName} {member.lastName}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {member.email}
                                                    </p>
                                                </div>
                                                <Select
                                                    value={member.role}
                                                    onValueChange={(value) => handleUpdateMemberRole(member.id, value)}
                                                >
                                                    <SelectTrigger className="w-[140px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Team Lead">Team Lead</SelectItem>
                                                        <SelectItem value="Senior Member">Senior Member</SelectItem>
                                                        <SelectItem value="Team Member">Team Member</SelectItem>
                                                        <SelectItem value="Contributor">Contributor</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedMembers.length === 0 && (
                                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        No members added yet. Select a user above to add them to the team.
                                    </p>
                                </div>
                            )}
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
                                        Create Team
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}

