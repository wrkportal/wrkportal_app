'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Plus, Settings, Save, X, Type, Hash, Calendar, List,
  CheckSquare, Link, Mail, Trash2, GripVertical
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CustomFieldDefinition {
  id: string
  name: string
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'url' | 'email'
  options?: string[] // for select type
  required: boolean
  defaultValue?: string
}

export interface CustomFieldValue {
  fieldId: string
  value: any
}

const fieldTypeIcons: Record<string, React.ReactNode> = {
  text: <Type className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  select: <List className="h-4 w-4" />,
  checkbox: <CheckSquare className="h-4 w-4" />,
  url: <Link className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
}

const fieldTypeLabels: Record<string, string> = {
  text: 'Text',
  number: 'Number',
  date: 'Date',
  select: 'Dropdown',
  checkbox: 'Checkbox',
  url: 'URL',
  email: 'Email',
}

interface CustomFieldsEditorProps {
  fields: CustomFieldDefinition[]
  values: CustomFieldValue[]
  onFieldsChange?: (fields: CustomFieldDefinition[]) => void
  onValuesChange?: (values: CustomFieldValue[]) => void
  editable?: boolean
  className?: string
}

export function CustomFieldsEditor({
  fields,
  values,
  onFieldsChange,
  onValuesChange,
  editable = true,
  className,
}: CustomFieldsEditorProps) {
  const [showAddField, setShowAddField] = React.useState(false)
  const [newField, setNewField] = React.useState<Partial<CustomFieldDefinition>>({
    name: '',
    type: 'text',
    required: false,
  })
  const [selectOptions, setSelectOptions] = React.useState('')

  const getValue = (fieldId: string) => {
    return values.find((v) => v.fieldId === fieldId)?.value ?? ''
  }

  const updateValue = (fieldId: string, value: any) => {
    const existing = values.find((v) => v.fieldId === fieldId)
    const next = existing
      ? values.map((v) => (v.fieldId === fieldId ? { ...v, value } : v))
      : [...values, { fieldId, value }]
    onValuesChange?.(next)
  }

  const addField = () => {
    if (!newField.name) return
    const field: CustomFieldDefinition = {
      id: `cf_${Date.now()}`,
      name: newField.name!,
      type: (newField.type as any) || 'text',
      required: newField.required || false,
      options: newField.type === 'select' ? selectOptions.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    }
    onFieldsChange?.([...fields, field])
    setNewField({ name: '', type: 'text', required: false })
    setSelectOptions('')
    setShowAddField(false)
  }

  const removeField = (fieldId: string) => {
    onFieldsChange?.(fields.filter((f) => f.id !== fieldId))
  }

  const renderFieldInput = (field: CustomFieldDefinition) => {
    const value = getValue(field.id)
    switch (field.type) {
      case 'text':
      case 'url':
      case 'email':
        return (
          <Input
            type={field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'}
            value={value}
            onChange={(e) => updateValue(field.id, e.target.value)}
            placeholder={`Enter ${field.name}...`}
            className="h-8 text-sm"
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateValue(field.id, e.target.value)}
            placeholder="0"
            className="h-8 text-sm"
          />
        )
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateValue(field.id, e.target.value)}
            className="h-8 text-sm"
          />
        )
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => updateValue(field.id, e.target.value)}
            className="h-8 text-sm w-full rounded-md border bg-background px-3"
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => updateValue(field.id, e.target.checked)}
            className="h-4 w-4 rounded"
          />
        )
      default:
        return null
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Custom Fields
          </CardTitle>
          {editable && (
            <Button variant="ghost" size="sm" onClick={() => setShowAddField(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Field
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.length === 0 && !showAddField && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No custom fields defined. Click "Add Field" to create one.
          </p>
        )}

        {fields.map((field) => (
          <div key={field.id} className="flex items-center gap-3">
            <div className="text-muted-foreground shrink-0">{fieldTypeIcons[field.type]}</div>
            <div className="w-28 shrink-0">
              <span className="text-sm font-medium">{field.name}</span>
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </div>
            <div className="flex-1">{renderFieldInput(field)}</div>
            {editable && (
              <button onClick={() => removeField(field.id)} className="text-muted-foreground hover:text-red-500 shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}

        {/* Add field form */}
        {showAddField && (
          <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Field Name</Label>
                <Input
                  value={newField.name || ''}
                  onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                  placeholder="e.g., Priority Score"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <select
                  value={newField.type || 'text'}
                  onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                  className="h-8 text-sm w-full rounded-md border bg-background px-3"
                >
                  {Object.entries(fieldTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            {newField.type === 'select' && (
              <div className="space-y-1">
                <Label className="text-xs">Options (comma-separated)</Label>
                <Input
                  value={selectOptions}
                  onChange={(e) => setSelectOptions(e.target.value)}
                  placeholder="High, Medium, Low"
                  className="h-8 text-sm"
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={newField.required || false}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  className="rounded"
                />
                Required
              </label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddField(false)}>Cancel</Button>
                <Button size="sm" onClick={addField}>Add</Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
