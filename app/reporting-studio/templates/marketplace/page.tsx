/**
 * Phase 5.5: Template Marketplace
 * 
 * Browse and install templates from the marketplace
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Star,
  Download,
  Eye,
  Search,
  Filter,
  TrendingUp,
  Calendar,
  User,
  CheckCircle2,
  Loader2,
  ThumbsUp,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

export default function TemplateMarketplacePage() {
  const router = useRouter()
  const currentUser = useAuthStore((state) => state.user)
  const [templates, setTemplates] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [sortBy, setSortBy] = useState('popular')
  const [showFeatured, setShowFeatured] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [selectedCategory, selectedType, sortBy, showFeatured, searchQuery])

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (selectedType !== 'all') params.append('type', selectedType)
      if (showFeatured) params.append('featured', 'true')
      if (searchQuery) params.append('search', searchQuery)
      params.append('sort', sortBy)

      const res = await fetch(`/api/templates/marketplace?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = async (template: any) => {
    try {
      const res = await fetch(`/api/templates/marketplace/${template.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedTemplate(data.template)
        setIsDetailDialogOpen(true)
      }
    } catch (error) {
      console.error('Error fetching template details:', error)
    }
  }

  const handleInstall = async (templateId: string) => {
    setIsInstalling(true)
    try {
      const res = await fetch(`/api/templates/marketplace/${templateId}`, {
        method: 'POST',
      })

      if (res.ok) {
        alert('Template installed successfully!')
        setIsDetailDialogOpen(false)
        fetchTemplates()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to install template')
      }
    } catch (error) {
      console.error('Error installing template:', error)
      alert('Failed to install template')
    } finally {
      setIsInstalling(false)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.round(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ))
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Template Marketplace</h1>
          <p className="text-muted-foreground mt-1">
            Browse and install pre-built templates for dashboards, reports, and visualizations
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
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
            <div className="min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="DASHBOARD">Dashboard</SelectItem>
                  <SelectItem value="REPORT">Report</SelectItem>
                  <SelectItem value="VISUALIZATION">Visualization</SelectItem>
                  <SelectItem value="TRANSFORMATION">Transformation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant={showFeatured ? 'default' : 'outline'}
              onClick={() => setShowFeatured(!showFeatured)}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Featured
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </CardContent>
        </Card>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No templates found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your filters or search query
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              {template.previewImage && (
                <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                  <img
                    src={template.previewImage}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.featured && (
                      <Badge className="mt-1 bg-yellow-500">Featured</Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {template.rating && (
                      <div className="flex items-center gap-1">
                        {renderStars(template.rating)}
                        <span className="ml-1">({template._count?.reviews || 0})</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      {template.usageCount || 0} installs
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {template.category && (
                      <Badge variant="outline">{template.category}</Badge>
                    )}
                    <Badge variant="secondary">{template.type}</Badge>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewDetails(template)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleInstall(template.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Install
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Template Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl">{selectedTemplate.name}</DialogTitle>
                    <DialogDescription className="mt-2">
                      {selectedTemplate.description}
                    </DialogDescription>
                  </div>
                  {selectedTemplate.featured && (
                    <Badge className="bg-yellow-500">Featured</Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Preview Image */}
                {selectedTemplate.previewImage && (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={selectedTemplate.previewImage}
                      alt={selectedTemplate.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold">
                      {selectedTemplate.rating?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Rating</div>
                    <div className="flex items-center gap-1 mt-1">
                      {renderStars(selectedTemplate.rating || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {selectedTemplate.usageCount || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Installs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {selectedTemplate._count?.reviews || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Reviews</div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.category && (
                    <Badge variant="outline">Category: {selectedTemplate.category}</Badge>
                  )}
                  <Badge variant="outline">Type: {selectedTemplate.type}</Badge>
                  {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                    <>
                      {selectedTemplate.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </>
                  )}
                </div>

                {/* Author */}
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created by:</span>
                  <span>
                    {selectedTemplate.createdBy?.firstName} {selectedTemplate.createdBy?.lastName}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {formatDate(selectedTemplate.createdAt)}
                  </span>
                </div>

                {/* Reviews */}
                {selectedTemplate.reviews && selectedTemplate.reviews.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Reviews</h3>
                    <div className="space-y-4 max-h-64 overflow-auto">
                      {selectedTemplate.reviews.map((review: any) => (
                        <div key={review.id} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {renderStars(review.rating)}
                              </div>
                              <span className="text-sm font-medium">
                                {review.user?.firstName} {review.user?.lastName}
                              </span>
                              {review.isVerified && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Button variant="ghost" size="sm" className="h-6">
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              {review._count?.helpfulVotes || 0}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Install Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={() => handleInstall(selectedTemplate.id)}
                    disabled={isInstalling}
                    size="lg"
                  >
                    {isInstalling ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Installing...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Install Template
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

