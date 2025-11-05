'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    MessageSquare,
    Users,
    Plus,
    Search,
    Send,
    MoreVertical,
    Paperclip,
    Image as ImageIcon,
    Settings,
    UserPlus,
    Archive,
    Trash2,
    Info,
    FileText,
    Edit2,
    Download,
    Clock,
} from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { CollaborationDialog } from '@/components/dialogs/collaboration-dialog'
import { CreateTaskFromMessageDialog } from '@/components/dialogs/create-task-from-message-dialog'
import { SetReminderDialog } from '@/components/dialogs/set-reminder-dialog'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

interface Collaboration {
    id: string
    name: string
    description: string | null
    type: string
    status: string
    createdAt: string
    updatedAt: string
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
    _count: {
        messages: number
        files: number
        suggestions: number
    }
}

interface Message {
    id: string
    content: string
    createdAt: string
    parentId?: string | null
    parent?: {
        id: string
        content: string
        user: {
            id: string
            name: string | null
            firstName: string | null
            lastName: string | null
        }
    } | null
    user: {
        id: string
        name: string | null
        firstName: string | null
        lastName: string | null
        email: string
        avatar: string | null
    }
}

interface CollaborationFile {
    id: string
    fileName: string
    fileUrl: string
    fileType: string
    fileSize: number
    createdAt: string
    user: {
        id: string
        name: string | null
        firstName: string | null
        lastName: string | null
        email: string
    }
}

export default function CollaboratePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const user = useAuthStore((state) => state.user)
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const [collaborations, setCollaborations] = useState<Collaboration[]>([])
    const [selectedCollaboration, setSelectedCollaboration] = useState<Collaboration | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [files, setFiles] = useState<CollaborationFile[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [loadingFiles, setLoadingFiles] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [messageInput, setMessageInput] = useState('')
    const [collaborationDialogOpen, setCollaborationDialogOpen] = useState(false)
    const [sendingMessage, setSendingMessage] = useState(false)
    const [uploadingFile, setUploadingFile] = useState(false)
    const [activeTab, setActiveTab] = useState('chat')
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editName, setEditName] = useState('')
    const [editDescription, setEditDescription] = useState('')
    const [savingEdit, setSavingEdit] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [archiving, setArchiving] = useState(false)
    const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)
    const [availableUsers, setAvailableUsers] = useState<any[]>([])
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [addingMembers, setAddingMembers] = useState(false)
    const [viewMembersDialogOpen, setViewMembersDialogOpen] = useState(false)
    const [showArchived, setShowArchived] = useState(false)
    
    // Message action dialogs
    const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false)
    const [reminderDialogOpen, setReminderDialogOpen] = useState(false)
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
    const [replyingTo, setReplyingTo] = useState<Message | null>(null)
    const [replyInput, setReplyInput] = useState('')
    const [sendingReply, setSendingReply] = useState(false)

    useEffect(() => {
        fetchCollaborations()
    }, [])

    useEffect(() => {
        // Auto-select first collaboration or from URL param only on initial load
        if (collaborations.length > 0 && !selectedCollaboration && !loading) {
            const collabId = searchParams.get('id')
            if (collabId) {
                const collab = collaborations.find(c => c.id === collabId)
                if (collab && !collab.isArchived) {
                    selectCollaboration(collab)
                }
            } else {
                // Select first active (non-archived) collaboration
                const firstActive = collaborations.find(c => !c.isArchived)
                if (firstActive) {
                    selectCollaboration(firstActive)
                }
            }
        }
    }, [collaborations.length, loading])

    // Real-time message polling
    useEffect(() => {
        if (!selectedCollaboration || activeTab !== 'chat') return

        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/collaborations/${selectedCollaboration.id}/messages`)
                if (response.ok) {
                    const data = await response.json()
                    // Only update if there are new messages
                    if (data.messages.length > messages.length) {
                        setMessages(data.messages)
                    }
                }
            } catch (error) {
                console.error('Error polling messages:', error)
            }
        }, 3000) // Poll every 3 seconds

        return () => clearInterval(pollInterval)
    }, [selectedCollaboration, activeTab, messages.length])

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

    const selectCollaboration = async (collaboration: Collaboration) => {
        setSelectedCollaboration(collaboration)
        setActiveTab('chat')
        setLoadingMessages(true)
        
        try {
            // Fetch messages
            const messagesResponse = await fetch(`/api/collaborations/${collaboration.id}/messages`)
            if (messagesResponse.ok) {
                const messagesData = await messagesResponse.json()
                setMessages(messagesData.messages || [])
            }
            
            // Fetch files immediately
            const filesResponse = await fetch(`/api/collaborations/${collaboration.id}/files`)
            if (filesResponse.ok) {
                const filesData = await filesResponse.json()
                setFiles(filesData.files || [])
            }
        } catch (error) {
            console.error('Error fetching collaboration data:', error)
        } finally {
            setLoadingMessages(false)
        }
    }

    const fetchFiles = async (collaborationId: string) => {
        setLoadingFiles(true)
        try {
            const response = await fetch(`/api/collaborations/${collaborationId}/files`)
            if (response.ok) {
                const data = await response.json()
                setFiles(data.files || [])
            }
        } catch (error) {
            console.error('Error fetching files:', error)
        } finally {
            setLoadingFiles(false)
        }
    }

    useEffect(() => {
        if (selectedCollaboration && activeTab === 'files') {
            fetchFiles(selectedCollaboration.id)
        }
    }, [selectedCollaboration, activeTab])

    const sendMessage = async () => {
        if (!messageInput.trim() || !selectedCollaboration) return

        setSendingMessage(true)
        try {
            const response = await fetch(`/api/collaborations/${selectedCollaboration.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    content: messageInput,
                    replyToId: replyingTo?.id 
                }),
            })

            if (response.ok) {
                const data = await response.json()
                setMessages([...messages, data.message])
                setMessageInput('')
                setReplyingTo(null)
            }
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setSendingMessage(false)
        }
    }

    const sendReply = async () => {
        if (!replyInput.trim() || !replyingTo || !selectedCollaboration) return

        setSendingReply(true)
        try {
            const response = await fetch(`/api/collaborations/${selectedCollaboration.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    content: replyInput,
                    replyToId: replyingTo.id 
                }),
            })

            if (response.ok) {
                const data = await response.json()
                setMessages([...messages, data.message])
                setReplyInput('')
                setReplyingTo(null)
            }
        } catch (error) {
            console.error('Error sending reply:', error)
        } finally {
            setSendingReply(false)
        }
    }

    const handleFileUpload = async (file: File) => {
        if (!selectedCollaboration) return

        setUploadingFile(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch(`/api/collaborations/${selectedCollaboration.id}/files`, {
                method: 'POST',
                body: formData,
            })

            if (response.ok) {
                const data = await response.json()
                // Update files array
                setFiles([data.file, ...files])
                
                // Don't create a message, file upload is enough
                // Just refresh the files list
                const filesResponse = await fetch(`/api/collaborations/${selectedCollaboration.id}/files`)
                if (filesResponse.ok) {
                    const filesData = await filesResponse.json()
                    setFiles(filesData.files || [])
                }
            }
        } catch (error) {
            console.error('Error uploading file:', error)
            alert('Failed to upload file. Please try again.')
        } finally {
            setUploadingFile(false)
        }
    }

    const handleAttachmentClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFileUpload(file)
            // Reset the input so the same file can be uploaded again
            e.target.value = ''
        }
    }

    const openEditDialog = () => {
        if (selectedCollaboration) {
            setEditName(selectedCollaboration.name)
            setEditDescription(selectedCollaboration.description || '')
            setEditDialogOpen(true)
        }
    }

    const saveEdit = async () => {
        if (!selectedCollaboration) return

        setSavingEdit(true)
        try {
            const response = await fetch(`/api/collaborations/${selectedCollaboration.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName,
                    description: editDescription,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                setSelectedCollaboration(data.collaboration)
                setCollaborations(collaborations.map(c => 
                    c.id === data.collaboration.id ? data.collaboration : c
                ))
                setEditDialogOpen(false)
            }
        } catch (error) {
            console.error('Error updating collaboration:', error)
        } finally {
            setSavingEdit(false)
        }
    }

    const handleArchive = async () => {
        if (!selectedCollaboration) return

        setArchiving(true)
        try {
            const response = await fetch(`/api/collaborations/${selectedCollaboration.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isArchived: true,
                }),
            })

            if (response.ok) {
                const archivedId = selectedCollaboration.id
                // Clear selected collaboration first
                setSelectedCollaboration(null)
                setMessages([])
                setFiles([])
                // Refresh the collaborations list
                await fetchCollaborations()
                setArchiveDialogOpen(false)
                // Switch to archived view to show the archived chat
                setShowArchived(true)
            }
        } catch (error) {
            console.error('Error archiving collaboration:', error)
        } finally {
            setArchiving(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedCollaboration) return

        setDeleting(true)
        try {
            const response = await fetch(`/api/collaborations/${selectedCollaboration.id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setCollaborations(collaborations.filter(c => c.id !== selectedCollaboration.id))
                setSelectedCollaboration(null)
                setDeleteDialogOpen(false)
            }
        } catch (error) {
            console.error('Error deleting collaboration:', error)
        } finally {
            setDeleting(false)
        }
    }

    const openAddMemberDialog = async () => {
        setAddMemberDialogOpen(true)
        setLoadingUsers(true)
        try {
            const response = await fetch('/api/users/onboarded')
            if (response.ok) {
                const data = await response.json()
                // Filter out users who are already members
                const currentMemberIds = selectedCollaboration?.members.map(m => m.user.id) || []
                const available = data.users.filter((u: any) => !currentMemberIds.includes(u.id))
                setAvailableUsers(available)
            }
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoadingUsers(false)
        }
    }

    const handleAddMembers = async () => {
        if (!selectedCollaboration || selectedMembers.length === 0) return

        setAddingMembers(true)
        try {
            // Add members one by one
            for (const userId of selectedMembers) {
                await fetch(`/api/collaborations/${selectedCollaboration.id}/members`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, role: 'MEMBER' }),
                })
            }
            
            // Refresh collaboration data
            await selectCollaboration(selectedCollaboration)
            await fetchCollaborations()
            
            setAddMemberDialogOpen(false)
            setSelectedMembers([])
        } catch (error) {
            console.error('Error adding members:', error)
            alert('Failed to add members. Please try again.')
        } finally {
            setAddingMembers(false)
        }
    }

    const getDisplayName = (userObj: any) => {
        if (!userObj) return 'Unknown User'
        return userObj.firstName && userObj.lastName
            ? `${userObj.firstName} ${userObj.lastName}`
            : userObj.name || userObj.email
    }

    const isImageFile = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase()
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '')
    }

    const isPdfFile = (fileName: string) => {
        return fileName.toLowerCase().endsWith('.pdf')
    }

    const isVideoFile = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase()
        return ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext || '')
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const filteredCollaborations = collaborations
        .filter(c => showArchived ? c.isArchived === true : c.isArchived !== true)
        .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
            {/* Left Sidebar - Chat List */}
            <div className="w-80 border-r bg-background flex flex-col">
                {/* Header */}
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Collaborate
                        </h2>
                    </div>
                    
                    {/* New/Active/Archived Toggle - Same style as Chat/Files tabs */}
                    <div className="inline-flex h-8 items-center rounded-md bg-muted p-1 text-muted-foreground mb-3">
                        <button
                            onClick={() => setCollaborationDialogOpen(true)}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-background/80"
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            New
                        </button>
                        <button
                            onClick={() => setShowArchived(false)}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                !showArchived ? "bg-background text-foreground shadow-sm" : "hover:bg-background/80"
                            )}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setShowArchived(true)}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                showArchived ? "bg-background text-foreground shadow-sm" : "hover:bg-background/80"
                            )}
                        >
                            <Archive className="h-3 w-3 mr-1" />
                            Archived
                        </button>
                    </div>
                    
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                {/* Chat List */}
                <ScrollArea className="flex-1">
                    {loading ? (
                        <div className="p-4 text-center text-muted-foreground">
                            Loading...
                        </div>
                    ) : filteredCollaborations.length === 0 ? (
                        <div className="p-4 text-center">
                            <MessageSquare className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                            <p className="text-sm text-muted-foreground">
                                {searchQuery ? 'No chats found' : 'No collaborations yet'}
                            </p>
                            {!searchQuery && (
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => setCollaborationDialogOpen(true)}
                                    className="mt-2"
                                >
                                    Create your first chat
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="p-2">
                            {filteredCollaborations.map((collaboration) => (
                                <div
                                    key={collaboration.id}
                                    onClick={() => selectCollaboration(collaboration)}
                                    className={cn(
                                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors mb-1",
                                        selectedCollaboration?.id === collaboration.id
                                            ? "bg-primary/10 border border-primary/20"
                                            : "hover:bg-accent"
                                    )}
                                >
                                    <Avatar className="h-9 w-9 shrink-0">
                                        <AvatarFallback className="text-xs">
                                            {collaboration.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-sm font-semibold truncate flex-1">
                                                {collaboration.name}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                                                <span>
                                                    {new Date(collaboration.updatedAt).toLocaleDateString([], {
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                                <span>•</span>
                                                <div className="flex items-center gap-0.5">
                                                    <Users className="h-3 w-3" />
                                                    <span>{collaboration.members.length}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-background">
                {selectedCollaboration ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-3 border-b bg-background">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="text-xs">
                                            {selectedCollaboration.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h2 className="text-sm font-semibold">{selectedCollaboration.name}</h2>
                                        <button
                                            onClick={() => setViewMembersDialogOpen(true)}
                                            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                                        >
                                            <Users className="h-3 w-3" />
                                            {selectedCollaboration.members.length}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Tabs */}
                                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                                        <TabsList className="h-8">
                                            <TabsTrigger value="chat" className="text-xs px-3 py-1">
                                                <MessageSquare className="h-3 w-3 mr-1" />
                                                Chat
                                            </TabsTrigger>
                                            <TabsTrigger value="files" className="text-xs px-3 py-1">
                                                <FileText className="h-3 w-3 mr-1" />
                                                Files ({files.length})
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                    
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuLabel>Chat Options</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={openEditDialog}>
                                                <Edit2 className="h-4 w-4 mr-2" />
                                                Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={openAddMemberDialog}>
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                Add Members
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {selectedCollaboration?.isArchived ? (
                                                <DropdownMenuItem onClick={async () => {
                                                    try {
                                                        const response = await fetch(`/api/collaborations/${selectedCollaboration.id}`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ isArchived: false }),
                                                        })
                                                        if (response.ok) {
                                                            // Clear selected collaboration first
                                                            setSelectedCollaboration(null)
                                                            setMessages([])
                                                            setFiles([])
                                                            // Refresh the collaborations list
                                                            await fetchCollaborations()
                                                            // Switch to active view
                                                            setShowArchived(false)
                                                        }
                                                    } catch (error) {
                                                        console.error('Error unarchiving:', error)
                                                    }
                                                }}>
                                                    <Archive className="h-4 w-4 mr-2" />
                                                    Unarchive Chat
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem onClick={() => setArchiveDialogOpen(true)}>
                                                    <Archive className="h-4 w-4 mr-2" />
                                                    Archive Chat
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem 
                                                className="text-destructive"
                                                onClick={() => setDeleteDialogOpen(true)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete Chat
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        {activeTab === 'chat' ? (
                            <>
                                {/* Messages Area */}
                                <ScrollArea className="flex-1 p-4">
                                    {loadingMessages ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            Loading messages...
                                        </div>
                                    ) : messages.length === 0 && files.length === 0 ? (
                                        <div className="text-center py-8">
                                            <MessageSquare className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                                            <p className="text-muted-foreground">No messages yet</p>
                                            <p className="text-sm text-muted-foreground">
                                                Start the conversation!
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Combined timeline of messages and files sorted by timestamp */}
                                            {[
                                                ...messages.map(m => ({ type: 'message' as const, data: m, timestamp: new Date(m.createdAt).getTime() })),
                                                ...files.map(f => ({ type: 'file' as const, data: f, timestamp: new Date(f.createdAt || f.uploadedAt).getTime() }))
                                            ]
                                                .sort((a, b) => a.timestamp - b.timestamp)
                                                .map((item) => {
                                                    if (item.type === 'file') {
                                                        const file = item.data as CollaborationFile
                                                        return (
                                                            <div key={`file-${file.id}`} className="flex gap-3">
                                                                <Avatar className="h-8 w-8 shrink-0">
                                                                    <AvatarImage src={file.user.avatar || undefined} />
                                                                    <AvatarFallback className="text-xs">
                                                                        {getInitials(getDisplayName(file.user))}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col max-w-[70%]">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-xs font-medium">
                                                                            {getDisplayName(file.user)}
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {new Date(file.createdAt || file.uploadedAt).toLocaleTimeString([], {
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </span>
                                                                    </div>
                                                                    <Card className="p-3 relative group">
                                                                        {/* File Preview */}
                                                                        {isImageFile(file.fileName) && (
                                                                            <div className="mb-2 relative w-full max-w-xs">
                                                                                <Image
                                                                                    src={file.fileUrl}
                                                                                    alt={file.fileName}
                                                                                    width={300}
                                                                                    height={200}
                                                                                    className="rounded-lg object-cover w-full h-auto max-h-40 cursor-pointer"
                                                                                    onClick={() => window.open(file.fileUrl, '_blank')}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        
                                                                        {isVideoFile(file.fileName) && (
                                                                            <div className="mb-2 relative w-full max-w-xs">
                                                                                <video
                                                                                    src={file.fileUrl}
                                                                                    controls
                                                                                    className="rounded-lg w-full h-auto max-h-40"
                                                                                >
                                                                                    Your browser does not support the video tag.
                                                                                </video>
                                                                            </div>
                                                                        )}
                                                                        
                                                                        {isPdfFile(file.fileName) && (
                                                                            <div className="mb-2 relative w-full max-w-xs">
                                                                                <div className="bg-muted rounded-lg p-4 flex items-center justify-center">
                                                                                    <FileText className="h-12 w-12 text-muted-foreground" />
                                                                                </div>
                                                                                <p className="text-xs text-center text-muted-foreground mt-1">PDF Document</p>
                                                                            </div>
                                                                        )}
                                                                        
                                                                        <div className="flex items-center gap-3">
                                                                            {!isImageFile(file.fileName) && !isVideoFile(file.fileName) && !isPdfFile(file.fileName) && (
                                                                                <div className="p-2 bg-primary/10 rounded">
                                                                                    <FileText className="h-5 w-5 text-primary" />
                                                                                </div>
                                                                            )}
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm font-medium truncate">{file.fileName}</p>
                                                                                <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
                                                                            </div>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 shrink-0"
                                                                                onClick={() => window.open(file.fileUrl, '_blank')}
                                                                            >
                                                                                <Download className="h-4 w-4" />
                                                                            </Button>
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="h-8 w-8 shrink-0"
                                                                                    >
                                                                                        <MoreVertical className="h-4 w-4" />
                                                                                    </Button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="end">
                                                                                    <DropdownMenuItem
                                                                                        className="text-destructive"
                                                                                        onClick={async () => {
                                                                                            if (confirm('Delete this file?')) {
                                                                                                try {
                                                                                                    const response = await fetch(`/api/collaborations/${selectedCollaboration?.id}/files/${file.id}`, {
                                                                                                        method: 'DELETE'
                                                                                                    })
                                                                                                    if (response.ok) {
                                                                                                        setFiles(files.filter(f => f.id !== file.id))
                                                                                                    }
                                                                                                } catch (error) {
                                                                                                    console.error('Error deleting file:', error)
                                                                                                }
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                                        Delete File
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        </div>
                                                                    </Card>
                                                                </div>
                                                            </div>
                                                        )
                                                    } else {
                                                        const message = item.data as Message
                                                        const isOwnMessage = message.user.id === user?.id
                                                        return (
                                                            <div
                                                                key={`message-${message.id}`}
                                                                className={cn(
                                                                    "flex gap-3 group relative",
                                                                    isOwnMessage && "flex-row-reverse"
                                                                )}
                                                            >
                                                                <Avatar className="h-8 w-8 shrink-0">
                                                                    <AvatarImage src={message.user.avatar || undefined} />
                                                                    <AvatarFallback className="text-xs">
                                                                        {getInitials(getDisplayName(message.user))}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div
                                                                    className={cn(
                                                                        "flex flex-col max-w-[70%] relative",
                                                                        isOwnMessage && "items-end"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-xs font-medium">
                                                                            {isOwnMessage ? 'You' : getDisplayName(message.user)}
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {new Date(message.createdAt).toLocaleTimeString([], {
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </span>
                                                                    </div>
                                                                    <div className="relative">
                                                                        <div
                                                                            className={cn(
                                                                                "rounded-lg px-4 py-2",
                                                                                isOwnMessage
                                                                                    ? "bg-primary text-primary-foreground"
                                                                                    : "bg-muted"
                                                                            )}
                                                                        >
                                                                            {/* Reply Reference */}
                                                                            {message.parent && (
                                                                                <div className={cn(
                                                                                    "mb-2 pb-2 border-b text-xs opacity-80",
                                                                                    isOwnMessage ? "border-primary-foreground/20" : "border-border"
                                                                                )}>
                                                                                    <div className="flex items-start gap-1">
                                                                                        <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <div className="font-medium truncate">
                                                                                                {getDisplayName(message.parent.user)}
                                                                                            </div>
                                                                                            <div className="truncate">
                                                                                                {message.parent.content}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            <p className="text-sm whitespace-pre-wrap">
                                                                                {message.content}
                                                                            </p>
                                                                        </div>
                                                                        
                                                                        {/* Action Menu on Hover - Vertical */}
                                                                        <div className={cn(
                                                                            "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                                                                            isOwnMessage ? "-left-16" : "-right-16"
                                                                        )}>
                                                                            <div className="flex flex-col bg-background border rounded-lg shadow-lg overflow-hidden">
                                                                                <TooltipProvider>
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                className="h-10 w-14 rounded-none border-b justify-center"
                                                                                                onClick={() => {
                                                                                                    setReplyingTo(message)
                                                                                                }}
                                                                                            >
                                                                                                <MessageSquare className="h-4 w-4" />
                                                                                            </Button>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent side="left">Reply</TooltipContent>
                                                                                    </Tooltip>
                                                                                    
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                className="h-10 w-14 rounded-none border-b justify-center"
                                                                                                onClick={() => {
                                                                                                    setSelectedMessage(message)
                                                                                                    setCreateTaskDialogOpen(true)
                                                                                                }}
                                                                                            >
                                                                                                <FileText className="h-4 w-4" />
                                                                                            </Button>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent side="left">Task</TooltipContent>
                                                                                    </Tooltip>
                                                                                    
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                className="h-10 w-14 rounded-none justify-center"
                                                                                                onClick={() => {
                                                                                                    setSelectedMessage(message)
                                                                                                    setReminderDialogOpen(true)
                                                                                                }}
                                                                                            >
                                                                                                <Clock className="h-4 w-4" />
                                                                                            </Button>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent side="left">Remind</TooltipContent>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Inline Reply Box */}
                                                                    {replyingTo?.id === message.id && (
                                                                        <div className="mt-2 ml-11">
                                                                            <Card className="p-3">
                                                                                <div className="mb-2">
                                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                                        <MessageSquare className="h-3 w-3" />
                                                                                        <span>Replying to {getDisplayName(message.user)}</span>
                                                                                    </div>
                                                                                    <p className="text-xs text-muted-foreground truncate">
                                                                                        {message.content}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="flex items-end gap-2">
                                                                                    <Textarea
                                                                                        placeholder="Type your reply..."
                                                                                        value={replyInput}
                                                                                        onChange={(e) => setReplyInput(e.target.value)}
                                                                                        onKeyDown={(e) => {
                                                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                                                e.preventDefault()
                                                                                                sendReply()
                                                                                            }
                                                                                            if (e.key === 'Escape') {
                                                                                                setReplyingTo(null)
                                                                                                setReplyInput('')
                                                                                            }
                                                                                        }}
                                                                                        className="resize-none min-h-[60px]"
                                                                                        rows={2}
                                                                                        autoFocus
                                                                                    />
                                                                                    <div className="flex flex-col gap-1 shrink-0">
                                                                                        <Button
                                                                                            size="sm"
                                                                                            onClick={sendReply}
                                                                                            disabled={!replyInput.trim() || sendingReply}
                                                                                        >
                                                                                            {sendingReply ? (
                                                                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                                                                            ) : (
                                                                                                <Send className="h-4 w-4" />
                                                                                            )}
                                                                                        </Button>
                                                                                        <Button
                                                                                            size="sm"
                                                                                            variant="outline"
                                                                                            onClick={() => {
                                                                                                setReplyingTo(null)
                                                                                                setReplyInput('')
                                                                                            }}
                                                                                        >
                                                                                            ✕
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            </Card>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    }
                                                })}
                                        </div>
                                    )}
                                </ScrollArea>

                                {/* Message Input */}
                                <div className="p-4 pb-8 border-t bg-background">
                                    <TooltipProvider>
                                        <div className="flex items-end gap-2">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="shrink-0"
                                                        onClick={handleAttachmentClick}
                                                        disabled={uploadingFile}
                                                    >
                                                        {uploadingFile ? (
                                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                        ) : (
                                                            <Paperclip className="h-5 w-5" />
                                                        )}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Upload file or image</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            
                                            <Textarea
                                                placeholder="Type a message..."
                                                value={messageInput}
                                                onChange={(e) => setMessageInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault()
                                                        sendMessage()
                                                    }
                                                }}
                                                className="resize-none min-h-[44px] max-h-32"
                                                rows={1}
                                            />
                                            
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        onClick={sendMessage}
                                                        disabled={!messageInput.trim() || sendingMessage}
                                                        className="shrink-0"
                                                    >
                                                        <Send className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Send message (Enter)</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </TooltipProvider>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Press Enter to send, Shift+Enter for new line
                                    </p>
                                </div>

                                {/* Hidden File Input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </>
                        ) : (
                            /* Files Tab */
                            <div className="flex-1 p-4 overflow-auto">
                                {loadingFiles ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Loading files...
                                    </div>
                                ) : files.length === 0 ? (
                                    <div className="text-center py-8">
                                        <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                                        <p className="text-muted-foreground">No files shared yet</p>
                                        <p className="text-sm text-muted-foreground">
                                            Upload files from the chat tab
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {files.map((file) => (
                                            <Card key={file.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <FileText className="h-8 w-8 text-primary" />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => window.open(file.fileUrl, '_blank')}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <h3 className="font-semibold text-sm mb-1 truncate">
                                                        {file.fileName}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground mb-2">
                                                        {formatFileSize(file.fileSize)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Shared by {getDisplayName(file.user)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(file.createdAt).toLocaleDateString()}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">Select a chat</h3>
                            <p className="text-muted-foreground mb-4">
                                Choose a collaboration from the list to start messaging
                            </p>
                            <Button onClick={() => setCollaborationDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create New Chat
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Collaboration Dialog */}
            <CollaborationDialog
                open={collaborationDialogOpen}
                onOpenChange={setCollaborationDialogOpen}
                onSuccess={() => {
                    fetchCollaborations()
                }}
            />

            {/* Edit Collaboration Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Chat Details</DialogTitle>
                        <DialogDescription>
                            Update the name and description of this collaboration
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Chat Name</Label>
                            <Input
                                id="edit-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Enter chat name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Enter chat description"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveEdit} disabled={savingEdit || !editName.trim()}>
                            {savingEdit ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Archive Confirmation Dialog */}
            <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archive this chat?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This chat will be moved to archives. You can still access it later from the archived chats section.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleArchive} disabled={archiving}>
                            {archiving ? 'Archiving...' : 'Archive Chat'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this chat permanently?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. All messages, files, and suggestions will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete} 
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? 'Deleting...' : 'Delete Permanently'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Add Members Dialog */}
            <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Members to Chat</DialogTitle>
                        <DialogDescription>
                            Select users to add to this collaboration
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {loadingUsers ? (
                            <div className="text-center py-4 text-muted-foreground">
                                Loading users...
                            </div>
                        ) : availableUsers.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                No available users to add
                            </div>
                        ) : (
                            <ScrollArea className="h-[300px] pr-4">
                                <div className="space-y-2">
                                    {availableUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border",
                                                selectedMembers.includes(user.id)
                                                    ? "bg-primary/10 border-primary"
                                                    : "hover:bg-accent border-transparent"
                                            )}
                                            onClick={() => {
                                                setSelectedMembers(prev =>
                                                    prev.includes(user.id)
                                                        ? prev.filter(id => id !== user.id)
                                                        : [...prev, user.id]
                                                )
                                            }}
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatar || undefined} />
                                                <AvatarFallback className="text-xs">
                                                    {getInitials(getDisplayName(user))}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {getDisplayName(user)}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {user.email}
                                                </p>
                                            </div>
                                            {selectedMembers.includes(user.id) && (
                                                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                                    <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setAddMemberDialogOpen(false)
                            setSelectedMembers([])
                        }}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleAddMembers} 
                            disabled={addingMembers || selectedMembers.length === 0}
                        >
                            {addingMembers ? 'Adding...' : `Add ${selectedMembers.length} Member${selectedMembers.length !== 1 ? 's' : ''}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* View Members Dialog */}
            <Dialog open={viewMembersDialogOpen} onOpenChange={setViewMembersDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Chat Members</DialogTitle>
                        <DialogDescription>
                            {selectedCollaboration?.members.length} member{selectedCollaboration?.members.length !== 1 ? 's' : ''} in this chat
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-2">
                            {selectedCollaboration?.members.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-3 p-3 rounded-lg border"
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={member.user.avatar || undefined} />
                                        <AvatarFallback>
                                            {getInitials(getDisplayName(member.user))}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {getDisplayName(member.user)}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {member.user.email}
                                        </p>
                                    </div>
                                    {member.role === 'OWNER' && (
                                        <Badge variant="secondary" className="text-xs">
                                            Owner
                                        </Badge>
                                    )}
                                    {member.role === 'ADMIN' && (
                                        <Badge variant="secondary" className="text-xs">
                                            Admin
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <Button onClick={() => setViewMembersDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Task from Message Dialog */}
            {selectedMessage && selectedCollaboration && (
                <CreateTaskFromMessageDialog
                    open={createTaskDialogOpen}
                    onClose={() => {
                        setCreateTaskDialogOpen(false)
                        setSelectedMessage(null)
                    }}
                    messageContent={selectedMessage.content}
                    messageId={selectedMessage.id}
                    collaborationId={selectedCollaboration.id}
                    onSuccess={() => {
                        // Optionally refresh something or show a success message
                        alert('Task created successfully!')
                    }}
                />
            )}

            {/* Set Reminder Dialog */}
            {selectedMessage && (
                <SetReminderDialog
                    open={reminderDialogOpen}
                    onClose={() => {
                        setReminderDialogOpen(false)
                        setSelectedMessage(null)
                    }}
                    messageContent={selectedMessage.content}
                    messageId={selectedMessage.id}
                    onSuccess={() => {
                        // Optionally refresh something or show a success message
                        alert('Reminder set successfully!')
                    }}
                />
            )}
        </div>
    )
}
