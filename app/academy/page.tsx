'use client'

import { useState, useEffect } from 'react'
import {
  GraduationCap,
  Play,
  BookOpen,
  Clock,
  Target,
  BarChart3,
  Users,
  FileText,
  Calendar,
  Shield,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Workflow,
  UserCog,
  ClipboardCheck,
  MessageSquare,
  DollarSign,
  Activity,
  Bell,
  Search,
  Folder,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Tutorial {
  id: string
  title: string
  description: string
  type: 'VIDEO' | 'TEXT' | 'INTERACTIVE'
  duration: string
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  category: string
  section: 'PROJECT_MANAGEMENT' | 'TOOLS_WORKINGS'
  videoUrl?: string
  contentText?: string
  thumbnail?: string
  viewCount: number
  completed?: boolean
}

// Sidebar categories organized by sections
const SIDEBAR_STRUCTURE = {
  'PROJECT_MANAGEMENT': {
    title: 'Project Management',
    icon: Target,
    categories: [
      { id: 'Getting Started', name: 'Getting Started', icon: Play },
      { id: 'Planning & Execution', name: 'Planning & Execution', icon: Calendar },
      { id: 'Team & Stakeholders', name: 'Team & Stakeholders', icon: Users },
      { id: 'Reporting & Monitoring', name: 'Reporting & Monitoring', icon: BarChart3 },
    ]
  },
  'TOOLS_WORKINGS': {
    title: 'ManagerBook Tools',
    icon: Sparkles,
    categories: [
      { id: 'AI Assistant', name: 'AI Assistant', icon: Sparkles },
      { id: 'Automations', name: 'Automations', icon: Workflow },
      { id: 'Integrations & Security', name: 'Integrations & Security', icon: Shield },
    ]
  }
}

export default function AcademyPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'PROJECT_MANAGEMENT': true,
    'TOOLS_WORKINGS': false,
  })

  useEffect(() => {
    fetchTutorials()
  }, [])

  const fetchTutorials = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tutorials')
      if (response.ok) {
        const data = await response.json()
        setTutorials(data.tutorials)
      }
    } catch (error) {
      console.error('Error fetching tutorials:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTutorials = selectedCategory === 'all' 
    ? tutorials 
    : tutorials.filter(t => t.category === selectedCategory)

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'bg-green-100 text-green-700 border-green-200'
      case 'INTERMEDIATE': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'ADVANCED': return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getCountForCategory = (categoryId: string) => {
    return tutorials.filter(t => t.category === categoryId).length
  }

  return (
    <div className="flex h-full">
      {/* Academy Sidebar */}
      <aside className="w-64 border-r bg-card flex-shrink-0 max-h-[calc(100vh-200px)]">
        <div className="p-4 overflow-y-auto max-h-full">
          {/* All Tutorials Option */}
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors mb-4",
              selectedCategory === 'all'
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent text-foreground"
            )}
            onClick={() => setSelectedCategory('all')}
          >
            <GraduationCap className="h-5 w-5" />
            <div className="flex-1">
              <div className="font-medium text-sm">All Tutorials</div>
              <div className="text-xs opacity-80">{tutorials.length} lessons</div>
            </div>
          </div>

          {/* Project Management Section */}
          <div className="mb-4">
            <div
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer transition-colors mb-2",
                "hover:bg-accent"
              )}
              onClick={() => toggleSection('PROJECT_MANAGEMENT')}
            >
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-sm">Project Management</span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  expandedSections['PROJECT_MANAGEMENT'] && "rotate-180"
                )}
              />
            </div>

            {/* Project Management Categories */}
            {expandedSections['PROJECT_MANAGEMENT'] && (
              <div className="ml-2 space-y-1 border-l-2 border-border pl-2">
                {SIDEBAR_STRUCTURE['PROJECT_MANAGEMENT'].categories.map((category) => {
                  const Icon = category.icon
                  const count = getCountForCategory(category.id)
                  const isActive = selectedCategory === category.id
                  
                  return (
                    <div
                      key={category.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors text-sm",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent text-muted-foreground"
                      )}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{category.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Tools & Workings Section */}
          <div className="mb-4">
            <div
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer transition-colors mb-2",
                "hover:bg-accent"
              )}
              onClick={() => toggleSection('TOOLS_WORKINGS')}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-sm">ManagerBook Tools</span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  expandedSections['TOOLS_WORKINGS'] && "rotate-180"
                )}
              />
            </div>

            {/* Tools & Workings Categories */}
            {expandedSections['TOOLS_WORKINGS'] && (
              <div className="ml-2 space-y-1 border-l-2 border-border pl-2">
                {SIDEBAR_STRUCTURE['TOOLS_WORKINGS'].categories.map((category) => {
                  const Icon = category.icon
                  const count = getCountForCategory(category.id)
                  const isActive = selectedCategory === category.id
                  
                  return (
                    <div
                      key={category.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors text-sm",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent text-muted-foreground"
                      )}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{category.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
        <div className="p-6 md:p-8">
          {/* Header - Sticky */}
          <div className="sticky top-0 md:top-12 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2 md:pt-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Learning Academy
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">Master ManagerBook with video tutorials and guides</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tutorials.length}</p>
                  <p className="text-xs text-muted-foreground">Total Tutorials</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Play className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tutorials.filter(t => t.type === 'VIDEO').length}</p>
                  <p className="text-xs text-muted-foreground">Video Lessons</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tutorials.filter(t => t.type === 'TEXT').length}</p>
                  <p className="text-xs text-muted-foreground">Text Guides</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Current Category Title */}
          {selectedCategory !== 'all' && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold">{selectedCategory}</h2>
              <p className="text-sm text-muted-foreground">
                {filteredTutorials.length} tutorial{filteredTutorials.length !== 1 ? 's' : ''} in this category
              </p>
            </div>
          )}

          {/* Tutorial Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">Loading tutorials...</p>
              </div>
            ) : filteredTutorials.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground">
                  Exciting tutorials will be available here soon!
                </p>
              </div>
            ) : (
              filteredTutorials.map((tutorial) => (
              <Card 
                key={tutorial.id} 
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setSelectedTutorial(tutorial)}
              >
                {tutorial.type === 'VIDEO' ? (
                  <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <Play className="h-12 w-12 text-white opacity-80 group-hover:scale-110 transition-transform" />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-black/50 text-white border-0">
                        {tutorial.duration}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-video bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-white opacity-80" />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-black/50 text-white border-0">
                        {tutorial.duration}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm leading-tight">{tutorial.title}</h3>
                    {tutorial.type === 'VIDEO' && (
                      <Play className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    {tutorial.type === 'TEXT' && (
                      <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {tutorial.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`text-xs ${getLevelColor(tutorial.level)}`}>
                      {tutorial.level}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {tutorial.duration}
                    </div>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 border-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </Card>
            )))}
          </div>
        </div>
      </div>

      {/* Tutorial Detail Modal */}
      {selectedTutorial && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedTutorial(null)}
        >
          <Card 
            className="w-full max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedTutorial.title}</h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className={getLevelColor(selectedTutorial.level)}>
                      {selectedTutorial.level}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {selectedTutorial.duration}
                    </div>
                    <Badge variant="secondary">{selectedTutorial.category}</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedTutorial(null)}>
                  ×
                </Button>
              </div>

              <p className="text-muted-foreground mb-6">{selectedTutorial.description}</p>

              {selectedTutorial.type === 'VIDEO' && selectedTutorial.videoUrl && (
                <div className="aspect-video bg-black rounded-lg mb-6 overflow-hidden">
                  <iframe
                    className="w-full h-full"
                    src={selectedTutorial.videoUrl}
                    title={selectedTutorial.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {selectedTutorial.type === 'TEXT' && (
                <div className="prose prose-sm max-w-none mb-6 p-6 bg-muted rounded-lg">
                  {selectedTutorial.contentText ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedTutorial.contentText.replace(/\n/g, '<br />') }} />
                  ) : (
                    <>
                      <h3>Tutorial Content</h3>
                      <p>
                        This comprehensive guide will walk you through {selectedTutorial.title.toLowerCase()}.
                        Follow the steps below to master this feature.
                      </p>
                      <h4>What You'll Learn</h4>
                      <ul>
                        <li>Core concepts and principles</li>
                        <li>Step-by-step implementation</li>
                        <li>Best practices and tips</li>
                        <li>Common pitfalls to avoid</li>
                      </ul>
                      <h4>Getting Started</h4>
                      <p>
                        Let's begin with the fundamentals. This tutorial is designed for {selectedTutorial.level.toLowerCase()}-level users
                        and should take approximately {selectedTutorial.duration} to complete.
                      </p>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button className="flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Complete
                </Button>
                <Button variant="outline">
                  Next Tutorial
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

