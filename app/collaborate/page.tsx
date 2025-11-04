'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
    MessageSquare,
    Users,
    FileText,
    Clock,
    Plus,
    Search,
    Filter,
    Archive,
    Lightbulb,
    Folder
} from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { CollaborationDialog } from '@/components/dialogs/collaboration-dialog'
import { useAuthStore } from '@/stores/authStore'

interface Collaboration {
    id: string
    name: string
    description: string | null
    type: string
    status: string
    createdAt: string
    updatedAt: string
    createdBy: {
        id: string
        name: string | null
        firstName: string | null
        lastName: string | null
        email: string
        avatar: string | null
    }
    members: Array<{
        id: string
        role: string
        user: {
            id: string
            name: string | null
            firstName: string | null
            lastName: string | null
            email: string
            avatar: string | null
        }
    }>
    project: {
        id: string
        name: string
        code: string
    } | null
    task: {
        id: string
        title: string
    } | null
    _count: {
        messages: number
        files: number
        suggestions: number
    }
}

export default function CollaboratePage() {
    const router = useRouter()
    const user = useAuthStore((state) => state.user)
    const [collaborations, setCollaborations] = useState<Collaboration[]>([])
    const [filteredCollaborations, setFilteredCollaborations] = useState<Collaboration[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState('all')
    const [collaborationDialogOpen, setCollaborationDialogOpen] = useState(false)

    useEffect(() => {
        fetchCollaborations()
    }, [])

    useEffect(() => {
        filterCollaborations()
    }, [collaborations, searchQuery, activeTab])

    const fetchCollaborations = async () => {
        try {
            const response = await fetch('/api/collaborations')
            if (response.ok) {
                const data = await response.json()
                setCollaborations(data.collaborations || [])
            }
        } catch (error) {
            console.error('Error fetching collaborations:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterCollaborations = () => {
        let filtered = collaborations

        // Filter by tab
        if (activeTab === 'created') {
            filtered = filtered.filter(c => c.createdBy.id === user?.id)
        } else if (activeTab === 'participating') {
            filtered = filtered.filter(c => c.createdBy.id !== user?.id)
        }

        // Filter by search
        if (searchQuery) {
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.description?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        setFilteredCollaborations(filtered)
    }

    const getDisplayName = (user: any) => {
        return user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.name || user.email
    }

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            PROJECT: 'bg-blue-500',
            TASK: 'bg-green-500',
            GENERAL: 'bg-gray-500',
            BRAINSTORM: 'bg-purple-500',
            REVIEW: 'bg-orange-500',
            PLANNING: 'bg-pink-500'
        }
        return colors[type] || 'bg-gray-500'
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            ACTIVE: 'default',
            COMPLETED: 'secondary',
            ON_HOLD: 'outline',
            CANCELLED: 'destructive'
        }
        return colors[status] || 'default'
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Collaborate</h1>
                    <p className="text-muted-foreground">
                        Work together on projects, tasks, and ideas
                    </p>
                </div>
                <Button onClick={() => setCollaborationDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Collaboration
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search collaborations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <MessageSquare className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{collaborations.length}</p>
                                <p className="text-sm text-muted-foreground">Total</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-full">
                                <Users className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {collaborations.filter(c => c.createdBy.id !== user?.id).length}
                                </p>
                                <p className="text-sm text-muted-foreground">Participating</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 rounded-full">
                                <Folder className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {collaborations.filter(c => c.status === 'ACTIVE').length}
                                </p>
                                <p className="text-sm text-muted-foreground">Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500/10 rounded-full">
                                <Lightbulb className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {collaborations.reduce((sum, c) => sum + c._count.suggestions, 0)}
                                </p>
                                <p className="text-sm text-muted-foreground">Suggestions</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs and Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="created">Created by Me</TabsTrigger>
                    <TabsTrigger value="participating">Participating</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Loading collaborations...</p>
                        </div>
                    ) : filteredCollaborations.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-12">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-lg font-semibold mb-2">No Collaborations Found</h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchQuery
                                        ? 'Try adjusting your search'
                                        : 'Create your first collaboration to get started'}
                                </p>
                                {!searchQuery && (
                                    <Button onClick={() => setCollaborationDialogOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Collaboration
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredCollaborations.map((collaboration) => (
                                <Card
                                    key={collaboration.id}
                                    className="hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => router.push(`/collaborate/${collaboration.id}`)}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className={`h-2 w-2 rounded-full ${getTypeColor(collaboration.type)}`} />
                                                    <CardTitle className="text-lg">{collaboration.name}</CardTitle>
                                                </div>
                                                {collaboration.description && (
                                                    <CardDescription className="line-clamp-2">
                                                        {collaboration.description}
                                                    </CardDescription>
                                                )}
                                            </div>
                                            <Badge variant={getStatusColor(collaboration.status) as any}>
                                                {collaboration.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Linked Items */}
                                        {(collaboration.project || collaboration.task) && (
                                            <div className="mb-4 text-sm">
                                                {collaboration.project && (
                                                    <Badge variant="outline" className="mr-2">
                                                        Project: {collaboration.project.name}
                                                    </Badge>
                                                )}
                                                {collaboration.task && (
                                                    <Badge variant="outline">
                                                        Task: {collaboration.task.title}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        {/* Stats */}
                                        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <MessageSquare className="h-4 w-4" />
                                                <span>{collaboration._count.messages}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FileText className="h-4 w-4" />
                                                <span>{collaboration._count.files}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Lightbulb className="h-4 w-4" />
                                                <span>{collaboration._count.suggestions}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                <span>{collaboration.members.length}</span>
                                            </div>
                                        </div>

                                        {/* Members */}
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                {collaboration.members.slice(0, 5).map((member) => (
                                                    <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                                                        <AvatarImage src={member.user.avatar || undefined} />
                                                        <AvatarFallback className="text-xs">
                                                            {getInitials(getDisplayName(member.user))}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ))}
                                            </div>
                                            {collaboration.members.length > 5 && (
                                                <span className="text-xs text-muted-foreground">
                                                    +{collaboration.members.length - 5} more
                                                </span>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground flex items-center justify-between">
                                            <span>
                                                Created by {getDisplayName(collaboration.createdBy)}
                                            </span>
                                            <span>
                                                {new Date(collaboration.updatedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Collaboration Dialog */}
            <CollaborationDialog
                open={collaborationDialogOpen}
                onOpenChange={setCollaborationDialogOpen}
                onSuccess={() => {
                    fetchCollaborations()
                    // Optionally navigate to the new collaboration
                }}
            />
        </div>
    )
}

