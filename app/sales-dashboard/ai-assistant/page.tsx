'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Loader2, Sparkles, Plus, MessageSquare, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'

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

export default function SalesAIAssistantPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setChats([newChat, ...chats])
    setCurrentChatId(newChat.id)
    setMessages([])
  }

  const handleDeleteChat = (chatId: string) => {
    setChats(chats.filter(c => c.id !== chatId))
    if (currentChatId === chatId) {
      setCurrentChatId(null)
      setMessages([])
    }
  }

  const generateChatTitle = (firstMessage: string): string => {
    // Generate a title from the first message
    const words = firstMessage.split(' ').slice(0, 5)
    return words.join(' ') + (firstMessage.split(' ').length > 5 ? '...' : '')
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
      const response = await fetch('/api/ai/sales/chat', {
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

  const exampleQuestions = [
    "What's my pipeline value?",
    "Show me my top 5 opportunities",
    "What deals are at risk?",
    "What are my next best actions?",
    "Score my Acme Corp opportunity",
    "Show me leads that need follow-up",
  ]

  return (
    <SalesPageLayout
      title="Sales AI Assistant"
      description="Get instant insights about your pipeline, deals, and performance"
    >
      <div className="flex h-[calc(100vh-200px)] gap-4">
        {/* Chat History Sidebar */}
        <div className="w-64 border-r">
          <div className="p-4 border-b">
            <Button onClick={handleNewChat} className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-2 space-y-1">
              {chats.map(chat => (
                <div
                  key={chat.id}
                  className={cn(
                    'group flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted',
                    currentChatId === chat.id && 'bg-muted'
                  )}
                  onClick={() => {
                    setCurrentChatId(chat.id)
                    setMessages(chat.messages)
                  }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">{chat.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteChat(chat.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4 max-w-2xl">
                <div className="flex justify-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Bot className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Sales AI Assistant</h2>
                  <p className="text-muted-foreground mb-6">
                    Ask me anything about your pipeline, deals, leads, or performance
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {exampleQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start text-left h-auto py-3"
                      onClick={() => setInput(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="rounded-full bg-primary/10 p-2 h-8 w-8 flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <Card
                      className={cn(
                        'max-w-[80%]',
                        message.role === 'user' ? 'bg-primary text-primary-foreground' : ''
                      )}
                    >
                      <CardContent className="p-3">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </CardContent>
                    </Card>
                    {message.role === 'user' && (
                      <div className="rounded-full bg-muted p-2 h-8 w-8 flex-shrink-0">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="rounded-full bg-primary/10 p-2 h-8 w-8 flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <Card>
                      <CardContent className="p-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </CardContent>
                    </Card>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}

          {/* Input Area */}
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your pipeline, deals, or leads..."
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
        </div>
      </div>
    </SalesPageLayout>
  )
}

