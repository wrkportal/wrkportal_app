/**
 * Help Dialog Component
 * Provides contextual help and documentation
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HelpCircle, Search, Book, Video, MessageCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface HelpArticle {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
}

interface HelpDialogProps {
  page?: string
  section?: string
}

const helpArticles: HelpArticle[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    content: `
# Getting Started

Welcome to wrkportal! This guide will help you get started with the platform.

## Key Features

1. **Projects**: Create and manage your projects
2. **Tasks**: Organize and track your work
3. **Teams**: Collaborate with your team members
4. **Dashboards**: View insights and analytics
5. **AI Assistant**: Get help with AI-powered features

## Quick Start

1. Explore the sidebar to navigate different sections
2. Create your first project
3. Add tasks and assign them to team members
4. Use the AI Assistant for help and insights
    `,
    category: 'Getting Started',
    tags: ['basics', 'tutorial'],
  },
]

export function HelpDialog({ page, section }: HelpDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredArticles = helpArticles.filter((article) => {
    const matchesSearch =
      searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(helpArticles.map((a) => a.category)))

  return (
    <TooltipProvider>
      <Tooltip>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open help dialog">
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Help</p>
          </TooltipContent>
          <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Help & Documentation</DialogTitle>
          <DialogDescription>
            Find answers to common questions and learn how to use wrkportal
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="articles" className="w-full">
          <TabsList>
            <TabsTrigger value="articles">
              <Book className="h-4 w-4 mr-2" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="h-4 w-4 mr-2" />
              Search
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {filteredArticles.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">No articles found</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredArticles.map((article) => (
                    <Card key={article.id} className="overflow-hidden">
                      <CardHeader>
                        <CardTitle className="text-lg">{article.title}</CardTitle>
                        <CardDescription>
                          {article.category} • {article.tags.join(', ')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="overflow-hidden">
                        <div className="prose prose-sm max-w-none overflow-hidden">
                          <div className="whitespace-pre-wrap text-sm break-words overflow-wrap-anywhere max-w-full word-break-break-word">{article.content}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filteredArticles.map((article) => (
                  <Card
                    key={article.id}
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => {
                      setSelectedCategory('all')
                      // Scroll to article
                    }}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{article.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {article.category}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
          </DialogContent>
        </Dialog>
      </Tooltip>
    </TooltipProvider>
  )
}

