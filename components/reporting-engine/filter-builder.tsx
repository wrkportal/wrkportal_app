'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface FilterCondition {
  id: string
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'contains' | 'starts_with' | 'ends_with' | 'in' | 'not_in' | 'is_null' | 'is_not_null'
  value: string | string[]
}

interface FilterBuilderProps {
  availableFields: Array<{ name: string; type: string }>
  filters: FilterCondition[]
  onFiltersChange: (filters: FilterCondition[]) => void
  title?: string
}

const OPERATORS = [
  { value: 'equals', label: 'Equals (=)' },
  { value: 'not_equals', label: 'Not Equals (≠)' },
  { value: 'greater_than', label: 'Greater Than (>)' },
  { value: 'less_than', label: 'Less Than (<)' },
  { value: 'greater_equal', label: 'Greater or Equal (≥)' },
  { value: 'less_equal', label: 'Less or Equal (≤)' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'in', label: 'In (multiple values)' },
  { value: 'not_in', label: 'Not In' },
  { value: 'is_null', label: 'Is Null' },
  { value: 'is_not_null', label: 'Is Not Null' },
]

export function FilterBuilder({ availableFields, filters, onFiltersChange, title = 'Filters' }: FilterBuilderProps) {
  const addFilter = () => {
    const newFilter: FilterCondition = {
      id: `filter-${Date.now()}`,
      field: availableFields[0]?.name || '',
      operator: 'equals',
      value: '',
    }
    onFiltersChange([...filters, newFilter])
  }

  const removeFilter = (id: string) => {
    onFiltersChange(filters.filter(f => f.id !== id))
  }

  const updateFilter = (id: string, updates: Partial<FilterCondition>) => {
    onFiltersChange(
      filters.map(f => (f.id === id ? { ...f, ...updates } : f))
    )
  }

  const isValueRequired = (operator: string) => {
    return !['is_null', 'is_not_null'].includes(operator)
  }

  const isMultiValue = (operator: string) => {
    return ['in', 'not_in'].includes(operator)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {filters.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No filters applied</p>
            <p className="text-xs mt-1">Click "Add Filter" to create a filter condition</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filters.map((filter, index) => (
              <div key={filter.id} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
                <div className="flex-1 grid grid-cols-12 gap-2 items-start">
                  {/* Field Selection */}
                  <div className="col-span-3">
                    <Label className="text-xs text-muted-foreground mb-1 block">Field</Label>
                    <Select
                      value={filter.field}
                      onValueChange={(value) => updateFilter(filter.id, { field: value, value: '' })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.length > 0 ? (
                          availableFields.map((field) => (
                            <SelectItem key={field.name} value={field.name}>
                              {field.name}
                              {field.type && (
                                <span className="text-muted-foreground ml-2">({field.type})</span>
                              )}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            No fields available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Operator Selection */}
                  <div className="col-span-3">
                    <Label className="text-xs text-muted-foreground mb-1 block">Operator</Label>
                    <Select
                      value={filter.operator}
                      onValueChange={(value) => updateFilter(filter.id, { operator: value as any, value: '' })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value Input */}
                  <div className="col-span-5">
                    <Label className="text-xs text-muted-foreground mb-1 block">Value</Label>
                    {isValueRequired(filter.operator) ? (
                      isMultiValue(filter.operator) ? (
                        <Input
                          placeholder="Comma-separated values: value1, value2, value3"
                          value={Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}
                          onChange={(e) => {
                            const values = e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                            updateFilter(filter.id, { value: values })
                          }}
                          className="h-9"
                        />
                      ) : (
                        <Input
                          placeholder="Enter value"
                          value={String(filter.value || '')}
                          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                          className="h-9"
                        />
                      )
                    ) : (
                      <div className="h-9 flex items-center text-sm text-muted-foreground px-3 border rounded-md bg-background">
                        No value required
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-1 flex items-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => removeFilter(filter.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addFilter}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Filter
        </Button>
      </CardContent>
    </Card>
  )
}
