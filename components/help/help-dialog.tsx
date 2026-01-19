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
    title: 'Getting Started with Reporting Studio',
    content: `
# Getting Started with Reporting Studio

Reporting Studio is a powerful platform for creating, managing, and sharing reports and dashboards.

## Key Features

1. **Data Sources**: Connect to various data sources including databases, APIs, and files
2. **Datasets**: Create and manage datasets from your data sources
3. **Visualizations**: Build charts and graphs to visualize your data
4. **Dashboards**: Combine multiple visualizations into interactive dashboards
5. **Schedules**: Automate report delivery via email, Slack, and more
6. **Transformations**: Transform and clean your data before visualization

## Quick Start

1. Start by connecting a data source
2. Create a dataset from your data source
3. Build visualizations from your dataset
4. Combine visualizations into a dashboard
5. Schedule automated delivery if needed
    `,
    category: 'Getting Started',
    tags: ['basics', 'tutorial'],
  },
  {
    id: 'data-sources',
    title: 'Working with Data Sources',
    content: `
# Working with Data Sources

Data sources are the foundation of your reports. You can connect to:

- **Databases**: PostgreSQL, MySQL, SQL Server, MongoDB
- **APIs**: REST APIs, GraphQL endpoints
- **Files**: CSV, Excel, JSON files
- **Cloud Storage**: Google Drive, Dropbox, S3

## Connecting a Data Source

1. Navigate to Data Sources
2. Click "Add Data Source"
3. Select your data source type
4. Enter connection details
5. Test the connection
6. Save and use in your datasets
    `,
    category: 'Data Sources',
    tags: ['data', 'connection'],
  },
  {
    id: 'schedules',
    title: 'Scheduling Reports',
    content: `
# Scheduling Reports

Automate the delivery of your reports and dashboards.

## Creating a Schedule

1. Navigate to Schedules
2. Click "New Schedule"
3. Select the report or dashboard to schedule
4. Choose frequency (Daily, Weekly, Monthly, etc.)
5. Configure export format (PDF, Excel, etc.)
6. Add delivery channels (Email, Slack, Teams, etc.)
7. Add recipients
8. Save the schedule

## Delivery Channels

- **Email**: Send reports via email
- **Slack**: Post to Slack channels
- **Teams**: Send to Microsoft Teams
- **Webhook**: Trigger webhooks with report data
- **Cloud Storage**: Upload to Google Drive, Dropbox, S3, OneDrive
    `,
    category: 'Schedules',
    tags: ['automation', 'delivery'],
  },
  {
    id: 'transformations',
    title: 'Data Transformations',
    content: `
# Data Transformations

Transform and clean your data before visualization.

## Transformation Steps

1. **Filter**: Filter rows based on conditions
2. **Map**: Transform column values
3. **Aggregate**: Group and aggregate data
4. **Join**: Merge multiple datasets
5. **Sort**: Sort data by columns
6. **Pivot**: Pivot data for analysis

## Creating a Transformation

1. Navigate to Transformations
2. Click "New Transformation"
3. Select input dataset
4. Add transformation steps
5. Preview the results
6. Save the transformation
    `,
    category: 'Transformations',
    tags: ['data', 'processing'],
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
            Find answers to common questions and learn how to use Reporting Studio
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
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
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
                    <Card key={article.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{article.title}</CardTitle>
                        <CardDescription>
                          {article.category} • {article.tags.join(', ')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap text-sm">{article.content}</pre>
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

