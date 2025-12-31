'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, FileSpreadsheet, FileText, Plus, ChevronRight, ChevronDown, Edit, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { BudgetDialog } from '@/components/finance/budget-dialog'
import { EditableTable } from '@/components/finance/editable-table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface BudgetCategory {
  id?: string
  name: string
  code?: string
  allocatedAmount: number
  spentAmount?: number
  committedAmount?: number
  percentage?: number
  subCategories?: BudgetSubCategory[]
}

interface BudgetSubCategory {
  id?: string
  name: string
  code?: string
  allocatedAmount: number
  spentAmount?: number
  committedAmount?: number
  percentage?: number
  subSubCategories?: BudgetSubSubCategory[]
}

interface BudgetSubSubCategory {
  id?: string
  name: string
  code?: string
  allocatedAmount: number
  spentAmount?: number
  committedAmount?: number
  percentage?: number
}

interface Budget {
  id: string
  name: string
  description?: string
  totalAmount: number
  spentAmount: number
  committedAmount: number
  currency: string
  fiscalYear: number
  fiscalQuarter?: number
  startDate: string
  endDate: string
  status: string
  project?: { id: string; name: string; code: string }
  program?: { id: string; name: string; code: string }
  categories?: BudgetCategory[]
}

export function BudgetsTab() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set())
  const [hasExistingBudgets, setHasExistingBudgets] = useState(false)

  useEffect(() => {
    loadBudgets()
  }, [])

  useEffect(() => {
    setHasExistingBudgets(budgets.length > 0)
  }, [budgets])

  const loadBudgets = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/finance/budgets')
      if (response.ok) {
        const data = await response.json()
        const budgetsWithHierarchy = (data.budgets || []).map((budget: any) => ({
          ...budget,
          categories: (budget.categories || []).map((cat: any) => ({
            ...cat,
            allocatedAmount: Number(cat.allocatedAmount),
            spentAmount: Number(cat.spentAmount || 0),
            committedAmount: Number(cat.committedAmount || 0),
            percentage: Number(cat.percentage || 0),
            subCategories: (cat.subCategories || []).map((subCat: any) => ({
              ...subCat,
              allocatedAmount: Number(subCat.allocatedAmount),
              spentAmount: Number(subCat.spentAmount || 0),
              committedAmount: Number(subCat.committedAmount || 0),
              percentage: Number(subCat.percentage || 0),
              subSubCategories: (subCat.subCategories || []).map((subSubCat: any) => ({
                ...subSubCat,
                allocatedAmount: Number(subSubCat.allocatedAmount),
                spentAmount: Number(subSubCat.spentAmount || 0),
                committedAmount: Number(subSubCat.committedAmount || 0),
                percentage: Number(subSubCat.percentage || 0),
              })),
            })),
          })),
        }))
        setBudgets(budgetsWithHierarchy)
      }
    } catch (error) {
      console.error('Error loading budgets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!uploadFile) return

    setUploadLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('budgetId', selectedBudget?.id || '')

      const response = await fetch('/api/finance/budgets/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        alert('Budget uploaded successfully!')
        setUploadDialogOpen(false)
        setUploadFile(null)
        loadBudgets()
        if (data.budget) {
          setSelectedBudget(data.budget)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to upload budget file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload budget file')
    } finally {
      setUploadLoading(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const toggleSubCategory = (subCategoryId: string) => {
    const newExpanded = new Set(expandedSubCategories)
    if (newExpanded.has(subCategoryId)) {
      newExpanded.delete(subCategoryId)
    } else {
      newExpanded.add(subCategoryId)
    }
    setExpandedSubCategories(newExpanded)
  }

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget)
    setBudgetDialogOpen(true)
  }

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return

    try {
      const response = await fetch(`/api/finance/budgets/${budgetId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadBudgets()
        if (selectedBudget?.id === budgetId) {
          setSelectedBudget(null)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete budget')
      }
    } catch (error) {
      console.error('Error deleting budget:', error)
      alert('Failed to delete budget')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading budgets...</p>
        </div>
      </div>
    )
  }

  // First-time budget setup workflow
  if (!hasExistingBudgets) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Budget Management</CardTitle>
            <CardDescription>
              Get started by creating your first budget or uploading an existing budget file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                onClick={() => setBudgetDialogOpen(true)}
                className="h-32 flex-col gap-3"
                size="lg"
              >
                <Plus className="h-8 w-8" />
                <span className="text-lg">Create New Budget</span>
                <span className="text-sm font-normal opacity-80">
                  Set up a budget from scratch with categories
                </span>
              </Button>
              <Button
                onClick={() => setUploadDialogOpen(true)}
                variant="outline"
                className="h-32 flex-col gap-3"
                size="lg"
              >
                <Upload className="h-8 w-8" />
                <span className="text-lg">Upload Budget File</span>
                <span className="text-sm font-normal opacity-80">
                  Import from Excel or CSV file
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Editable Table */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Budget Planning Table</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create and manage your budget items with a flexible table structure. Double-click any cell, row name, or column header to edit.
            </p>
          </div>
          <EditableTable />
        </div>

        <BudgetDialog
          open={budgetDialogOpen}
          onClose={() => {
            setBudgetDialogOpen(false)
            setEditingBudget(null)
          }}
          onSuccess={() => {
            loadBudgets()
            setBudgetDialogOpen(false)
            setEditingBudget(null)
          }}
        />

        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Budget File</DialogTitle>
              <DialogDescription>
                Upload an Excel (.xlsx, .xls) or CSV file to import your budget
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Select File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
              </div>
              <Button
                onClick={handleFileUpload}
                disabled={!uploadFile || uploadLoading}
                className="w-full"
              >
                {uploadLoading ? 'Uploading...' : 'Upload File'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Existing budgets workflow
  return (
    <div className="space-y-6" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Budgets</h2>
          <p className="text-muted-foreground">Manage and track your budgets</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>
          <Button onClick={() => setBudgetDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Budget
          </Button>
        </div>
      </div>

      {/* Editable Table */}
      <div className="space-y-4" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
        <div>
          <h3 className="text-lg font-semibold mb-2">Budget Planning Table</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create and manage your budget items with a flexible table structure. Double-click any cell, row name, or column header to edit.
          </p>
        </div>
        <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box', position: 'relative' }}>
          <EditableTable />
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Budget List</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedBudget}>
            Budget Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {budgets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No budgets found</p>
                <Button onClick={() => setBudgetDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Budget
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {budgets.map((budget) => (
                <Card
                  key={budget.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedBudget(budget)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{budget.name}</h3>
                          <Badge variant={budget.status === 'APPROVED' ? 'default' : 'secondary'}>
                            {budget.status}
                          </Badge>
                        </div>
                        {budget.description && (
                          <p className="text-sm text-muted-foreground mb-3">{budget.description}</p>
                        )}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Budget</p>
                            <p className="text-lg font-semibold">{formatCurrency(budget.totalAmount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Spent</p>
                            <p className="text-lg font-semibold">{formatCurrency(budget.spentAmount)}</p>
                            <Progress
                              value={(budget.spentAmount / budget.totalAmount) * 100}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Committed</p>
                            <p className="text-lg font-semibold">{formatCurrency(budget.committedAmount)}</p>
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-muted-foreground">
                          {budget.fiscalYear} {budget.fiscalQuarter ? `Q${budget.fiscalQuarter}` : ''}
                          {budget.project && ` • ${budget.project.name}`}
                          {budget.program && ` • ${budget.program.name}`}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditBudget(budget)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteBudget(budget.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedBudget && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedBudget.name}</CardTitle>
                      <CardDescription>{selectedBudget.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadDialogOpen(true)}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditBudget(selectedBudget)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Budget</p>
                      <p className="text-2xl font-bold">{formatCurrency(selectedBudget.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Spent</p>
                      <p className="text-2xl font-bold">{formatCurrency(selectedBudget.spentAmount)}</p>
                      <Progress
                        value={(selectedBudget.spentAmount / selectedBudget.totalAmount) * 100}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Committed</p>
                      <p className="text-2xl font-bold">{formatCurrency(selectedBudget.committedAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedBudget.totalAmount - selectedBudget.spentAmount - selectedBudget.committedAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Hierarchical Categories Display */}
                  {selectedBudget.categories && selectedBudget.categories.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">Budget Categories</h3>
                      <div className="space-y-2">
                        {selectedBudget.categories.map((category: BudgetCategory) => {
                          const categoryId = category.id || category.name
                          const isExpanded = expandedCategories.has(categoryId)
                          const categoryTotal = category.allocatedAmount || 0
                          const categorySpent = category.spentAmount || 0
                          const categoryCommitted = category.committedAmount || 0

                          return (
                            <div key={categoryId} className="border rounded-lg">
                              <div
                                className="p-4 hover:bg-muted/50 cursor-pointer flex items-center justify-between"
                                onClick={() => toggleCategory(categoryId)}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  {category.subCategories && category.subCategories.length > 0 ? (
                                    isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )
                                  ) : (
                                    <div className="w-4" />
                                  )}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{category.name}</span>
                                      {category.code && (
                                        <Badge variant="outline" className="text-xs">
                                          {category.code}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {formatCurrency(categoryTotal)} • {category.percentage?.toFixed(1)}% of total
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="text-sm text-muted-foreground">Spent</p>
                                      <p className="font-semibold">{formatCurrency(categorySpent)}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm text-muted-foreground">Committed</p>
                                      <p className="font-semibold">{formatCurrency(categoryCommitted)}</p>
                                    </div>
                                    <Progress
                                      value={(categorySpent / categoryTotal) * 100}
                                      className="w-24"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Sub-Categories */}
                              {isExpanded && category.subCategories && category.subCategories.length > 0 && (
                                <div className="border-t bg-muted/30">
                                  {category.subCategories.map((subCategory: BudgetSubCategory) => {
                                    const subCategoryId = subCategory.id || `${categoryId}-${subCategory.name}`
                                    const isSubExpanded = expandedSubCategories.has(subCategoryId)
                                    const subTotal = subCategory.allocatedAmount || 0
                                    const subSpent = subCategory.spentAmount || 0
                                    const subCommitted = subCategory.committedAmount || 0

                                    return (
                                      <div key={subCategoryId} className="border-b last:border-b-0">
                                        <div
                                          className="p-3 pl-12 hover:bg-muted/50 cursor-pointer flex items-center justify-between"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            toggleSubCategory(subCategoryId)
                                          }}
                                        >
                                          <div className="flex items-center gap-3 flex-1">
                                            {subCategory.subSubCategories && subCategory.subSubCategories.length > 0 ? (
                                              isSubExpanded ? (
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                              ) : (
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                              )
                                            ) : (
                                              <div className="w-4" />
                                            )}
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{subCategory.name}</span>
                                                {subCategory.code && (
                                                  <Badge variant="outline" className="text-xs">
                                                    {subCategory.code}
                                                  </Badge>
                                                )}
                                              </div>
                                              <div className="text-xs text-muted-foreground mt-0.5">
                                                {formatCurrency(subTotal)} • {subCategory.percentage?.toFixed(1)}% of category
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                              <div className="text-right">
                                                <p className="text-xs text-muted-foreground">Spent</p>
                                                <p className="text-sm font-semibold">{formatCurrency(subSpent)}</p>
                                              </div>
                                              <div className="text-right">
                                                <p className="text-xs text-muted-foreground">Committed</p>
                                                <p className="text-sm font-semibold">{formatCurrency(subCommitted)}</p>
                                              </div>
                                              <Progress
                                                value={(subSpent / subTotal) * 100}
                                                className="w-20"
                                              />
                                            </div>
                                          </div>
                                        </div>

                                        {/* Sub-Sub-Categories */}
                                        {isSubExpanded && subCategory.subSubCategories && subCategory.subSubCategories.length > 0 && (
                                          <div className="bg-muted/20">
                                            {subCategory.subSubCategories.map((subSubCategory: BudgetSubSubCategory) => {
                                              const subSubTotal = subSubCategory.allocatedAmount || 0
                                              const subSubSpent = subSubCategory.spentAmount || 0
                                              const subSubCommitted = subSubCategory.committedAmount || 0

                                              return (
                                                <div
                                                  key={subSubCategory.id || subSubCategory.name}
                                                  className="p-2 pl-20 border-b last:border-b-0 hover:bg-muted/30"
                                                >
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-sm">{subSubCategory.name}</span>
                                                      {subSubCategory.code && (
                                                        <Badge variant="outline" className="text-xs">
                                                          {subSubCategory.code}
                                                        </Badge>
                                                      )}
                                                      <span className="text-xs text-muted-foreground">
                                                        {formatCurrency(subSubTotal)} • {subSubCategory.percentage?.toFixed(1)}%
                                                      </span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                      <div className="text-right">
                                                        <p className="text-xs text-muted-foreground">Spent</p>
                                                        <p className="text-xs font-semibold">{formatCurrency(subSubSpent)}</p>
                                                      </div>
                                                      <div className="text-right">
                                                        <p className="text-xs text-muted-foreground">Committed</p>
                                                        <p className="text-xs font-semibold">{formatCurrency(subSubCommitted)}</p>
                                                      </div>
                                                      <Progress
                                                        value={(subSubSpent / subSubTotal) * 100}
                                                        className="w-16"
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                              )
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Budget Dialog */}
      <BudgetDialog
        open={budgetDialogOpen}
        onClose={() => {
          setBudgetDialogOpen(false)
          setEditingBudget(null)
        }}
        onSuccess={() => {
          loadBudgets()
          setBudgetDialogOpen(false)
          setEditingBudget(null)
        }}
        budgetId={editingBudget?.id}
      />

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Budget File</DialogTitle>
            <DialogDescription>
              Upload an Excel (.xlsx, .xls) or CSV file to import your budget with hierarchical categories
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Select File</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {uploadFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {uploadFile.name.endsWith('.csv') ? (
                      <FileText className="h-4 w-4" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4" />
                    )}
                    <span className="max-w-[200px] truncate">{uploadFile.name}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Supported formats: Excel (.xlsx, .xls) or CSV. File should contain columns: Category, Sub-Category, Sub-Sub-Category, Amount
              </p>
            </div>
            <Button
              onClick={handleFileUpload}
              disabled={!uploadFile || uploadLoading}
              className="w-full"
            >
              {uploadLoading ? 'Uploading...' : 'Upload File'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

