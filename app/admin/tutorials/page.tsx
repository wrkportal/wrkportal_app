'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { UserRole } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Eye,
  Video,
  FileText,
  AlertCircle,
} from 'lucide-react'
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
  order: number
  isPublished: boolean
  viewCount: number
  createdAt: string
  createdBy: {
    name: string
    email: string
  }
}

const CATEGORIES = {
  PROJECT_MANAGEMENT: [
    'Getting Started',
    'Planning & Execution',
    'Team & Stakeholders',
    'Reporting & Monitoring',
  ],
  TOOLS_WORKINGS: [
    'AI Assistant',
    'Automations',
    'Integrations & Security',
  ],
}

export default function TutorialsAdminPage() {
  const user = useAuthStore((state) => state.user)
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'VIDEO' as 'VIDEO' | 'TEXT' | 'INTERACTIVE',
    duration: '',
    level: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    category: '',
    section: 'PROJECT_MANAGEMENT' as 'PROJECT_MANAGEMENT' | 'TOOLS_WORKINGS',
    videoUrl: '',
    contentText: '',
    thumbnail: '',
    order: 0,
    isPublished: true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Check if user is super admin or platform owner
  if (user?.role !== UserRole.TENANT_SUPER_ADMIN && user?.role !== UserRole.PLATFORM_OWNER) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <h2 className="text-xl font-bold">Access Denied</h2>
          </div>
          <p className="text-muted-foreground">
            Only super administrators can access the tutorial management page.
          </p>
        </Card>
      </div>
    )
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingTutorial
        ? `/api/tutorials/${editingTutorial.id}`
        : '/api/tutorials'
      const method = editingTutorial ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchTutorials()
        handleCloseDialog()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save tutorial')
      }
    } catch (error) {
      console.error('Error saving tutorial:', error)
      alert('Failed to save tutorial')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('video', file)

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: uploadFormData,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData({
          ...formData,
          videoUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
        })
        alert('Video uploaded successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to upload video')
      }
    } catch (error) {
      console.error('Error uploading video:', error)
      alert('Failed to upload video')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tutorial?')) return

    try {
      const response = await fetch(`/api/tutorials/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchTutorials()
      } else {
        alert('Failed to delete tutorial')
      }
    } catch (error) {
      console.error('Error deleting tutorial:', error)
      alert('Failed to delete tutorial')
    }
  }

  const handleEdit = (tutorial: Tutorial) => {
    setEditingTutorial(tutorial)
    setFormData({
      title: tutorial.title,
      description: tutorial.description,
      type: tutorial.type,
      duration: tutorial.duration,
      level: tutorial.level,
      category: tutorial.category,
      section: tutorial.section,
      videoUrl: tutorial.videoUrl || '',
      contentText: tutorial.contentText || '',
      thumbnail: tutorial.thumbnail || '',
      order: tutorial.order,
      isPublished: tutorial.isPublished,
    })
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingTutorial(null)
    setFormData({
      title: '',
      description: '',
      type: 'VIDEO',
      duration: '',
      level: 'BEGINNER',
      category: '',
      section: 'PROJECT_MANAGEMENT',
      videoUrl: '',
      contentText: '',
      thumbnail: '',
      order: 0,
      isPublished: true,
    })
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'bg-green-100 text-green-700'
      case 'INTERMEDIATE': return 'bg-blue-100 text-blue-700'
      case 'ADVANCED': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-muted rounded-lg">
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Tutorial Management
              </h1>
              <p className="text-muted-foreground">Create and manage academy tutorials</p>
            </div>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTutorial(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tutorial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTutorial ? 'Edit Tutorial' : 'Add New Tutorial'}
              </DialogTitle>
              <DialogDescription>
                {editingTutorial
                  ? 'Update the tutorial details below.'
                  : 'Fill in the details to create a new tutorial.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIDEO">Video</SelectItem>
                      <SelectItem value="TEXT">Text</SelectItem>
                      <SelectItem value="INTERACTIVE">Interactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Duration * (e.g., "10 min")</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="10 min"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="level">Level *</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value: any) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Beginner</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="section">Section *</Label>
                  <Select
                    value={formData.section}
                    onValueChange={(value: any) => {
                      setFormData({ ...formData, section: value, category: '' })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROJECT_MANAGEMENT">Project Management</SelectItem>
                      <SelectItem value="TOOLS_WORKINGS">ManagerBook Tools</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES[formData.section].map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'VIDEO' && (
                <>
                  <div>
                    <Label htmlFor="videoUrl">Video URL (YouTube embed)</Label>
                    <Input
                      id="videoUrl"
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      placeholder="https://www.youtube.com/embed/VIDEO_ID"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use YouTube embed format: https://www.youtube.com/embed/VIDEO_ID
                    </p>
                  </div>

                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">OR</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <Label htmlFor="videoFile">Upload Video File</Label>
                    <Input
                      id="videoFile"
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      onChange={handleVideoUpload}
                      disabled={uploading}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload MP4, WebM, OGG, or MOV (Max 100MB)
                    </p>
                    {uploading && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                          Uploading video...
                        </div>
                      </div>
                    )}
                    {formData.fileName && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Uploaded: {formData.fileName}
                      </p>
                    )}
                  </div>
                </>
              )}

              {formData.type === 'TEXT' && (
                <div>
                  <Label htmlFor="contentText">Content Text</Label>
                  <Textarea
                    id="contentText"
                    value={formData.contentText}
                    onChange={(e) => setFormData({ ...formData, contentText: e.target.value })}
                    rows={6}
                    placeholder="Enter tutorial content in markdown or plain text"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-center gap-2 pt-8">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isPublished">Published</Label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? 'Saving...' : editingTutorial ? 'Update Tutorial' : 'Create Tutorial'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Tutorials</p>
          <p className="text-2xl font-bold">{tutorials.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Video Tutorials</p>
          <p className="text-2xl font-bold">
            {tutorials.filter((t) => t.type === 'VIDEO').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Text Guides</p>
          <p className="text-2xl font-bold">
            {tutorials.filter((t) => t.type === 'TEXT').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Views</p>
          <p className="text-2xl font-bold">
            {tutorials.reduce((sum, t) => sum + t.viewCount, 0)}
          </p>
        </Card>
      </div>

      {/* Tutorials List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading tutorials...</p>
        </div>
      ) : tutorials.length === 0 ? (
        <Card className="p-12 text-center">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Tutorials Yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first tutorial.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tutorial
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tutorials.map((tutorial) => (
            <Card key={tutorial.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {tutorial.type === 'VIDEO' ? (
                      <Video className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                    <h3 className="font-semibold">{tutorial.title}</h3>
                    {!tutorial.isPublished && (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {tutorial.description}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className={getLevelColor(tutorial.level)}>
                      {tutorial.level}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {tutorial.section === 'PROJECT_MANAGEMENT' ? 'Project Management' : 'ManagerBook Tools'} › {tutorial.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {tutorial.duration}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {tutorial.viewCount} views
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(tutorial)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(tutorial.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

