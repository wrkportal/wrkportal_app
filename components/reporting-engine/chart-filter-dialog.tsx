'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, X, Filter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ChartFilterDialogProps {
  open: boolean
  onClose: () => void
  visualization: any
  onFiltersChange: (filters: any[]) => void
}

export function ChartFilterDialog({ open, onClose, visualization, onFiltersChange }: ChartFilterDialogProps) {
  const { toast } = useToast()
  const [filters, setFilters] = useState<any[]>([])
  const [availableColumns, setAvailableColumns] = useState<string[]>([])
  const [selectedColumn, setSelectedColumn] = useState<string>('')
  const [uniqueValues, setUniqueValues] = useState<any[]>([])
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set())
  const [loadingValues, setLoadingValues] = useState(false)

  useEffect(() => {
    if (open && visualization) {
      // Load existing filters
      const existingFilters = visualization.config?.filters || []
      setFilters(existingFilters)

      // Load available columns from data source
      loadAvailableColumns()
    }
  }, [open, visualization])

  const loadAvailableColumns = async () => {
    if (!visualization?.queryId) return

    try {
      const queryResponse = await fetch(`/api/reporting-engine/queries/${visualization.queryId}`)
      if (!queryResponse.ok) return

      const queryData = await queryResponse.json()
      const query = queryData.query

      if (!query?.dataSourceId) return

      const dataSourceResponse = await fetch(`/api/reporting-engine/data-sources/${query.dataSourceId}`)
      if (!dataSourceResponse.ok) return

      const dataSourceData = await dataSourceResponse.json()
      const dataSource = dataSourceData.dataSource

      if (dataSource.type === 'FILE' && dataSource.schema?.fields) {
        const columns = dataSource.schema.fields.map((f: any) => f.name)
        setAvailableColumns(columns)
      }
    } catch (error) {
      console.error('Error loading columns:', error)
    }
  }

  const loadUniqueValues = async (column: string) => {
    if (!visualization?.queryId || !column) return

    setLoadingValues(true)
    try {
      const queryResponse = await fetch(`/api/reporting-engine/queries/${visualization.queryId}`)
      if (!queryResponse.ok) throw new Error('Failed to fetch query')

      const queryData = await queryResponse.json()
      const query = queryData.query

      if (!query?.dataSourceId) throw new Error('No data source')

      // Fetch data to get unique values
      const fileQueryResponse = await fetch(`/api/reporting-engine/data-sources/${query.dataSourceId}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          select: [column],
          limit: 10000,
          allowGroupBy: false,
        }),
      })

      if (!fileQueryResponse.ok) throw new Error('Failed to fetch data')

      const fileQueryData = await fileQueryResponse.json()
      
      // Extract unique values
      const values = new Set<string>()
      fileQueryData.rows?.forEach((row: any[]) => {
        const value = row[0]
        if (value !== null && value !== undefined && value !== '') {
          values.add(String(value))
        }
      })

      const sortedValues = Array.from(values).sort()
      setUniqueValues(sortedValues)
      setSelectedValues(new Set())
    } catch (error) {
      console.error('Error loading unique values:', error)
      toast({
        title: 'Error',
        description: 'Failed to load unique values',
        variant: 'destructive',
      })
    } finally {
      setLoadingValues(false)
    }
  }

  const handleColumnSelect = (column: string) => {
    setSelectedColumn(column)
    setSelectedValues(new Set())
    loadUniqueValues(column)
  }

  const toggleValue = (value: string) => {
    const newSelected = new Set(selectedValues)
    if (newSelected.has(value)) {
      newSelected.delete(value)
    } else {
      newSelected.add(value)
    }
    setSelectedValues(newSelected)
  }

  const addFilter = () => {
    if (!selectedColumn || selectedValues.size === 0) {
      toast({
        title: 'Invalid Filter',
        description: 'Please select a column and at least one value',
        variant: 'destructive',
      })
      return
    }

    const newFilter = {
      id: `filter-${Date.now()}`,
      field: selectedColumn,
      operator: 'in',
      value: Array.from(selectedValues),
    }

    const updatedFilters = [...filters, newFilter]
    setFilters(updatedFilters)
    setSelectedColumn('')
    setSelectedValues(new Set())
    setUniqueValues([])
  }

  const removeFilter = (filterId: string) => {
    setFilters(filters.filter(f => f.id !== filterId))
  }

  const handleSave = () => {
    onFiltersChange(filters)
    onClose()
    toast({
      title: 'Success',
      description: 'Filters updated successfully',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Chart Filters - {visualization?.name}
          </DialogTitle>
          <DialogDescription>
            Add filters to show only specific data in this chart
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Filters */}
          {filters.length > 0 && (
            <div>
              <Label className="text-sm font-semibold mb-3 block">Active Filters</Label>
              <div className="space-y-2">
                {filters.map((filter) => (
                  <div key={filter.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{filter.field}</span>
                        <Badge variant="secondary" className="text-xs">in</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {Array.isArray(filter.value) 
                          ? `${filter.value.length} value(s): ${filter.value.slice(0, 3).join(', ')}${filter.value.length > 3 ? '...' : ''}`
                          : filter.value
                        }
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFilter(filter.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Filter */}
          <div className="border-t pt-6">
            <Label className="text-sm font-semibold mb-3 block">Add New Filter</Label>
            
            {/* Column Selection */}
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Select Column</Label>
                <Select value={selectedColumn} onValueChange={handleColumnSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a column to filter" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns
                      .filter(col => !filters.some(f => f.field === col))
                      .map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value Selection */}
              {selectedColumn && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Select Values ({selectedValues.size} selected)
                  </Label>
                  {loadingValues ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Loading unique values...
                    </div>
                  ) : uniqueValues.length > 0 ? (
                    <ScrollArea className="h-64 border rounded-lg p-4">
                      <div className="space-y-2">
                        {uniqueValues.map((value) => (
                          <div key={value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`value-${value}`}
                              checked={selectedValues.has(value)}
                              onCheckedChange={() => toggleValue(value)}
                            />
                            <label
                              htmlFor={`value-${value}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {value}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No values found for this column
                    </div>
                  )}
                </div>
              )}

              {/* Add Filter Button */}
              {selectedColumn && selectedValues.size > 0 && (
                <Button
                  onClick={addFilter}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Filter
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
