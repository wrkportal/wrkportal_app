'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Search,
  Send,
  Paperclip,
  Mic,
  Phone,
  Video,
  MoreVertical,
  X,
  CheckCheck,
  Smile,
  Image as ImageIcon,
  FileText,
  ArrowUp,
  MessageSquare,
  Plus,
  UserPlus,
  Calendar,
  Clock,
  Users,
  CheckSquare,
  Reply,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Laugh,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import { format } from 'date-fns'
import { CollaborationDialog } from '@/components/dialogs/collaboration-dialog'
import { CreateTaskFromMessageDialog } from '@/components/dialogs/create-task-from-message-dialog'
import { StartCallButton } from '@/components/calls'
import { useCall } from '@/hooks/useCall'
import { useToast } from '@/hooks/use-toast'
import { CallInterface } from '@/components/calls'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface Collaboration {
  id: string
  name: string
  description: string | null
  type: string
  status: string
  isArchived: boolean
  isImportant?: boolean
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
  }
}

interface Message {
  id: string
  content: string
  createdAt: string
  userId: string
  parentId?: string | null
  user: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    email: string
    avatar: string | null
  }
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
  reactions?: Array<{
    emoji: string
    users: Array<{
      id: string
      name: string | null
      firstName: string | null
      lastName: string | null
    }>
  }>
}

interface CollaborationFile {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  uploadedAt: string
}

function CollaborateInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [collaborations, setCollaborations] = useState<Collaboration[]>([])
  const [selectedCollaboration, setSelectedCollaboration] = useState<Collaboration | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [files, setFiles] = useState<CollaborationFile[]>([])
  const [scheduledCalls, setScheduledCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [messageInput, setMessageInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [chatSearchQuery, setChatSearchQuery] = useState('')
  const [showGroupInfo, setShowGroupInfo] = useState(true)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [addPeopleDialogOpen, setAddPeopleDialogOpen] = useState(false)
  const [scheduleCallDialogOpen, setScheduleCallDialogOpen] = useState(false)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [selectedMessageForTask, setSelectedMessageForTask] = useState<Message | null>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [messageOptionsOpen, setMessageOptionsOpen] = useState<string | null>(null)
  const [showSearchBar, setShowSearchBar] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [chatCategory, setChatCategory] = useState<'current' | 'important' | 'archived'>('current')
  const [importantChats, setImportantChats] = useState<Set<string>>(new Set())
  const [showFilesSection, setShowFilesSection] = useState(true)
  const [showMeetingsSection, setShowMeetingsSection] = useState(true)
  const [showMembersSection, setShowMembersSection] = useState(true)
  const [showSummarySection, setShowSummarySection] = useState(true)
  const [notes, setNotes] = useState('')
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)

  // Fetch collaborations
  useEffect(() => {
    fetchCollaborations()
  }, [chatCategory])

  // Fetch notes and summary when collaboration is selected
  useEffect(() => {
    if (selectedCollaboration) {
      fetchNotes() // fetchNotes already fetches both notes and summary
    } else {
      setNotes('')
      setAiSummary(null)
    }
  }, [selectedCollaboration?.id])

  // Auto-select collaboration from URL or first one
  useEffect(() => {
    if (collaborations.length > 0 && !selectedCollaboration && !loading) {
      const collabId = searchParams.get('id')
      if (collabId) {
        const collab = collaborations.find(c => c.id === collabId)
        if (collab) {
          selectCollaboration(collab)
        }
      } else {
        selectCollaboration(collaborations[0])
      }
    }
  }, [collaborations, loading])

  // Fetch messages when collaboration is selected
  useEffect(() => {
    if (selectedCollaboration) {
      fetchMessages()
      fetchFiles()
      fetchScheduledCalls()
      // Poll for new messages every 3 seconds
      const interval = setInterval(fetchMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [selectedCollaboration?.id])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchCollaborations = async () => {
    try {
      const response = await fetch('/api/collaborations')
      if (response.ok) {
        const data = await response.json()
        const allCollabs = data.collaborations || []
        // Load important chats from localStorage
        const storedImportant = localStorage.getItem('important-chats')
        if (storedImportant) {
          try {
            const importantIds = JSON.parse(storedImportant)
            setImportantChats(new Set(importantIds))
          } catch (e) {
            console.error('Error parsing important chats:', e)
          }
        }
        // Filter based on category
        let collabs: Collaboration[]
        if (chatCategory === 'archived') {
          collabs = allCollabs.filter((c: Collaboration) => c.isArchived)
        } else if (chatCategory === 'important') {
          const importantIds = storedImportant ? JSON.parse(storedImportant) : []
          collabs = allCollabs.filter((c: Collaboration) => !c.isArchived && importantIds.includes(c.id))
        } else {
          collabs = allCollabs.filter((c: Collaboration) => !c.isArchived)
        }
        setCollaborations(collabs)
        // Calculate unread counts (simplified - you can enhance this)
        const counts: Record<string, number> = {}
        collabs.forEach((c: Collaboration) => {
          counts[c.id] = 0 // You can implement actual unread logic
        })
        setUnreadCounts(counts)
      }
    } catch (error) {
      console.error('Error fetching collaborations:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateChatCategory = async (collaborationId: string, category: 'current' | 'important' | 'archived') => {
    try {
      if (category === 'important') {
        const newImportant = new Set(importantChats)
        newImportant.add(collaborationId)
        setImportantChats(newImportant)
        localStorage.setItem('important-chats', JSON.stringify(Array.from(newImportant)))
      } else if (category === 'current') {
        const newImportant = new Set(importantChats)
        newImportant.delete(collaborationId)
        setImportantChats(newImportant)
        localStorage.setItem('important-chats', JSON.stringify(Array.from(newImportant)))
      } else if (category === 'archived') {
        const response = await fetch(`/api/collaborations/${collaborationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isArchived: true }),
        })
        if (response.ok) {
          await fetchCollaborations()
        }
      }
    } catch (error) {
      console.error('Error updating chat category:', error)
    }
  }

  const addMemberToCollaboration = async (userId: string) => {
    if (!selectedCollaboration) return

    try {
      const response = await fetch(`/api/collaborations/${selectedCollaboration.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: 'MEMBER' }),
      })

      if (response.ok) {
        // Refresh collaborations to get updated member list
        await fetchCollaborations()
        // Update selected collaboration
        const updated = collaborations.find(c => c.id === selectedCollaboration.id)
        if (updated) {
          setSelectedCollaboration(updated)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add member')
      }
    } catch (error) {
      console.error('Error adding member:', error)
      alert('Failed to add member')
    }
  }

  const fetchMessages = async () => {
    if (!selectedCollaboration) {
      console.log('[fetchMessages] No collaboration selected')
      return
    }
    try {
      console.log('[fetchMessages] Fetching messages for collaboration:', selectedCollaboration.id)
      const response = await fetch(`/api/collaborations/${selectedCollaboration.id}/messages`)
      console.log('[fetchMessages] Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        const messagesList = data.messages || []
        console.log('[fetchMessages] Fetched messages:', messagesList.length)
        if (messagesList.length > 0) {
          console.log('[fetchMessages] First message structure:', {
            id: messagesList[0].id,
            hasContent: !!messagesList[0].content,
            contentLength: messagesList[0].content?.length,
            hasUser: !!messagesList[0].user,
            userStructure: messagesList[0].user,
            createdAt: messagesList[0].createdAt
          })
        }
        setMessages(messagesList)
      } else {
        const errorText = await response.text()
        console.error('[fetchMessages] API error:', response.status, response.statusText, errorText)
      }
    } catch (error) {
      console.error('[fetchMessages] Error fetching messages:', error)
    }
  }

  const fetchFiles = async () => {
    if (!selectedCollaboration) return
    try {
      const response = await fetch(`/api/collaborations/${selectedCollaboration.id}/files`)
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }

  const fetchScheduledCalls = async () => {
    if (!selectedCollaboration) {
      console.log('[fetchScheduledCalls] No collaboration selected')
      return
    }
    console.log('[fetchScheduledCalls] Fetching calls for collaboration:', selectedCollaboration.id)
    try {
      // Fetch calls - API only returns calls where current user is a participant
      const response = await fetch('/api/calls')
      console.log('[fetchScheduledCalls] API response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('[fetchScheduledCalls] Total calls from API:', data.calls?.length || 0)
        console.log('[fetchScheduledCalls] Sample call:', data.calls?.[0])

        // Filter for scheduled calls (have scheduledAt)
        // Since API already filters to calls where user is participant,
        // and we're scheduling from this collaboration, these should be relevant
        const scheduledCalls = (data.calls || []).filter((call: any) => {
          // Check if scheduledAt exists and is not null/undefined/empty string
          const hasScheduledAt = call.scheduledAt &&
            call.scheduledAt !== null &&
            call.scheduledAt !== undefined &&
            call.scheduledAt !== ''
          console.log(`[fetchScheduledCalls] Call ${call.id}: title="${call.title}", scheduledAt=${call.scheduledAt}, hasScheduledAt=${hasScheduledAt}, type=${call.type}`)
          return hasScheduledAt
        })

        console.log('[fetchScheduledCalls] Scheduled calls found:', scheduledCalls.length)

        // Sort by scheduledAt date (upcoming first)
        scheduledCalls.sort((a: any, b: any) => {
          const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
          const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
          return dateA - dateB
        })

        console.log('[fetchScheduledCalls] Setting scheduled calls:', scheduledCalls)
        setScheduledCalls(scheduledCalls)
      } else {
        console.error('[fetchScheduledCalls] API error:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('[fetchScheduledCalls] Error response:', errorText)
      }
    } catch (error) {
      console.error('[fetchScheduledCalls] Error fetching scheduled calls:', error)
    }
  }

  const fetchNotes = async () => {
    if (!selectedCollaboration) return
    try {
      const response = await fetch(`/api/collaborations/${selectedCollaboration.id}/summary`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes || '')
        setAiSummary(data.summary || null)
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    }
  }

  const fetchSummary = async () => {
    if (!selectedCollaboration) return
    try {
      const response = await fetch(`/api/collaborations/${selectedCollaboration.id}/summary`)
      if (response.ok) {
        const data = await response.json()
        setAiSummary(data.summary || null)
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedCollaboration) return
    try {
      const response = await fetch(`/api/collaborations/${selectedCollaboration.id}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (!response.ok) {
        console.error('Error saving notes')
      }
    } catch (error) {
      console.error('Error saving notes:', error)
    }
  }

  const handleGenerateSummary = async () => {
    if (!selectedCollaboration || isGeneratingSummary) return
    setIsGeneratingSummary(true)
    try {
      const response = await fetch(`/api/collaborations/${selectedCollaboration.id}/summary/generate`, {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        setAiSummary(data.summary)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to generate summary')
      }
    } catch (error) {
      console.error('Error generating summary:', error)
      alert('Failed to generate summary')
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const selectCollaboration = async (collaboration: Collaboration) => {
    setSelectedCollaboration(collaboration)
    setMessages([])
    if (router) {
      router.push(`/collaborate?id=${collaboration.id}`, { scroll: false })
    }
    // Mark as read
    setUnreadCounts(prev => ({ ...prev, [collaboration.id]: 0 }))
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedCollaboration || sendingMessage) return

    setSendingMessage(true)
    try {
      const response = await fetch(`/api/collaborations/${selectedCollaboration.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageInput.trim(),
          mentions: [],
          replyToId: replyingTo?.id || null,
        }),
      })

      if (response.ok) {
        setMessageInput('')
        setReplyingTo(null)
        await fetchMessages()
        await fetchCollaborations() // Refresh to update last message
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedCollaboration) return

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/collaborations/${selectedCollaboration.id}/files`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        await fetchFiles()
        await fetchMessages()
      }
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return format(date, 'EEEE')
    return format(date, 'MMM d, yyyy')
  }

  const getLastMessage = (collaboration: Collaboration) => {
    // Get last message from the collaboration
    const lastMessage = (collaboration as any).messages?.[0]
    if (!lastMessage) return 'No messages yet'

    const senderName = lastMessage.userId === user?.id
      ? 'You'
      : getUserName(lastMessage.user)

    return `${senderName}: ${lastMessage.content.substring(0, 50)}${lastMessage.content.length > 50 ? '...' : ''}`
  }

  const getLastMessageTime = (collaboration: Collaboration) => {
    if (!collaboration.updatedAt) return ''
    const date = new Date(collaboration.updatedAt)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffMinutes < 1) return 'now'
    if (diffMinutes < 60) return `${diffMinutes}m`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d`
    return format(date, 'MMM d')
  }

  const getUserName = (user: { name: string | null; firstName: string | null; lastName: string | null }) => {
    if (user.name) return user.name
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim()
    }
    return 'Unknown'
  }

  const filteredCollaborations = collaborations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const onlineMembers = selectedCollaboration?.members.filter(() => {
    // You can implement actual online status logic here
    return Math.random() > 0.5 // Placeholder
  }) || []

  // Filter messages by search query
  const filteredMessages = messages.filter(message => {
    if (!chatSearchQuery.trim()) return true
    const searchLower = chatSearchQuery.toLowerCase()
    return (
      message.content.toLowerCase().includes(searchLower) ||
      getUserName(message.user).toLowerCase().includes(searchLower)
    )
  })

  // Group messages by date
  const groupedMessages = filteredMessages.reduce((acc, message) => {
    const date = formatDate(message.createdAt)
    if (!acc[date]) acc[date] = []
    acc[date].push(message)
    return acc
  }, {} as Record<string, Message[]>)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="grid h-full min-h-0 w-full bg-background overflow-x-hidden grid-cols-[auto_minmax(0,1fr)_auto] gap-0 px-0 -mt-16 pt-16">
      {/* Left Sidebar - Chat List */}
      <div className="w-64 md:w-64 lg:w-64 min-w-[240px] max-w-[400px] border-r bg-card/50 backdrop-blur-sm flex flex-col h-full min-h-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-card/80 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg md:text-xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Discussions
            </h1>
          </div>

          {/* Search Bar and New Discussion Button in one row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search conversations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-7 text-xs bg-background/50"
              />
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              title="New Discussion"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Category Dropdowns */}
        <div className="px-2 pt-2 pb-1 border-b flex gap-1">
          <Button
            variant={chatCategory === 'current' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={() => setChatCategory('current')}
          >
            Current
          </Button>
          <Button
            variant={chatCategory === 'important' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={() => setChatCategory('important')}
          >
            Important
          </Button>
          <Button
            variant={chatCategory === 'archived' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={() => setChatCategory('archived')}
          >
            Archived
          </Button>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {filteredCollaborations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create a new discussion to get started</p>
              </div>
            ) : (
              filteredCollaborations.map((collaboration) => {
                const isSelected = selectedCollaboration?.id === collaboration.id
                const unread = unreadCounts[collaboration.id] || 0
                const lastMessage = getLastMessage(collaboration)
                const lastTime = getLastMessageTime(collaboration)

                return (
                  <div
                    key={collaboration.id}
                    className={cn(
                      'w-full rounded-lg transition-all duration-200 group relative',
                      isSelected
                        ? 'bg-accent border-l-4 border-primary shadow-sm'
                        : 'hover:bg-accent/50 border-l-4 border-transparent'
                    )}
                  >
                    <button
                      onClick={() => selectCollaboration(collaboration)}
                      className="w-full p-3 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className={cn(
                          "h-8 w-8 md:h-9 md:w-9 flex-shrink-0 ring-2 ring-offset-2 ring-offset-background",
                          isSelected ? "ring-primary/30" : "ring-transparent"
                        )}>
                          <AvatarFallback className={cn(
                            'text-xs font-semibold',
                            isSelected ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'
                          )}>
                            {getInitials(collaboration.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn(
                              'font-semibold text-sm truncate text-black dark:text-white',
                              isSelected ? 'font-medium' : ''
                            )}>
                              {collaboration.name}
                            </span>
                            {lastTime && (
                              <span className={cn(
                                'text-xs ml-2 flex-shrink-0',
                                isSelected ? 'text-primary/70' : 'text-muted-foreground'
                              )}>
                                {lastTime}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn(
                              'text-xs truncate flex-1',
                              isSelected ? 'text-foreground/80' : 'text-muted-foreground'
                            )}>
                              {lastMessage}
                            </p>
                            {unread > 0 && (
                              <Badge className={cn(
                                'h-5 min-w-5 px-1.5 text-xs flex-shrink-0',
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-primary text-primary-foreground'
                              )}>
                                {unread}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {chatCategory !== 'important' && (
                          <DropdownMenuItem onClick={() => updateChatCategory(collaboration.id, 'important')}>
                            Mark as Important
                          </DropdownMenuItem>
                        )}
                        {chatCategory === 'important' && (
                          <DropdownMenuItem onClick={() => updateChatCategory(collaboration.id, 'current')}>
                            Remove from Important
                          </DropdownMenuItem>
                        )}
                        {chatCategory !== 'archived' && (
                          <DropdownMenuItem onClick={() => updateChatCategory(collaboration.id, 'archived')}>
                            Archive
                          </DropdownMenuItem>
                        )}
                        {chatCategory === 'archived' && (
                          <DropdownMenuItem onClick={async () => {
                            const response = await fetch(`/api/collaborations/${collaboration.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isArchived: false }),
                            })
                            if (response.ok) {
                              await fetchCollaborations()
                            }
                          }}>
                            Unarchive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Center Panel - Messages */}
      {selectedCollaboration ? (
        <div className="flex flex-col min-w-0 min-h-0 overflow-hidden h-full bg-background">
          {/* Top Bar */}
          <div className="h-16 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {showSearchBar ? (
                <div className="relative flex-shrink-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages"
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    className="pl-9 pr-9 w-64 h-9 text-sm bg-background/50"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowSearchBar(false)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-base text-foreground truncate">{selectedCollaboration.name}</h2>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedCollaboration.members.length} members, {onlineMembers.length} online
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 hover:bg-accent hover:text-primary transition-colors"
                      onClick={() => setShowSearchBar(!showSearchBar)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Search</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <StartCallButton
                        participantIds={selectedCollaboration?.members
                          .map(m => m.user?.id)
                          .filter((id): id is string => !!id && id !== user?.id) || undefined}
                        title={selectedCollaboration ? `Call: ${selectedCollaboration.name}` : undefined}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-accent hover:text-primary transition-colors"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Quick Call</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <VideoCallButton
                        participantIds={selectedCollaboration?.members
                          .map(m => m.user?.id)
                          .filter((id): id is string => !!id && id !== user?.id) || undefined}
                        title={selectedCollaboration ? `Video Call: ${selectedCollaboration.name}` : undefined}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-accent hover:text-primary transition-colors"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Video Call</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-accent hover:text-primary transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>More Options</p>
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setShowGroupInfo(!showGroupInfo)}>
                      {showGroupInfo ? 'Hide' : 'Show'} Group Info
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSettingsDialogOpen(true)}>
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipProvider>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 min-h-0 overflow-y-auto bg-muted/30">
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
              {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date}>
                  <div className="text-center mb-6">
                    <Badge variant="secondary" className="text-xs px-3 py-1 font-medium">
                      {date}
                    </Badge>
                  </div>
                  {dateMessages.map((message, idx) => {
                    if (!message.user) {
                      console.warn('Message missing user:', message)
                      return null
                    }
                    const isOwn = message.userId === user?.id
                    const prevMessage = idx > 0 ? dateMessages[idx - 1] : null
                    const isSameUser = prevMessage && prevMessage.userId === message.userId &&
                      (new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()) <= 300000 // 5 minutes
                    const showAvatar = !isSameUser
                    const showName = !isSameUser

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'flex gap-3 group',
                          isOwn && 'flex-row-reverse',
                          isSameUser ? 'mb-1' : 'mb-4'
                        )}
                      >
                        {showAvatar ? (
                          <Avatar className="h-9 w-9 flex-shrink-0">
                            <AvatarImage src={message.user?.avatar || undefined} />
                            <AvatarFallback className="text-xs font-medium">
                              {getInitials(getUserName(message.user))}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-9 flex-shrink-0" />
                        )}
                        <div className={cn('flex-1 max-w-[65%] lg:max-w-[55%] xl:max-w-[50%]', isOwn && 'flex flex-col items-end')}>
                          {showName && !isOwn && (
                            <div className="mb-1.5">
                              <span className="text-xs font-semibold text-foreground">
                                {getUserName(message.user)}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {formatTime(message.createdAt)}
                              </span>
                            </div>
                          )}
                          {message.parent && message.parent.user && (
                            <div className="mb-2 p-2 bg-muted/50 rounded-lg border-l-2 border-primary/30 text-xs text-muted-foreground">
                              <div className="font-medium text-foreground/70 mb-0.5">
                                Replying to {getUserName(message.parent.user)}
                              </div>
                              <div className="line-clamp-2">{message.parent.content}</div>
                            </div>
                          )}
                          <div
                            className={cn(
                              'rounded-2xl px-4 py-2.5 text-sm shadow-sm relative',
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-card border border-border rounded-bl-md'
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                            {message.reactions && message.reactions.length > 0 && (
                              <div className="flex gap-1.5 mt-2 flex-wrap">
                                {message.reactions.map((reaction, rIdx) => (
                                  <Button
                                    key={rIdx}
                                    variant="secondary"
                                    size="sm"
                                    className="h-6 px-2 text-xs hover:bg-accent"
                                    onClick={async () => {
                                      try {
                                        const response = await fetch(`/api/collaborations/${selectedCollaboration.id}/messages/${message.id}/react`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ emoji: reaction.emoji }),
                                        })
                                        if (response.ok) {
                                          await fetchMessages()
                                        }
                                      } catch (error) {
                                        console.error('Error toggling reaction:', error)
                                      }
                                    }}
                                  >
                                    {reaction.emoji} {reaction.users.length}
                                  </Button>
                                ))}
                              </div>
                            )}
                            {/* Message Options - appears on hover as a bar */}
                            <div className={cn(
                              'absolute opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-background/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-md border z-10',
                              isOwn ? '-left-2 -top-10' : '-right-2 -top-10'
                            )}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={async () => {
                                  setReplyingTo(message)
                                }}
                                title="Reply"
                              >
                                <Reply className="h-3.5 w-3.5 mr-1" />
                                Reply
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  setSelectedMessageForTask(message)
                                  setTaskDialogOpen(true)
                                }}
                                title="Create Task"
                              >
                                <CheckSquare className="h-3.5 w-3.5 mr-1" />
                                Task
                              </Button>
                              <div className="h-4 w-px bg-border mx-1" />
                              <div className="flex gap-0.5">
                                {['👍', '❤️', '😂', '👎', '🎉', '🔥', '💯', '😮'].map((emoji) => (
                                  <Button
                                    key={emoji}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 hover:bg-accent text-base"
                                    onClick={async (e) => {
                                      e.stopPropagation()
                                      try {
                                        const response = await fetch(`/api/collaborations/${selectedCollaboration.id}/messages/${message.id}/react`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ emoji }),
                                        })
                                        if (response.ok) {
                                          await fetchMessages()
                                        }
                                      } catch (error) {
                                        console.error('Error adding reaction:', error)
                                      }
                                    }}
                                    title={`React with ${emoji}`}
                                  >
                                    {emoji}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                          {isOwn && (
                            <div className="mt-1.5 flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                {formatTime(message.createdAt)}
                              </span>
                              <CheckCheck className="h-3 w-3 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start the conversation!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="border-t bg-card/80 backdrop-blur-sm p-4 flex-shrink-0 sticky bottom-0 z-10">
            {replyingTo && (
              <div className="mb-2 p-2 bg-muted/50 rounded-lg border-l-2 border-primary flex items-center justify-between max-w-5xl mx-auto">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground mb-0.5">
                    Replying to {getUserName(replyingTo.user)}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {replyingTo.content}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-2 flex-shrink-0"
                  onClick={() => setReplyingTo(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <div className="flex items-end gap-2 max-w-5xl mx-auto">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 hover:bg-accent"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="flex-1 relative">
                <Input
                  placeholder={replyingTo ? `Reply to ${getUserName(replyingTo.user)}...` : "Type a message..."}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  className="pr-10 h-10 text-sm bg-background border-border"
                />
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-accent"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <Smile className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-3">
                      <div className="text-xs font-medium mb-2 text-muted-foreground">Quick Reactions</div>
                      <div className="grid grid-cols-8 gap-1 mb-3">
                        {['👍', '❤️', '😂', '👎', '🎉', '🔥', '💯', '😮', '😢', '😡', '🤔', '👏', '🙌', '💪', '🎯', '✨'].map((emoji) => (
                          <Button
                            key={emoji}
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-lg hover:bg-accent"
                            onClick={() => {
                              setMessageInput(prev => prev + emoji)
                              setShowEmojiPicker(false)
                            }}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                      <div className="text-xs font-medium mb-2 text-muted-foreground">Common Emojis</div>
                      <div className="grid grid-cols-8 gap-1">
                        {['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩'].map((emoji) => (
                          <Button
                            key={emoji}
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-lg hover:bg-accent"
                            onClick={() => {
                              setMessageInput(prev => prev + emoji)
                              setShowEmojiPicker(false)
                            }}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 hover:bg-accent"
              >
                <Mic className="h-5 w-5" />
              </Button>
              <Button
                onClick={sendMessage}
                disabled={!messageInput.trim() || sendingMessage}
                size="icon"
                className="h-10 w-10 bg-primary hover:bg-primary/90"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center min-w-0 h-full bg-muted/20">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No conversation selected</h3>
            <p className="text-sm text-muted-foreground mb-4">Select a conversation or create a new one to start messaging</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Discussion
            </Button>
          </div>
        </div>
      )}

      {/* Right Sidebar - Group Info */}
      {selectedCollaboration && showGroupInfo && (
        <div className="w-80 min-w-[280px] max-w-[400px] border-l bg-card/50 backdrop-blur-sm flex flex-col h-full min-h-0 overflow-hidden">
          <div className="p-4 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between flex-shrink-0">
            <h3 className="font-semibold text-base text-foreground">Group Info</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-accent"
              onClick={() => setShowGroupInfo(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 overflow-y-auto">
            {/* Files Section */}
            <div className="border-b">
              <button
                onClick={() => setShowFilesSection(!showFilesSection)}
                className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
              >
                <h4 className="font-semibold text-sm text-foreground">
                  Files ({files.length})
                </h4>
                <span className="text-muted-foreground">
                  {showFilesSection ? '−' : '+'}
                </span>
              </button>
              {showFilesSection && (
                <div className="p-4 flex flex-col" style={{ height: '300px' }}>
                  {files.length === 0 ? (
                    <div className="text-center py-8 flex-1 flex items-center justify-center">
                      <div>
                        <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground">No files shared yet</p>
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="flex-1">
                      <div className="space-y-2 pr-2">
                        {files.map((file) => {
                          const fileDate = new Date(file.uploadedAt)
                          const formatFileSize = (bytes: number) => {
                            if (bytes < 1024) return `${bytes} B`
                            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
                            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
                          }
                          const getFileIcon = () => {
                            if (file.fileType.startsWith('image/')) return ImageIcon
                            if (file.fileType.startsWith('video/')) return Video
                            return FileText
                          }
                          const FileIcon = getFileIcon()

                          return (
                            <div
                              key={file.id}
                              className="p-3 border rounded-lg hover:bg-accent/50 transition-colors group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                                    <FileIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-foreground truncate">
                                      {file.fileName}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                      <span>{formatFileSize(file.fileSize)}</span>
                                      <span>•</span>
                                      <span>{fileDate.toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 flex-shrink-0"
                                  onClick={async () => {
                                    try {
                                      // Extract stored fileName from fileUrl (the unique generated name)
                                      let storedFileName = file.fileName
                                      if (file.fileUrl && file.fileUrl.startsWith('/api/collaborations/')) {
                                        // Extract the stored fileName from the URL path
                                        const urlParts = file.fileUrl.split('/')
                                        storedFileName = urlParts[urlParts.length - 1]
                                      }

                                      // Download file using the API endpoint
                                      const response = await fetch(`/api/collaborations/${selectedCollaboration.id}/files/${storedFileName}`)
                                      if (response.ok) {
                                        const blob = await response.blob()
                                        const url = window.URL.createObjectURL(blob)
                                        const a = document.createElement('a')
                                        a.href = url
                                        a.download = file.fileName // Use original fileName for download
                                        document.body.appendChild(a)
                                        a.click()
                                        window.URL.revokeObjectURL(url)
                                        document.body.removeChild(a)
                                      } else {
                                        const errorText = await response.text()
                                        console.error('Failed to download file:', response.status, response.statusText, errorText)
                                        alert('Failed to download file')
                                      }
                                    } catch (error) {
                                      console.error('Error downloading file:', error)
                                      alert('Error downloading file')
                                    }
                                  }}
                                  title="Download file"
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </div>

            {/* Scheduled Meetings Section */}
            <div className="border-b">
              <button
                onClick={() => setShowMeetingsSection(!showMeetingsSection)}
                className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
              >
                <h4 className="font-semibold text-sm text-foreground">Scheduled Meetings</h4>
                <span className="text-muted-foreground">
                  {showMeetingsSection ? '−' : '+'}
                </span>
              </button>
              {showMeetingsSection && (
                <div className="p-4 flex flex-col" style={{ height: '300px' }}>
                  {scheduledCalls.length === 0 ? (
                    <div className="text-center py-8 flex-1 flex items-center justify-center">
                      <div>
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground">No scheduled meetings</p>
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="flex-1">
                      <div className="space-y-2 pr-2">
                        {scheduledCalls.map((call) => {
                          const scheduledDate = call.scheduledAt ? new Date(call.scheduledAt) : null
                          const isUpcoming = scheduledDate && scheduledDate > new Date()

                          return (
                            <div
                              key={call.id}
                              className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-sm text-foreground truncate">
                                    {call.title || 'Untitled Call'}
                                  </h5>
                                  {call.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                      {call.description}
                                    </p>
                                  )}
                                </div>
                                {isUpcoming && (
                                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                                    Upcoming
                                  </Badge>
                                )}
                              </div>
                              {scheduledDate && (
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              )}
                              {call.participants && call.participants.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  <span>{call.participants.length} participants</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </div>

            {/* Members Section */}
            <div className="border-b">
              <button
                onClick={() => setShowMembersSection(!showMembersSection)}
                className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
              >
                <h4 className="font-semibold text-sm text-foreground">
                  {selectedCollaboration.members.length} members
                </h4>
                <span className="text-muted-foreground">
                  {showMembersSection ? '−' : '+'}
                </span>
              </button>
              {showMembersSection && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScheduleCallDialogOpen(true)}
                        className="h-8 text-xs"
                      >
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        Schedule Call
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddPeopleDialogOpen(true)}
                        className="h-8 text-xs"
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                        Add People
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {selectedCollaboration.members.map((member) => {
                      const memberUser = member.user
                      const isAdmin = member.role === 'OWNER' || member.role === 'ADMIN'

                      return (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-2.5 hover:bg-accent rounded-lg transition-colors cursor-pointer"
                        >
                          <Avatar className="h-9 w-9 flex-shrink-0">
                            <AvatarImage src={memberUser.avatar || undefined} />
                            <AvatarFallback className="text-xs font-medium">
                              {getInitials(getUserName(memberUser))}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate text-foreground">
                                {getUserName(memberUser)}
                              </span>
                              {isAdmin && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0 font-medium">
                                  admin
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {memberUser.email}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Summary Section */}
            <div className="border-b">
              <button
                onClick={() => setShowSummarySection(!showSummarySection)}
                className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
              >
                <h4 className="font-semibold text-sm text-foreground">Summary</h4>
                <span className="text-muted-foreground">
                  {showSummarySection ? '−' : '+'}
                </span>
              </button>
              {showSummarySection && (
                <div className="p-4 space-y-4">
                  {/* AI Summary Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">AI Summary</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateSummary}
                        disabled={isGeneratingSummary}
                        className="h-7 text-xs"
                      >
                        {isGeneratingSummary ? (
                          <>
                            <Clock className="h-3 w-3 mr-1.5 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-3 w-3 mr-1.5" />
                            Generate Summary
                          </>
                        )}
                      </Button>
                    </div>
                    {aiSummary ? (
                      <div className="p-3 bg-muted rounded-lg text-sm text-foreground whitespace-pre-wrap">
                        {aiSummary}
                      </div>
                    ) : (
                      <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground text-center">
                        Click "Generate Summary" to create an AI summary from discussions and calls
                      </div>
                    )}
                  </div>

                  {/* Notes Section */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Notes</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onBlur={handleSaveNotes}
                      placeholder="Add your notes here..."
                      className="min-h-[120px] text-sm resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Notes are saved automatically
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Create Collaboration Dialog */}
      <CollaborationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={(collaboration) => {
          fetchCollaborations()
          if (collaboration) {
            selectCollaboration(collaboration)
          }
        }}
      />

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Collaboration Settings</DialogTitle>
            <DialogDescription>
              Manage settings for {selectedCollaboration?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedCollaboration && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={selectedCollaboration.name}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={selectedCollaboration.description || ''}
                  readOnly
                  className="bg-muted min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={selectedCollaboration.type} disabled>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="PROJECT">Project</SelectItem>
                    <SelectItem value="TASK">Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications for new messages
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add People Dialog */}
      <AddPeopleDialog
        open={addPeopleDialogOpen}
        onOpenChange={setAddPeopleDialogOpen}
        collaboration={selectedCollaboration}
        onMemberAdded={async () => {
          await fetchCollaborations()
          if (selectedCollaboration) {
            const updated = collaborations.find(c => c.id === selectedCollaboration.id)
            if (updated) {
              setSelectedCollaboration(updated)
            }
          }
        }}
      />

      {/* Schedule Call Dialog */}
      <ScheduleCallDialog
        open={scheduleCallDialogOpen}
        onOpenChange={setScheduleCallDialogOpen}
        collaboration={selectedCollaboration}
        onCallScheduled={fetchScheduledCalls}
      />

      {/* Create Task from Message Dialog */}
      {selectedMessageForTask && selectedCollaboration && (
        <CreateTaskFromMessageDialog
          open={taskDialogOpen}
          onClose={() => {
            setTaskDialogOpen(false)
            setSelectedMessageForTask(null)
          }}
          messageContent={selectedMessageForTask.content}
          messageId={selectedMessageForTask.id}
          collaborationId={selectedCollaboration.id}
          onSuccess={() => {
            // Optionally refresh messages or show success notification
            console.log('Task created successfully from message')
          }}
        />
      )}
    </div>
  )
}

export default function CollaboratePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading collaboration...</div>
      </div>
    }>
      <CollaborateInner />
    </Suspense>
  )
}

// Add People Dialog Component
interface AddPeopleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collaboration: Collaboration | null
  onMemberAdded: () => void
}

function AddPeopleDialog({ open, onOpenChange, collaboration, onMemberAdded }: AddPeopleDialogProps) {
  const [users, setUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [adding, setAdding] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchUsers()
    } else {
      setSearchQuery('')
    }
  }, [open])

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

  const handleAddMember = async (userId: string) => {
    if (!collaboration) return

    setAdding(userId)
    try {
      const response = await fetch(`/api/collaborations/${collaboration.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: 'MEMBER' }),
      })

      if (response.ok) {
        onMemberAdded()
        setSearchQuery('')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add member')
      }
    } catch (error) {
      console.error('Error adding member:', error)
      alert('Failed to add member')
    } finally {
      setAdding(null)
    }
  }

  const existingMemberIds = collaboration?.members.map(m => m.user.id) || []
  const availableUsers = users.filter(u => !existingMemberIds.includes(u.id))
  const filteredUsers = availableUsers.filter(u => {
    const name = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const getUserName = (user: any) => {
    if (user.name) return user.name
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim()
    }
    return user.email
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add People</DialogTitle>
          <DialogDescription>
            Add members to {collaboration?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-1">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {searchQuery ? 'No users found' : 'No available users'}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleAddMember(user.id)}
                    disabled={adding === user.id}
                    className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors text-left disabled:opacity-50"
                  >
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(getUserName(user))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">
                        {getUserName(user)}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </div>
                    </div>
                    {adding === user.id ? (
                      <div className="text-xs text-muted-foreground">Adding...</div>
                    ) : (
                      <UserPlus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Schedule Call Dialog Component
interface ScheduleCallDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collaboration: Collaboration | null
  onCallScheduled?: () => void
}

function ScheduleCallDialog({ open, onOpenChange, collaboration, onCallScheduled }: ScheduleCallDialogProps) {
  const user = useAuthStore((state) => state.user)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('30')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && collaboration) {
      setTitle(`Call: ${collaboration.name}`)
      setDescription('')
      setDate('')
      setTime('')
      setDuration('30')
    }
  }, [open, collaboration])

  const handleSchedule = async () => {
    if (!collaboration || !title.trim() || !date || !time) {
      alert('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      // Create scheduled date/time
      const dateTime = new Date(`${date}T${time}`)

      // Get participant IDs from ALL collaboration members
      // The API will automatically add the creator as HOST and filter them out from participantIds
      // So we include all members here to ensure everyone sees the scheduled call
      const participantIds = collaboration.members.map(m => m.user.id)

      // Create the call via API
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SCHEDULED',
          title: title.trim(),
          description: description.trim() || undefined,
          scheduledAt: dateTime.toISOString(),
          participantIds: participantIds,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[ScheduleCallDialog] Call created successfully:', result)
        alert(`Call "${title}" scheduled successfully for ${dateTime.toLocaleDateString()} at ${dateTime.toLocaleTimeString()}`)
        onOpenChange(false)
        // Reset form
        setTitle('')
        setDescription('')
        setDate('')
        setTime('')
        setDuration('30')
        // Immediately refresh scheduled calls
        onCallScheduled?.()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to schedule call')
      }
    } catch (error) {
      console.error('Error scheduling call:', error)
      alert('Failed to schedule call. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Call</DialogTitle>
          <DialogDescription>
            Schedule a call for {collaboration?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="call-title">Title *</Label>
            <Input
              id="call-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Call title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="call-description">Description</Label>
            <Textarea
              id="call-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Call agenda or notes"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="call-date">Date *</Label>
              <div className="relative">
                <Input
                  id="call-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={today}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                  onClick={() => {
                    const dateInput = document.getElementById('call-date') as HTMLInputElement
                    if (dateInput?.showPicker) {
                      dateInput.showPicker()
                    } else {
                      dateInput?.click()
                    }
                  }}
                  title="Open calendar"
                >
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="call-time">Time *</Label>
              <div className="relative">
                <Input
                  id="call-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                  onClick={() => {
                    const timeInput = document.getElementById('call-time') as HTMLInputElement
                    if (timeInput?.showPicker) {
                      timeInput.showPicker()
                    } else {
                      timeInput?.click()
                    }
                  }}
                  title="Open time picker"
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="call-duration">Duration (minutes)</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="call-duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={saving || !title.trim() || !date || !time}>
            {saving ? 'Scheduling...' : 'Schedule Call'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Video Call Button Component (using same logic as StartCallButton but with Video icon)
function VideoCallButton({
  participantIds,
  title,
  variant = 'default',
  size = 'default',
  className,
}: {
  participantIds?: string[]
  title?: string
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}) {
  const [callOpen, setCallOpen] = useState(false)
  const [callId, setCallId] = useState<string | null>(null)
  const { startCall } = useCall()
  const { toast } = useToast()

  const handleStartCall = async () => {
    try {
      const id = await startCall(participantIds, title)
      setCallId(id)
      setCallOpen(true)
    } catch (error: any) {
      toast({
        title: 'Failed to start video call',
        description: error.message || 'Please check your camera and microphone permissions.',
        variant: 'destructive',
      })
    }
  }

  const handleClose = () => {
    setCallOpen(false)
    setCallId(null)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleStartCall}
        className={className}
        title={size === 'icon' ? 'Start Video Call' : undefined}
      >
        {size === 'icon' ? (
          <Video className="h-4 w-4" />
        ) : (
          <>
            <Video className="h-4 w-4 mr-2" />
            Start Video Call
          </>
        )}
      </Button>

      <CallInterface
        callId={callId}
        open={callOpen}
        onClose={handleClose}
      />
    </>
  )
}
