'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, LayoutGrid, TrendingUp, DollarSign, ShoppingCart, Settings, FileText } from 'lucide-react'
import { DashboardTemplate, DASHBOARD_TEMPLATES, getDashboardTemplatesByCategory, searchDashboardTemplates } from '@/lib/reporting-studio/dashboard-templates'

interface DashboardTemplateSelectorProps {
  onSelectTemplate: (template: DashboardTemplate) => void
  onCancel?: () => void
}

const categoryIcons = {
  EXECUTIVE: TrendingUp,
  ANALYTICS: LayoutGrid,
  FINANCE: DollarSign,
  SALES: ShoppingCart,
  OPERATIONAL: Settings,
  CUSTOM: FileText,
}

const categoryColors = {
  EXECUTIVE: 'bg-blue-100 text-blue-800',
  ANALYTICS: 'bg-purple-100 text-purple-800',
  FINANCE: 'bg-green-100 text-green-800',
  SALES: 'bg-orange-100 text-orange-800',
  OPERATIONAL: 'bg-gray-100 text-gray-800',
  CUSTOM: 'bg-slate-100 text-slate-800',
}

export function DashboardTemplateSelector({ onSelectTemplate, onCancel }: DashboardTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<DashboardTemplate['category'] | 'ALL'>('ALL')

  const filteredTemplates = searchQuery
    ? searchDashboardTemplates(searchQuery)
    : selectedCategory === 'ALL'
    ? DASHBOARD_TEMPLATES
    : getDashboardTemplatesByCategory(selectedCategory)

  const categories: Array<DashboardTemplate['category'] | 'ALL'> = ['ALL', 'EXECUTIVE', 'ANALYTICS', 'FINANCE', 'SALES', 'OPERATIONAL', 'CUSTOM']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Choose a Dashboard Template</h2>
        <p className="text-muted-foreground mt-2">
          Select a template to get started, or start with a blank dashboard
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category === 'ALL' ? LayoutGrid : categoryIcons[category]
          return (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedCategory(category)
                setSearchQuery('')
              }}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {category === 'ALL' ? 'All' : category.charAt(0) + category.slice(1).toLowerCase()}
            </Button>
          )
        })}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No templates found matching your search.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {
            const CategoryIcon = categoryIcons[template.category]
            return (
              <Card
                key={template.id}
                className="cursor-pointer hover:shadow-lg transition-shadow flex flex-col"
                onClick={() => onSelectTemplate(template)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <Badge className={categoryColors[template.category]}>
                    {template.category.charAt(0) + template.category.slice(1).toLowerCase()}
                  </Badge>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col">
                  <CardDescription className="mb-4">{template.description}</CardDescription>
                  
                  {/* Widget Count */}
                  <div className="text-sm text-muted-foreground mb-4">
                    {template.widgets.length} {template.widgets.length === 1 ? 'widget' : 'widgets'}
                  </div>

                  {/* Tags */}
                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-auto">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Select Button */}
                  <Button className="mt-4 w-full" onClick={(e) => {
                    e.stopPropagation()
                    onSelectTemplate(template)
                  }}>
                    Use This Template
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Cancel Button */}
      {onCancel && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

