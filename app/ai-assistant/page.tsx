'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Send, Loader2, Sparkles, Plus, MessageSquare, Trash2, Edit2, Check, X, MoreVertical, LayoutDashboard, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { SaveDefaultLayoutButton } from '@/components/ui/save-default-layout-button'
import { useDefaultLayout } from '@/hooks/useDefaultLayout'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface Widget {
  id: string
  type: string
  visible: boolean
}

const defaultWidgets: Widget[] = [
  { id: 'chatHistory', type: 'chatHistory', visible: true },
  { id: 'conversation', type: 'conversation', visible: true },
  { id: 'capabilities', type: 'capabilities', visible: true },
]

const defaultLayouts: Layouts = {
  lg: [
    { i: 'chatHistory', x: 0, y: 0, w: 3, h: 8, minW: 2, minH: 6 },
    { i: 'conversation', x: 3, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'capabilities', x: 9, y: 0, w: 3, h: 8, minW: 2, minH: 4 },
  ],
  md: [
    { i: 'chatHistory', x: 0, y: 0, w: 3, h: 8, minW: 2, minH: 6 },
    { i: 'conversation', x: 3, y: 0, w: 5, h: 8, minW: 3, minH: 6 },
    { i: 'capabilities', x: 8, y: 0, w: 2, h: 8, minW: 2, minH: 4 },
  ],
  sm: [
    { i: 'chatHistory', x: 0, y: 0, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'conversation', x: 0, y: 6, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'capabilities', x: 0, y: 14, w: 6, h: 4, minW: 4, minH: 3 },
  ],
  xs: [
    { i: 'chatHistory', x: 0, y: 0, w: 4, h: 6, minW: 2, minH: 4 },
    { i: 'conversation', x: 0, y: 6, w: 4, h: 8, minW: 2, minH: 6 },
    { i: 'capabilities', x: 0, y: 14, w: 4, h: 4, minW: 2, minH: 3 },
  ],
  xxs: [
    { i: 'chatHistory', x: 0, y: 0, w: 2, h: 6, minW: 2, minH: 4 },
    { i: 'conversation', x: 0, y: 6, w: 2, h: 8, minW: 2, minH: 6 },
    { i: 'capabilities', x: 0, y: 14, w: 2, h: 4, minW: 2, minH: 3 },
  ],
}

export default function AIAssistantPage() {
  const router = useRouter()
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Layout state
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets)
  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts)
  const [defaultReferenceLayouts, setDefaultReferenceLayouts] = useState<Layouts>(defaultLayouts)
  const { loadDefaultLayout } = useDefaultLayout()
  const [isMobile, setIsMobile] = useState(false)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load default layouts
  useEffect(() => {
    const loadLayouts = async () => {
      const savedWidgets = localStorage.getItem('ai-assistant-widgets')
      const savedLayouts = localStorage.getItem('ai-assistant-layouts')

      const defaultLayoutData = await loadDefaultLayout('ai-assistant')

      if (defaultLayoutData) {
        if (defaultLayoutData.layouts) {
          setDefaultReferenceLayouts(defaultLayoutData.layouts)
        }

        if (savedWidgets && savedLayouts) {
          setWidgets(JSON.parse(savedWidgets))
          setLayouts(JSON.parse(savedLayouts))
        } else {
          if (defaultLayoutData.widgets) {
            setWidgets(defaultLayoutData.widgets)
          }
          if (defaultLayoutData.layouts) {
            setLayouts(defaultLayoutData.layouts)
          }
        }
      } else {
        setDefaultReferenceLayouts(defaultLayouts)

        if (savedWidgets && savedLayouts) {
          setWidgets(JSON.parse(savedWidgets))
          setLayouts(JSON.parse(savedLayouts))
        }
      }
    }

    loadLayouts()
  }, [])

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts)
    localStorage.setItem('ai-assistant-layouts', JSON.stringify(allLayouts))
  }

  const toggleWidget = (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId)
    const isBeingEnabled = widget && !widget.visible

    const updatedWidgets = widgets.map(w =>
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    )
    setWidgets(updatedWidgets)
    localStorage.setItem('ai-assistant-widgets', JSON.stringify(updatedWidgets))

    if (isBeingEnabled) {
      const updatedLayouts = { ...layouts }

      Object.keys(defaultReferenceLayouts).forEach(breakpoint => {
        const defaultLayout = defaultReferenceLayouts[breakpoint as keyof Layouts]
        const currentLayout = updatedLayouts[breakpoint as keyof Layouts]

        if (defaultLayout && currentLayout) {
          const defaultWidgetLayout = defaultLayout.find((l: Layout) => l.i === widgetId)
          const currentLayoutIndex = currentLayout.findIndex((l: Layout) => l.i === widgetId)

          if (defaultWidgetLayout && currentLayoutIndex !== -1) {
            currentLayout[currentLayoutIndex] = {
              ...currentLayout[currentLayoutIndex],
              w: defaultWidgetLayout.w,
              h: defaultWidgetLayout.h,
              minW: defaultWidgetLayout.minW,
              minH: defaultWidgetLayout.minH,
            }
          }
        }
      })

      setLayouts(updatedLayouts)
      localStorage.setItem('ai-assistant-layouts', JSON.stringify(updatedLayouts))
    }
  }

  const resetLayout = async () => {
    localStorage.removeItem('ai-assistant-widgets')
    localStorage.removeItem('ai-assistant-layouts')

    const defaultLayoutData = await loadDefaultLayout('ai-assistant')
    if (defaultLayoutData) {
      if (defaultLayoutData.widgets) {
        setWidgets(defaultLayoutData.widgets)
      } else {
        setWidgets(defaultWidgets)
      }
      if (defaultLayoutData.layouts) {
        setLayouts(defaultLayoutData.layouts)
        setDefaultReferenceLayouts(defaultLayoutData.layouts)
      } else {
        setLayouts(defaultLayouts)
        setDefaultReferenceLayouts(defaultLayouts)
      }
    } else {
      setWidgets(defaultWidgets)
      setLayouts(defaultLayouts)
      setDefaultReferenceLayouts(defaultLayouts)
    }
  }

  // Load chats from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ai-chat-sessions')
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{
          id: string
          title: string
          messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>
          createdAt: string
          updatedAt: string
        }>
        const restored: Chat[] = parsed.map(chat => ({
          ...chat,
          messages: chat.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })),
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
        }))
        setChats(restored)

        if (restored.length > 0) {
          const mostRecent = restored[0]
          setCurrentChatId(mostRecent.id)
          setMessages(mostRecent.messages)
        }
      }
    } catch (err) {
      console.error('Failed to load chat sessions:', err)
    }
  }, [])

  // Save chats to localStorage
  useEffect(() => {
    if (chats.length > 0) {
      try {
        const serializable = chats.map(chat => ({
          ...chat,
          messages: chat.messages.map(m => ({ ...m, timestamp: m.timestamp.toISOString() })),
          createdAt: chat.createdAt.toISOString(),
          updatedAt: chat.updatedAt.toISOString(),
        }))
        localStorage.setItem('ai-chat-sessions', JSON.stringify(serializable))
      } catch (err) {
        console.error('Failed to save chat sessions:', err)
      }
    }
  }, [chats])

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateChatTitle = (firstUserMessage: string): string => {
    const truncated = firstUserMessage.slice(0, 50)
    return truncated.length < firstUserMessage.length ? truncated + '...' : truncated
  }

  const handleNewChat = () => {
    const newChatId = `chat-${Date.now()}`
    const newChat: Chat = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    if (currentChatId && messages.length > 0) {
      updateCurrentChat()
    }

    setChats(prev => [newChat, ...prev])
    setCurrentChatId(newChatId)
    setMessages([])
  }

  const handleSelectChat = (chatId: string) => {
    if (currentChatId && messages.length > 0) {
      updateCurrentChat()
    }

    const chat = chats.find(c => c.id === chatId)
    if (chat) {
      setCurrentChatId(chatId)
      setMessages(chat.messages)
    }
  }

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!confirm('Are you sure you want to delete this chat?')) {
      return
    }

    const updatedChats = chats.filter(c => c.id !== chatId)
    setChats(updatedChats)

    if (updatedChats.length === 0) {
      localStorage.removeItem('ai-chat-sessions')
    }

    if (currentChatId === chatId) {
      if (updatedChats.length > 0) {
        setCurrentChatId(updatedChats[0].id)
        setMessages(updatedChats[0].messages)
      } else {
        setCurrentChatId(null)
        setMessages([])
      }
    }
  }

  const handleStartEdit = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingChatId(chat.id)
    setEditingTitle(chat.title)
  }

  const handleSaveEdit = (chatId: string) => {
    if (editingTitle.trim()) {
      setChats(prev =>
        prev.map(c => (c.id === chatId ? { ...c, title: editingTitle.trim() } : c))
      )
    }
    setEditingChatId(null)
    setEditingTitle('')
  }

  const handleCancelEdit = () => {
    setEditingChatId(null)
    setEditingTitle('')
  }

  const updateCurrentChat = () => {
    if (!currentChatId) {
      return
    }

    setChats(prev =>
      prev.map(c =>
        c.id === currentChatId
          ? { ...c, messages, updatedAt: new Date() }
          : c
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    if (currentChatId) {
      const currentChat = chats.find(c => c.id === currentChatId)
      if (currentChat && currentChat.title === 'New Chat' && currentChat.messages.length === 0) {
        const newTitle = generateChatTitle(userMessage.content)
        setChats(prev =>
          prev.map(c => (c.id === currentChatId ? { ...c, title: newTitle } : c))
        )
      }
    } else {
      handleNewChat()
    }

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error('Error:', error)
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Widget renderers
  const renderChatHistory = () => (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b flex-shrink-0 pb-4">
        <Button
          onClick={handleNewChat}
          className="w-full"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </CardHeader>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => editingChatId !== chat.id && handleSelectChat(chat.id)}
              className={cn(
                "group flex items-center justify-between gap-2 p-3 rounded-lg transition-colors",
                editingChatId !== chat.id && "cursor-pointer hover:bg-accent",
                currentChatId === chat.id && "bg-accent"
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                {editingChatId === chat.id ? (
                  <div className="flex-1 flex items-center gap-1">
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(chat.id)
                        else if (e.key === 'Escape') handleCancelEdit()
                      }}
                      className="h-7 text-sm"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSaveEdit(chat.id)
                      }}
                    >
                      <Check className="h-3 w-3 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCancelEdit()
                      }}
                    >
                      <X className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{chat.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {chat.updatedAt.toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              {editingChatId !== chat.id && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => handleStartEdit(chat, e)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )

  const renderConversation = () => (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-600" />
          AI Chat
        </CardTitle>
      </CardHeader>
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Sparkles className="h-12 w-12 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
            <p className="text-sm text-muted-foreground">
              Ask me anything about your projects, tasks, or need help with planning.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-purple-600" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 max-w-[80%]",
                    message.role === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-primary-foreground text-sm font-semibold">U</span>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  )

  const renderCapabilities = () => (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b flex-shrink-0">
        <CardTitle className="text-base">AI Capabilities</CardTitle>
      </CardHeader>
      <ScrollArea className="flex-1">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              What I Can Do
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1 pl-6">
              <li>• Answer questions about your projects</li>
              <li>• Help with task management</li>
              <li>• Provide project insights</li>
              <li>• Suggest best practices</li>
              <li>• Generate reports and summaries</li>
            </ul>
          </div>
          <div className="pt-3 border-t space-y-2">
            <h4 className="text-sm font-semibold">Quick Tips</h4>
            <ul className="text-xs text-muted-foreground space-y-1 pl-6">
              <li>• Be specific in your questions</li>
              <li>• Ask for clarification if needed</li>
              <li>• Provide context for better answers</li>
              <li>• Use follow-up questions</li>
            </ul>
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  )

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'chatHistory':
        return renderChatHistory()
      case 'conversation':
        return renderConversation()
      case 'capabilities':
        return renderCapabilities()
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Assistant
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your intelligent project management companion
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/ai-tools')}
              className="flex items-center gap-2"
            >
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">AI Tools</span>
            </Button>

            <SaveDefaultLayoutButton
              pageKey="ai-assistant"
              getCurrentLayout={() => ({ widgets, layouts })}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-semibold">Panel Visibility</div>
              <DropdownMenuSeparator />
              {widgets.map((widget) => (
                <DropdownMenuCheckboxItem
                  key={widget.id}
                  checked={widget.visible}
                  onCheckedChange={() => toggleWidget(widget.id)}
                >
                  {widget.type === 'chatHistory' && 'Chat History'}
                  {widget.type === 'conversation' && 'Conversation'}
                  {widget.type === 'capabilities' && 'Capabilities'}
                </DropdownMenuCheckboxItem>
              ))}
              {!isMobile && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={resetLayout}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Reset Layout
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Layout */}
      {isMobile ? (
        <div className="space-y-4">
          {widgets.map((widget) =>
            widget.visible ? (
              <div key={widget.id} className="w-full h-[500px]">
                {renderWidget(widget)}
              </div>
            ) : null
          )}
        </div>
      ) : (
        <div className="ai-assistant-grid">
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".drag-handle"
          >
            {widgets
              .filter((widget) => widget.visible)
              .map((widget) => (
                <div key={widget.id} className="grid-item">
                  <div className="drag-handle absolute top-2 left-2 right-2 h-6 cursor-move opacity-0 hover:opacity-100 transition-opacity z-10 bg-background/80 backdrop-blur-sm rounded flex items-center justify-center">
                    <div className="w-8 h-1 bg-muted-foreground/50 rounded-full" />
                  </div>
                  {renderWidget(widget)}
                </div>
              ))}
          </ResponsiveGridLayout>
        </div>
      )}
    </div>
  )
}
