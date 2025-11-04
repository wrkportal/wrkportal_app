'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
    MessageSquare,
    Users,
    FileText,
    Lightbulb,
    Send,
    Upload,
    Download,
    Trash2,
    ArrowLeft,
    MoreVertical,
    Check,
    X,
    Edit,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Briefcase
} from 'lucide-react'
import { getInitials, cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function CollaborationDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const user = useAuthStore((state) => state.user)
    const [collaboration, setCollaboration] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('messages')
    
    // Messages state
    const [messageContent, setMessageContent] = useState('')
    const [sendingMessage, setSendingMessage] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    
    // Files state
    const [uploadingFile, setUploadingFile] = useState(false)
    const [fileDescription, setFileDescription] = useState('')
    
    // Suggestions state
    const [suggestionForm, setSuggestionForm] = useState({
        title: '',
        description: '',
        suggestionType: 'GENERAL',
        suggestedContent: ''
    })
    const [submittingSuggestion, setSubmittingSuggestion] = useState(false)

    useEffect(() => {
        fetchCollaboration()
    }, [params.id])

    useEffect(() => {
        if (activeTab === 'messages') {
            scrollToBottom()
        }
    }, [collaboration?.messages, activeTab])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchCollaboration = async () => {
        try {
            const response = await fetch(`/api/collaborations/${params.id}`)
            if (response.ok) {
                const data = await response.json()
                setCollaboration(data.collaboration)
            } else if (response.status === 404) {
                router.push('/collaborate')
            }
        } catch (error) {
            console.error('Error fetching collaboration:', error)
        } finally {
            setLoading(false)
        }
    }

    const sendMessage = async () => {
        if (!messageContent.trim()) return

        setSendingMessage(true)
        try {
            const response = await fetch(`/api/collaborations/${params.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: messageContent, mentions: [] }),
            })

            if (response.ok) {
                setMessageContent('')
                await fetchCollaboration()
            } else {
                alert('Failed to send message')
            }
        } catch (error) {
            console.error('Error sending message:', error)
            alert('Failed to send message')
        } finally {
            setSendingMessage(false)
        }
    }

    const uploadFile = async (file: File) => {
        if (!file) return

        setUploadingFile(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            if (fileDescription) {
                formData.append('description', fileDescription)
            }

            const response = await fetch(`/api/collaborations/${params.id}/files`, {
                method: 'POST',
                body: formData,
            })

            if (response.ok) {
                setFileDescription('')
                await fetchCollaboration()
            } else {
                alert('Failed to upload file')
            }
        } catch (error) {
            console.error('Error uploading file:', error)
            alert('Failed to upload file')
        } finally {
            setUploadingFile(false)
        }
    }

    const createSuggestion = async () => {
        if (!suggestionForm.title.trim() || !suggestionForm.description.trim()) {
            alert('Please fill in title and description')
            return
        }

        setSubmittingSuggestion(true)
        try {
            const response = await fetch(`/api/collaborations/${params.id}/suggestions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(suggestionForm),
            })

            if (response.ok) {
                setSuggestionForm({
                    title: '',
                    description: '',
                    suggestionType: 'GENERAL',
                    suggestedContent: ''
                })
                await fetchCollaboration()
            } else {
                alert('Failed to create suggestion')
            }
        } catch (error) {
            console.error('Error creating suggestion:', error)
            alert('Failed to create suggestion')
        } finally {
            setSubmittingSuggestion(false)
        }
    }

    const respondToSuggestion = async (suggestionId: string, status: string, responseNote?: string) => {
        try {
            const response = await fetch(`/api/collaborations/${params.id}/suggestions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ suggestionId, status, responseNote }),
            })

            if (response.ok) {
                await fetchCollaboration()
            } else {
                alert('Failed to respond to suggestion')
            }
        } catch (error) {
            console.error('Error responding to suggestion:', error)
            alert('Failed to respond to suggestion')
        }
    }

    const getDisplayName = (user: any) => {
        return user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.name || user.email
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const getSuggestionStatusIcon = (status: string) => {
        switch (status) {
            case 'ACCEPTED':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />
            case 'REJECTED':
                return <XCircle className="h-4 w-4 text-red-500" />
            case 'IMPLEMENTED':
                return <Check className="h-4 w-4 text-blue-500" />
            default:
                return <AlertCircle className="h-4 w-4 text-yellow-500" />
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <p className="text-center">Loading collaboration...</p>
            </div>
        )
    }

    if (!collaboration) {
        return (
            <div className="container mx-auto p-6">
                <p className="text-center">Collaboration not found</p>
            </div>
        )
    }

    const canEdit = collaboration.members.some(
        (m: any) => m.userId === user?.id && (m.role === 'OWNER' || m.role === 'ADMIN' || m.canEdit)
    )

    const isOwner = collaboration.createdById === user?.id

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/collaborate')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{collaboration.name}</h1>
                        {collaboration.description && (
                            <p className="text-muted-foreground mt-1">{collaboration.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge>{collaboration.type}</Badge>
                    <Badge variant="outline">{collaboration.status}</Badge>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-blue-500" />
                            <div>
                                <p className="text-2xl font-bold">{collaboration.messages?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Messages</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-green-500" />
                            <div>
                                <p className="text-2xl font-bold">{collaboration.files?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Files</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-orange-500" />
                            <div>
                                <p className="text-2xl font-bold">{collaboration.suggestions?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Suggestions</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-purple-500" />
                            <div>
                                <p className="text-2xl font-bold">{collaboration.members?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Members</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Tabs */}
                <div className="lg:col-span-2">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="messages">Messages</TabsTrigger>
                            <TabsTrigger value="files">Files</TabsTrigger>
                            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                        </TabsList>

                        {/* Messages Tab */}
                        <TabsContent value="messages" className="mt-4">
                            <Card className="h-[600px] flex flex-col">
                                <CardHeader>
                                    <CardTitle className="text-lg">Discussion</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-y-auto space-y-4">
                                    {collaboration.messages?.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>No messages yet. Start the conversation!</p>
                                        </div>
                                    ) : (
                                        collaboration.messages?.map((message: any) => (
                                            <div key={message.id} className="flex gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={message.user.avatar || undefined} />
                                                    <AvatarFallback className="text-xs">
                                                        {getInitials(getDisplayName(message.user))}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm">
                                                            {getDisplayName(message.user)}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(message.createdAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm mt-1 whitespace-pre-wrap">{message.content}</p>
                                                    {message.isEdited && (
                                                        <span className="text-xs text-muted-foreground italic">(edited)</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </CardContent>
                                <Separator />
                                <div className="p-4">
                                    <div className="flex gap-2">
                                        <Textarea
                                            placeholder="Type your message..."
                                            value={messageContent}
                                            onChange={(e) => setMessageContent(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault()
                                                    sendMessage()
                                                }
                                            }}
                                            rows={2}
                                            className="flex-1"
                                        />
                                        <Button
                                            onClick={sendMessage}
                                            disabled={!messageContent.trim() || sendingMessage}
                                            size="icon"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>

                        {/* Files Tab */}
                        <TabsContent value="files" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Shared Files</CardTitle>
                                    <CardDescription>Upload and manage collaboration files</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Upload Section */}
                                    <div className="border-2 border-dashed rounded-lg p-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="file-upload">Upload File</Label>
                                            <Input
                                                id="file-upload"
                                                type="file"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) uploadFile(file)
                                                }}
                                                disabled={uploadingFile}
                                            />
                                            {uploadingFile && <p className="text-sm text-muted-foreground">Uploading...</p>}
                                        </div>
                                    </div>

                                    {/* Files List */}
                                    {collaboration.files?.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>No files uploaded yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {collaboration.files?.map((file: any) => (
                                                <div
                                                    key={file.id}
                                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium text-sm">{file.fileName}</p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <span>{formatFileSize(file.fileSize)}</span>
                                                                <span>•</span>
                                                                <span>{getDisplayName(file.user)}</span>
                                                                <span>•</span>
                                                                <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                                                            </div>
                                                            {file.description && (
                                                                <p className="text-xs text-muted-foreground mt-1">{file.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => window.open(file.fileUrl, '_blank')}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Suggestions Tab */}
                        <TabsContent value="suggestions" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Suggestions</CardTitle>
                                    <CardDescription>Propose changes and improvements</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Create Suggestion Form */}
                                    <div className="border rounded-lg p-4 space-y-4">
                                        <h3 className="font-semibold">New Suggestion</h3>
                                        <div className="space-y-2">
                                            <Label htmlFor="suggestion-title">Title *</Label>
                                            <Input
                                                id="suggestion-title"
                                                value={suggestionForm.title}
                                                onChange={(e) =>
                                                    setSuggestionForm({ ...suggestionForm, title: e.target.value })
                                                }
                                                placeholder="Suggestion title"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="suggestion-type">Type</Label>
                                            <Select
                                                value={suggestionForm.suggestionType}
                                                onValueChange={(value) =>
                                                    setSuggestionForm({ ...suggestionForm, suggestionType: value })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="GENERAL">General</SelectItem>
                                                    <SelectItem value="CHANGE">Change</SelectItem>
                                                    <SelectItem value="ADDITION">Addition</SelectItem>
                                                    <SelectItem value="REMOVAL">Removal</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="suggestion-description">Description *</Label>
                                            <Textarea
                                                id="suggestion-description"
                                                value={suggestionForm.description}
                                                onChange={(e) =>
                                                    setSuggestionForm({ ...suggestionForm, description: e.target.value })
                                                }
                                                placeholder="Describe your suggestion..."
                                                rows={3}
                                            />
                                        </div>
                                        <Button onClick={createSuggestion} disabled={submittingSuggestion}>
                                            <Lightbulb className="h-4 w-4 mr-2" />
                                            {submittingSuggestion ? 'Submitting...' : 'Submit Suggestion'}
                                        </Button>
                                    </div>

                                    {/* Suggestions List */}
                                    {collaboration.suggestions?.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>No suggestions yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {collaboration.suggestions?.map((suggestion: any) => (
                                                <div key={suggestion.id} className="border rounded-lg p-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            {getSuggestionStatusIcon(suggestion.status)}
                                                            <h4 className="font-semibold">{suggestion.title}</h4>
                                                        </div>
                                                        <Badge variant="outline">{suggestion.suggestionType}</Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <span>
                                                            By {getDisplayName(suggestion.user)} •{' '}
                                                            {new Date(suggestion.createdAt).toLocaleDateString()}
                                                        </span>
                                                        {suggestion.status === 'PENDING' && canEdit && (
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => respondToSuggestion(suggestion.id, 'ACCEPTED')}
                                                                >
                                                                    <Check className="h-3 w-3 mr-1" />
                                                                    Accept
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => respondToSuggestion(suggestion.id, 'REJECTED')}
                                                                >
                                                                    <X className="h-3 w-3 mr-1" />
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {suggestion.respondedBy && (
                                                        <div className="mt-2 pt-2 border-t text-xs">
                                                            <p>
                                                                <span className="font-medium">Response:</span> {suggestion.status} by{' '}
                                                                {getDisplayName(suggestion.respondedBy)}
                                                            </p>
                                                            {suggestion.responseNote && (
                                                                <p className="text-muted-foreground mt-1">{suggestion.responseNote}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column - Members & Info */}
                <div className="space-y-4">
                    {/* Members Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Members ({collaboration.members?.length || 0})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {collaboration.members?.map((member: any) => (
                                <div key={member.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.user.avatar || undefined} />
                                            <AvatarFallback className="text-xs">
                                                {getInitials(getDisplayName(member.user))}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{getDisplayName(member.user)}</p>
                                            <p className="text-xs text-muted-foreground">{member.user.email}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {member.role}
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Linked Items */}
                    {(collaboration.project || collaboration.task) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Linked Items</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {collaboration.project && (
                                    <div className="flex items-center gap-2 p-2 border rounded">
                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">{collaboration.project.name}</p>
                                            <p className="text-xs text-muted-foreground">{collaboration.project.code}</p>
                                        </div>
                                    </div>
                                )}
                                {collaboration.task && (
                                    <div className="flex items-center gap-2 p-2 border rounded">
                                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">{collaboration.task.title}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Activity Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Created</span>
                                <span>{new Date(collaboration.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Last Updated</span>
                                <span>{new Date(collaboration.updatedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Created By</span>
                                <span>{getDisplayName(collaboration.createdBy)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

