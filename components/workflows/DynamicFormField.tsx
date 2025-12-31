'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { TaskField } from '@/lib/workflows/task-templates'

interface DynamicFormFieldProps {
  field: TaskField
  value: any
  onChange: (value: any) => void
  error?: string
}

export function DynamicFormField({ field, value, onChange, error }: DynamicFormFieldProps) {
  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            id={field.key}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className={error ? 'border-red-500' : ''}
          />
        )

      case 'textarea':
        return (
          <Textarea
            id={field.key}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            rows={3}
            className={error ? 'border-red-500' : ''}
          />
        )

      case 'number':
        return (
          <Input
            id={field.key}
            type="number"
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
            required={field.required}
            className={error ? 'border-red-500' : ''}
          />
        )

      case 'date':
        return (
          <Input
            id={field.key}
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className={error ? 'border-red-500' : ''}
          />
        )

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={onChange}
            required={field.required}
          >
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder || 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'list':
        const listItems = Array.isArray(value) ? value : value ? [value] : []
        return (
          <div className="space-y-2">
            {listItems.map((item: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => {
                    const newItems = [...listItems]
                    newItems[index] = e.target.value
                    onChange(newItems)
                  }}
                  placeholder={field.placeholder || 'Enter item...'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newItems = listItems.filter((_, i) => i !== index)
                    onChange(newItems.length > 0 ? newItems : [])
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onChange([...listItems, ''])
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        )

      case 'checklist':
        const checklistItems = Array.isArray(value) ? value : []
        return (
          <div className="space-y-2">
            {checklistItems.map((item: { text: string; checked: boolean }, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={(checked) => {
                    const newItems = [...checklistItems]
                    newItems[index] = { ...item, checked: !!checked }
                    onChange(newItems)
                  }}
                />
                <Input
                  value={item.text}
                  onChange={(e) => {
                    const newItems = [...checklistItems]
                    newItems[index] = { ...item, text: e.target.value }
                    onChange(newItems)
                  }}
                  placeholder="Checklist item..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newItems = checklistItems.filter((_, i) => i !== index)
                    onChange(newItems)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onChange([...checklistItems, { text: '', checked: false }])
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        )

      default:
        return (
          <Input
            id={field.key}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className={error ? 'border-red-500' : ''}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.key}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderField()}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

