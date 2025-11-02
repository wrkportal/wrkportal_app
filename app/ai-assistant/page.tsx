'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Loader2, Sparkles, Plus, MessageSquare, Trash2, Edit2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

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

export default function AIAssistantPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [showCapabilities, setShowCapabilities] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
        
        // Load the most recent chat
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

  // Save chats to localStorage whenever they change
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateChatTitle = (firstUserMessage: string): string => {
    // Take first 50 characters or first sentence
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
    
    // Save current chat before creating new one
    if (currentChatId && messages.length > 0) {
      updateCurrentChat()
    }
    
    setChats(prev => [newChat, ...prev])
    setCurrentChatId(newChatId)
    setMessages([])
  }

  const handleSelectChat = (chatId: string) => {
    // Save current chat before switching
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
    const updatedChats = chats.filter(c => c.id !== chatId)
    setChats(updatedChats)
    
    // Update localStorage
    if (updatedChats.length === 0) {
      localStorage.removeItem('ai-chat-sessions')
    }
    
    if (currentChatId === chatId) {
      if (updatedChats.length > 0) {
        setCurrentChatId(updatedChats[0].id)
        setMessages(updatedChats[0].messages)
      } else {
        // Create a new chat if all chats are deleted
        handleNewChat()
      }
    }
  }

  const handleStartEdit = (chatId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingChatId(chatId)
    setEditingTitle(currentTitle)
  }

  const handleSaveEdit = (chatId: string) => {
    if (editingTitle.trim()) {
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: editingTitle.trim() } : chat
      ))
    }
    setEditingChatId(null)
    setEditingTitle('')
  }

  const handleCancelEdit = () => {
    setEditingChatId(null)
    setEditingTitle('')
  }

  const updateCurrentChat = () => {
    if (!currentChatId) return
    
    setChats(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        return {
          ...chat,
          messages,
          updatedAt: new Date(),
        }
      }
      return chat
    }))
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    // Update chat title if this is the first user message
    if (currentChatId && messages.length === 0) {
      const title = generateChatTitle(input)
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId ? { ...chat, title } : chat
      ))
    }

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message || 'Sorry, I encountered an error.',
        timestamp: new Date(),
      }

      const updatedMessages = [...newMessages, assistantMessage]
      setMessages(updatedMessages)
      
      // Update the chat in the list
      if (currentChatId) {
        setChats(prev => prev.map(chat => 
          chat.id === currentChatId 
            ? { ...chat, messages: updatedMessages, updatedAt: new Date() }
            : chat
        ))
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [
        ...prev,
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

  return (
    <div className="flex gap-4">
      {/* Sidebar - Chat History */}
      <Card className="w-64 flex flex-col overflow-hidden h-[calc(100vh-8rem)]">
        <div className="p-4 border-b">
          <Button 
            onClick={handleNewChat} 
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
        
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
                          if (e.key === 'Enter') {
                            handleSaveEdit(chat.id)
                          } else if (e.key === 'Escape') {
                            handleCancelEdit()
                          }
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
                      className="h-6 w-6"
                      onClick={(e) => handleStartEdit(chat.id, chat.title, e)}
                    >
                      <Edit2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
            {chats.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No chat history yet.
                <br />
                Start a new chat!
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-[calc(100vh-8rem)]">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary rounded-lg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">AI Assistant</h1>
              <p className="text-muted-foreground">Your intelligent project management companion</p>
            </div>
          </div>
          <div className="ml-14">
            <span 
              className="text-blue-600 hover:underline cursor-pointer font-medium text-sm"
              onClick={() => setShowCapabilities(!showCapabilities)}
            >
              Want to know what I can help you with?
            </span>
            
            {/* Capabilities Popup - shows below the link */}
            {showCapabilities && (
              <Card className="mt-3 p-4 bg-muted/50 border-primary/20">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    I can help you with:
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 -mt-1 -mr-1"
                    onClick={() => setShowCapabilities(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Managing projects and tasks</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Analyzing budgets and timelines</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Identifying risks and issues</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Finding team members</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Creating reports</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Tracking progress</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Answering project questions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>And much more!</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground italic">
                    💡 Try: "Show me all my overdue tasks" or "What's the budget status of Project X?"
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-2xl rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-xs mt-1 ${message.role === 'user' ? 'opacity-70' : 'text-muted-foreground'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-sm font-semibold">You</span>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask me anything about your projects..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                variant="outline"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

