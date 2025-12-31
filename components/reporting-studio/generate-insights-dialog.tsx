'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

interface GenerateInsightsDialogProps {
  datasetId: string
  datasetName: string
  availableColumns?: string[]
  onInsightsGenerated?: (insights: any[]) => void
  trigger?: React.ReactNode
}

export function GenerateInsightsDialog({
  datasetId,
  datasetName,
  availableColumns = [],
  onInsightsGenerated,
  trigger,
}: GenerateInsightsDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [options, setOptions] = useState({
    analyzeTrends: true,
    detectAnomalies: true,
    analyzeCorrelations: true,
  })
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (selectedColumns.length === 0) {
      setError('Please select at least one column to analyze')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/reporting-studio/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId,
          columnNames: selectedColumns,
          options,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate insights')
      }

      const data = await response.json()
      toast({
        title: 'Insights Generated',
        description: `Generated ${data.count} insights from ${selectedColumns.length} columns.`,
      })

      onInsightsGenerated?.(data.insights)
      setOpen(false)
      setSelectedColumns([])
    } catch (err: any) {
      setError(err.message || 'Failed to generate insights')
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate insights',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleColumn = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    )
  }

  const selectAllColumns = () => {
    setSelectedColumns(availableColumns)
  }

  const clearSelection = () => {
    setSelectedColumns([])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Insights
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Auto-Insights</DialogTitle>
          <DialogDescription>
            Analyze <strong>{datasetName}</strong> to automatically discover insights, trends, and anomalies.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Column Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Select Columns to Analyze</Label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllColumns}
                  disabled={availableColumns.length === 0}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  disabled={selectedColumns.length === 0}
                >
                  Clear
                </Button>
              </div>
            </div>

            {availableColumns.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No columns available. Please ensure your dataset has data.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                <div className="grid gap-3">
                  {availableColumns.map((column) => (
                    <div key={column} className="flex items-center space-x-2">
                      <Checkbox
                        id={`column-${column}`}
                        checked={selectedColumns.includes(column)}
                        onCheckedChange={() => toggleColumn(column)}
                      />
                      <Label
                        htmlFor={`column-${column}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {column}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedColumns.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedColumns.length} column{selectedColumns.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Analysis Options */}
          <div className="space-y-4">
            <Label>Analysis Options</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="analyze-trends"
                  checked={options.analyzeTrends}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, analyzeTrends: !!checked })
                  }
                />
                <Label htmlFor="analyze-trends" className="text-sm font-normal cursor-pointer">
                  Analyze Trends
                  <span className="text-muted-foreground ml-2">
                    Detect trends and patterns in time-series data
                  </span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="detect-anomalies"
                  checked={options.detectAnomalies}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, detectAnomalies: !!checked })
                  }
                />
                <Label htmlFor="detect-anomalies" className="text-sm font-normal cursor-pointer">
                  Detect Anomalies
                  <span className="text-muted-foreground ml-2">
                    Identify outliers and unusual patterns
                  </span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="analyze-correlations"
                  checked={options.analyzeCorrelations}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, analyzeCorrelations: !!checked })
                  }
                />
                <Label
                  htmlFor="analyze-correlations"
                  className="text-sm font-normal cursor-pointer"
                >
                  Analyze Correlations
                  <span className="text-muted-foreground ml-2">
                    Find relationships between columns
                  </span>
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating || selectedColumns.length === 0}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Insights
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

