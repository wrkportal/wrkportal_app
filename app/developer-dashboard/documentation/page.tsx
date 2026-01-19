'use client'

import { useState, useEffect } from 'react'
import { DeveloperPageLayout } from '@/components/developer/developer-page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  FileText,
  Book,
  Code,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download,
  ExternalLink,
  BookOpen,
  FileCode,
  Settings
} from 'lucide-react'

interface Documentation {
  id: string
  title: string
  description: string
  category: 'api' | 'guide' | 'reference' | 'tutorial' | 'architecture'
  author: string
  updatedAt: string
  views: number
  tags: string[]
  url?: string
}

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [docs, setDocs] = useState<Documentation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocs()
  }, [activeTab])

  const fetchDocs = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API calls
      // Example: const response = await fetch('/api/developer/documentation')
      // const data = await response.json()
      // setDocs(data.docs || [])
      
      setDocs([])
    } catch (error) {
      console.error('Error fetching documentation:', error)
      setDocs([])
    } finally {
      setLoading(false)
    }
  }

  const docStats = {
    total: docs.length,
    api: docs.filter(d => d.category === 'api').length,
    guides: docs.filter(d => d.category === 'guide').length,
    architecture: docs.filter(d => d.category === 'architecture').length,
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'api':
        return <Code className="h-4 w-4" />
      case 'guide':
        return <BookOpen className="h-4 w-4" />
      case 'reference':
        return <FileCode className="h-4 w-4" />
      case 'tutorial':
        return <Book className="h-4 w-4" />
      case 'architecture':
        return <Settings className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'api':
        return 'default'
      case 'guide':
        return 'secondary'
      case 'reference':
        return 'outline'
      case 'tutorial':
        return 'default'
      case 'architecture':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const filteredDocs = docs.filter(doc => {
    if (activeTab !== 'all' && doc.category !== activeTab) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        doc.title.toLowerCase().includes(query) ||
        doc.description.toLowerCase().includes(query) ||
        doc.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    return true
  })

  return (
    <DeveloperPageLayout 
      title="Documentation" 
      description="Access developer guides, API documentation, and technical resources"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Docs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{docStats.total}</div>
              <p className="text-xs text-muted-foreground">Documentation pages</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Docs</CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{docStats.api}</div>
              <p className="text-xs text-muted-foreground">API references</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Guides</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{docStats.guides}</div>
              <p className="text-xs text-muted-foreground">How-to guides</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Architecture</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{docStats.architecture}</div>
              <p className="text-xs text-muted-foreground">Architecture docs</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
              <TabsTrigger value="guide">Guides</TabsTrigger>
              <TabsTrigger value="reference">Reference</TabsTrigger>
              <TabsTrigger value="tutorial">Tutorials</TabsTrigger>
              <TabsTrigger value="architecture">Architecture</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Doc
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Documentation</DialogTitle>
                    <DialogDescription>
                      Add new documentation page
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input placeholder="Documentation title" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea placeholder="Brief description" />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="api">API</SelectItem>
                          <SelectItem value="guide">Guide</SelectItem>
                          <SelectItem value="reference">Reference</SelectItem>
                          <SelectItem value="tutorial">Tutorial</SelectItem>
                          <SelectItem value="architecture">Architecture</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <TabsContent value={activeTab} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>
                  Browse and manage developer documentation, API references, and guides
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocs.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{doc.title}</span>
                            <span className="text-xs text-muted-foreground line-clamp-1">{doc.description}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getCategoryBadgeVariant(doc.category)} className="flex items-center gap-1 w-fit">
                            {getCategoryIcon(doc.category)}
                            <span>{doc.category}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>{doc.author}</TableCell>
                        <TableCell>{doc.views}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {doc.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {doc.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{doc.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(doc.updatedAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              {doc.url && (
                                <DropdownMenuItem>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Open Link
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredDocs.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No documentation found.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DeveloperPageLayout>
  )
}
