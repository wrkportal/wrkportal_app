'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Search, Plus, Code, BookOpen } from 'lucide-react'
import { RegisterFunctionForm } from './register-function-form'

interface Function {
  name: string
  syntax: string
  description: string
  category?: string
  parameters: Array<{ name: string; type: string; required: boolean; description?: string }>
  examples?: string[]
  returnType: string
}

export function FunctionSelector({ onSelect }: { onSelect: (func: Function) => void }) {
  const [functions, setFunctions] = useState<Function[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedFunction, setSelectedFunction] = useState<Function | null>(null)
  const [showRegisterDialog, setShowRegisterDialog] = useState(false)

  useEffect(() => {
    loadFunctions()
  }, [])

  const loadFunctions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reporting-engine/functions')
      const data = await response.json()
      setFunctions(data.functions || [])

      // Extract categories
      const cats = [...new Set<string>(data.functions.map((f: Function) => f.category || 'uncategorized'))]
      setCategories(cats.sort())
    } catch (error) {
      console.error('Failed to load functions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredFunctions = functions.filter(f => {
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase()) ||
      f.syntax.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleFunctionClick = (func: Function) => {
    setSelectedFunction(func)
    onSelect(func)
  }

  const handleFunctionRegistered = () => {
    setShowRegisterDialog(false)
    loadFunctions() // Reload functions
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading functions...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Functions</CardTitle>
              <CardDescription>
                Browse and use available functions in your queries
              </CardDescription>
            </div>
            <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Register Function
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Register Custom Function</DialogTitle>
                  <DialogDescription>
                    Create a new function for use in queries
                  </DialogDescription>
                </DialogHeader>
                <RegisterFunctionForm onSuccess={handleFunctionRegistered} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search functions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories ({functions.length})</SelectItem>
              {categories.map(cat => {
                const count = functions.filter(f => f.category === cat).length
                return (
                  <SelectItem key={cat} value={cat}>
                    {cat} ({count})
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          {/* Function List */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {filteredFunctions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No functions found
                </div>
              ) : (
                filteredFunctions.map(func => (
                  <Card
                    key={func.name}
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleFunctionClick(func)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{func.name}</h3>
                          {func.category && (
                            <Badge variant="outline">{func.category}</Badge>
                          )}
                          <Badge variant="secondary">{func.returnType}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {func.description}
                        </p>
                        <code className="text-xs bg-muted px-2 py-1 rounded block mb-2">
                          {func.syntax}
                        </code>
                        {func.parameters && func.parameters.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Parameters:</strong>{' '}
                            {func.parameters.map(p =>
                              `${p.name} (${p.type}${p.required ? '' : '?'})`
                            ).join(', ')}
                          </div>
                        )}
                        {func.examples && func.examples.length > 0 && (
                          <div className="mt-2 text-xs">
                            <strong className="text-muted-foreground">Examples:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {func.examples.map((ex, idx) => (
                                <li key={idx} className="text-muted-foreground">{ex}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Function Details Dialog */}
      {selectedFunction && (
        <Dialog open={!!selectedFunction} onOpenChange={() => setSelectedFunction(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedFunction.name}</DialogTitle>
              <DialogDescription>{selectedFunction.description}</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="details" className="mt-4">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="syntax">Syntax</TabsTrigger>
                <TabsTrigger value="examples">Examples</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                <div>
                  <strong>Return Type:</strong> {selectedFunction.returnType}
                </div>
                <div>
                  <strong>Category:</strong> {selectedFunction.category || 'uncategorized'}
                </div>
                {selectedFunction.parameters && selectedFunction.parameters.length > 0 && (
                  <div>
                    <strong>Parameters:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {selectedFunction.parameters.map((param, idx) => (
                        <li key={idx}>
                          <code>{param.name}</code> ({param.type}
                          {param.required ? ', required' : ', optional'})
                          {param.description && ` - ${param.description}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="syntax">
                <code className="block p-4 bg-muted rounded-lg">
                  {selectedFunction.syntax}
                </code>
              </TabsContent>
              <TabsContent value="examples">
                {selectedFunction.examples && selectedFunction.examples.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2">
                    {selectedFunction.examples.map((ex, idx) => (
                      <li key={idx}>
                        <code className="bg-muted px-2 py-1 rounded">{ex}</code>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No examples available</p>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}








