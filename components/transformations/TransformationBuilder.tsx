/**
 * Phase 5.4: Visual Transformation Builder Component
 * 
 * Drag-and-drop pipeline builder with step configuration
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Trash2,
  Save,
  Play,
  Loader2,
  Database,
  Filter,
  Move,
  BarChart3,
  Link2,
  Calculator,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TransformationOperator } from '@/lib/transformations/transformation-engine'

interface TransformationStep {
  id?: string
  stepOrder: number
  operator: TransformationOperator | string
  config: Record<string, any>
  inputStepIds: string[]
  outputSchema?: any
  previewData?: any[]
  errorMessage?: string
  isActive?: boolean
}

interface TransformationBuilderProps {
  transformation: any
  onSave: (pipelineConfig: any, steps: TransformationStep[]) => void
  isSaving: boolean
  showPreview?: boolean
}

const OPERATOR_CATEGORIES = {
  'Data Source': ['READ_DATASET', 'READ_CSV', 'READ_JSON', 'READ_API'],
  'Filtering': ['FILTER', 'WHERE', 'DISTINCT'],
  'Transformation': ['SELECT_COLUMNS', 'RENAME_COLUMNS', 'ADD_COLUMN', 'REMOVE_COLUMNS', 'SORT', 'LIMIT', 'OFFSET'],
  'Aggregation': ['GROUP_BY', 'AGGREGATE', 'PIVOT', 'UNPIVOT'],
  'Joins': ['INNER_JOIN', 'LEFT_JOIN', 'RIGHT_JOIN', 'FULL_JOIN', 'UNION'],
  'Calculations': ['CALCULATE', 'FORMAT_DATE', 'PARSE_NUMBER', 'CONCATENATE'],
  'Data Quality': ['FILL_NULLS', 'REMOVE_DUPLICATES', 'VALIDATE_DATA', 'CLEAN_DATA'],
}

const OPERATOR_ICONS: Record<string, any> = {
  READ_DATASET: Database,
  FILTER: Filter,
  SELECT_COLUMNS: Move,
  GROUP_BY: BarChart3,
  INNER_JOIN: Link2,
  CALCULATE: Calculator,
  FILL_NULLS: Settings,
}

export function TransformationBuilder({
  transformation,
  onSave,
  isSaving,
  showPreview = false,
}: TransformationBuilderProps) {
  const [steps, setSteps] = useState<TransformationStep[]>(
    transformation.steps || []
  )
  const [selectedStep, setSelectedStep] = useState<TransformationStep | null>(null)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [pipelineConfig, setPipelineConfig] = useState(
    transformation.pipelineConfig || {}
  )

  const handleAddStep = () => {
    const newStep: TransformationStep = {
      stepOrder: steps.length,
      operator: 'FILTER',
      config: {},
      inputStepIds: steps.length > 0 ? [steps[steps.length - 1].id || `${steps.length - 1}`] : [],
    }
    setSteps([...steps, newStep])
    setSelectedStep(newStep)
    setIsConfigDialogOpen(true)
  }

  const handleUpdateStep = (updatedStep: TransformationStep) => {
    setSteps(steps.map(s => 
      s.id === updatedStep.id && s.stepOrder === updatedStep.stepOrder
        ? updatedStep
        : s
    ))
    setSelectedStep(null)
    setIsConfigDialogOpen(false)
  }

  const handleDeleteStep = (stepOrder: number) => {
    const newSteps = steps
      .filter(s => s.stepOrder !== stepOrder)
      .map((s, idx) => ({ ...s, stepOrder: idx }))
    setSteps(newSteps)
  }

  const handleMoveStep = (stepOrder: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && stepOrder === 0) ||
      (direction === 'down' && stepOrder === steps.length - 1)
    ) {
      return
    }

    const newOrder = direction === 'up' ? stepOrder - 1 : stepOrder + 1
    const newSteps = [...steps]
    const temp = newSteps[stepOrder]
    newSteps[stepOrder] = { ...newSteps[newOrder], stepOrder }
    newSteps[newOrder] = { ...temp, stepOrder: newOrder }
    
    setSteps(newSteps)
  }

  const handlePreview = async () => {
    setIsLoadingPreview(true)
    setIsPreviewDialogOpen(true)
    
    try {
      const res = await fetch(`/api/transformations/${transformation.id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowCount: transformation.previewRowCount || 100 }),
      })

      if (res.ok) {
        const data = await res.json()
        setPreviewData(data.preview)
      } else {
        const error = await res.json()
        setPreviewData({ error: error.error })
      }
    } catch (error) {
      console.error('Error previewing transformation:', error)
      setPreviewData({ error: 'Failed to load preview' })
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleSave = () => {
    onSave(pipelineConfig, steps)
  }

  const getOperatorIcon = (operator: string) => {
    const Icon = OPERATOR_ICONS[operator] || Settings
    return <Icon className="h-4 w-4" />
  }

  const getOperatorLabel = (operator: string) => {
    return operator.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="h-full flex">
      {/* Main Pipeline Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Pipeline Steps */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Input Dataset */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <div className="font-medium">Input Dataset</div>
                  <div className="text-sm text-muted-foreground">
                    {transformation.inputDataset?.name || 'Unknown'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Transformation Steps */}
            {steps.map((step, index) => (
              <div key={step.stepOrder}>
                {/* Connection Line */}
                {index > 0 && (
                  <div className="flex justify-center py-2">
                    <div className="w-0.5 h-6 bg-border" />
                  </div>
                )}

                {/* Step Card */}
                <Card
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:shadow-md",
                    selectedStep?.stepOrder === step.stepOrder && "ring-2 ring-primary"
                  )}
                  onClick={() => {
                    setSelectedStep(step)
                    setIsConfigDialogOpen(true)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {step.stepOrder + 1}
                      </div>
                      {getOperatorIcon(step.operator)}
                      <div className="flex-1">
                        <div className="font-medium">{getOperatorLabel(step.operator)}</div>
                        <div className="text-sm text-muted-foreground">
                          {step.errorMessage ? (
                            <span className="text-red-600">{step.errorMessage}</span>
                          ) : (
                            `Step ${step.stepOrder + 1}`
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {step.stepOrder > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMoveStep(step.stepOrder, 'up')
                          }}
                        >
                          ↑
                        </Button>
                      )}
                      {step.stepOrder < steps.length - 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMoveStep(step.stepOrder, 'down')
                          }}
                        >
                          ↓
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteStep(step.stepOrder)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ))}

            {/* Add Step Button */}
            <div className="flex justify-center pt-4">
              <Button onClick={handleAddStep} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="border-t border-border bg-background px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {steps.length} step(s) in pipeline
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <Play className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Pipeline
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar - Step Configuration */}
      {selectedStep && (
        <StepConfigDialog
          step={selectedStep}
          isOpen={isConfigDialogOpen}
          onClose={() => {
            setIsConfigDialogOpen(false)
            setSelectedStep(null)
          }}
          onSave={handleUpdateStep}
          allSteps={steps}
          inputDataset={transformation.inputDataset}
        />
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Transformation Preview</DialogTitle>
            <DialogDescription>
              Preview of transformation results
            </DialogDescription>
          </DialogHeader>
          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : previewData?.error ? (
            <div className="text-red-600">{previewData.error}</div>
          ) : previewData ? (
            <PreviewTable data={previewData.finalData || []} schema={previewData.finalSchema || []} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Step Configuration Dialog Component
function StepConfigDialog({
  step,
  isOpen,
  onClose,
  onSave,
  allSteps,
  inputDataset,
}: {
  step: TransformationStep
  isOpen: boolean
  onClose: () => void
  onSave: (step: TransformationStep) => void
  allSteps: TransformationStep[]
  inputDataset: any
}) {
  const [operator, setOperator] = useState(step.operator)
  const [config, setConfig] = useState<Record<string, any>>(step.config)

  const handleSave = () => {
    onSave({
      ...step,
      operator,
      config,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Configure Step {step.stepOrder + 1}</DialogTitle>
          <DialogDescription>
            Configure the transformation operator
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Operator</Label>
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(OPERATOR_CATEGORIES).map(([category, operators]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {category}
                    </div>
                    {operators.map((op) => (
                      <SelectItem key={op} value={op}>
                        {op.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operator-specific configuration */}
          {operator === 'FILTER' && (
            <FilterConfig config={config} onConfigChange={setConfig} />
          )}
          {operator === 'SELECT_COLUMNS' && (
            <SelectColumnsConfig config={config} onConfigChange={setConfig} inputDataset={inputDataset} />
          )}
          {operator === 'SORT' && (
            <SortConfig config={config} onConfigChange={setConfig} inputDataset={inputDataset} />
          )}
          {operator === 'GROUP_BY' && (
            <GroupByConfig config={config} onConfigChange={setConfig} inputDataset={inputDataset} />
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Step
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Configuration components for different operators
function FilterConfig({
  config,
  onConfigChange,
}: {
  config: Record<string, any>
  onConfigChange: (config: Record<string, any>) => void
}) {
  const [column, setColumn] = useState(config.column || '')
  const [operator, setOperator] = useState(config.operator || 'equals')
  const [value, setValue] = useState(config.value || '')

  const handleUpdate = (field: string, newValue: any) => {
    const newConfig = { ...config, [field]: newValue }
    onConfigChange(newConfig)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Column</Label>
        <Input 
          value={column} 
          onChange={(e) => { 
            const newValue = e.target.value
            setColumn(newValue)
            handleUpdate('column', newValue)
          }} 
        />
      </div>
      <div>
        <Label>Operator</Label>
        <Select 
          value={operator} 
          onValueChange={(v) => { 
            setOperator(v)
            handleUpdate('operator', v)
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="not_equals">Not Equals</SelectItem>
            <SelectItem value="greater_than">Greater Than</SelectItem>
            <SelectItem value="less_than">Less Than</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Value</Label>
        <Input 
          value={value} 
          onChange={(e) => { 
            const newValue = e.target.value
            setValue(newValue)
            handleUpdate('value', newValue)
          }} 
        />
      </div>
    </div>
  )
}

function SelectColumnsConfig({
  config,
  onConfigChange,
  inputDataset,
}: {
  config: Record<string, any>
  onConfigChange: (config: Record<string, any>) => void
  inputDataset: any
}) {
  const columns = (inputDataset?.schema as any[]) || []
  const [selectedColumns, setSelectedColumns] = useState<string[]>(config.columns || [])

  const handleToggle = (col: string) => {
    const newCols = selectedColumns.includes(col)
      ? selectedColumns.filter(c => c !== col)
      : [...selectedColumns, col]
    setSelectedColumns(newCols)
    onConfigChange({ columns: newCols })
  }

  return (
    <div>
      <Label>Select Columns</Label>
      <div className="mt-2 space-y-2 max-h-48 overflow-auto border rounded p-2">
        {columns.map((col: any) => (
          <label key={col.name} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedColumns.includes(col.name)}
              onChange={() => handleToggle(col.name)}
            />
            <span className="text-sm">{col.name} ({col.type})</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function SortConfig({
  config,
  onConfigChange,
  inputDataset,
}: {
  config: Record<string, any>
  onConfigChange: (config: Record<string, any>) => void
  inputDataset: any
}) {
  const columns = (inputDataset?.schema as any[]) || []
  const [column, setColumn] = useState(config.column || '')
  const [direction, setDirection] = useState(config.direction || 'asc')

  const handleUpdate = () => {
    onConfigChange({ column, direction })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Column</Label>
        <Select value={column} onValueChange={(v) => { setColumn(v); handleUpdate() }}>
          <SelectTrigger>
            <SelectValue placeholder="Select column" />
          </SelectTrigger>
          <SelectContent>
            {columns.map((col: any) => (
              <SelectItem key={col.name} value={col.name}>
                {col.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Direction</Label>
        <Select value={direction} onValueChange={(v) => { setDirection(v); handleUpdate() }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function GroupByConfig({
  config,
  onConfigChange,
  inputDataset,
}: {
  config: Record<string, any>
  onConfigChange: (config: Record<string, any>) => void
  inputDataset: any
}) {
  const columns = (inputDataset?.schema as any[]) || []
  const [groupColumns, setGroupColumns] = useState<string[]>(config.columns || [])

  const handleToggle = (col: string) => {
    const newCols = groupColumns.includes(col)
      ? groupColumns.filter(c => c !== col)
      : [...groupColumns, col]
    setGroupColumns(newCols)
    onConfigChange({ columns: newCols })
  }

  return (
    <div>
      <Label>Group By Columns</Label>
      <div className="mt-2 space-y-2 max-h-48 overflow-auto border rounded p-2">
        {columns.map((col: any) => (
          <label key={col.name} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={groupColumns.includes(col.name)}
              onChange={() => handleToggle(col.name)}
            />
            <span className="text-sm">{col.name}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// Preview Table Component
function PreviewTable({ data, schema }: { data: any[]; schema: any[] }) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No data to preview</div>
  }

  const columns = schema.length > 0 
    ? schema.map((s: any) => s.name)
    : Object.keys(data[0] || {})

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {columns.map((col: string) => (
              <th key={col} className="text-left p-2 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 100).map((row: any, idx: number) => (
            <tr key={idx} className="border-b">
              {columns.map((col: string) => (
                <td key={col} className="p-2">
                  {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 100 && (
        <div className="text-sm text-muted-foreground mt-2 text-center">
          Showing first 100 rows of {data.length} total rows
        </div>
      )}
    </div>
  )
}

