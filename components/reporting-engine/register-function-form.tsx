'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, X, Loader2 } from 'lucide-react'

interface RegisterFunctionFormProps {
  onSuccess: () => void
}

export function RegisterFunctionForm({ onSuccess }: RegisterFunctionFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    syntax: '',
    description: '',
    returnType: 'number',
    category: 'custom',
    code: ''
  })
  const [parameters, setParameters] = useState<Array<{
    name: string
    type: string
    required: boolean
    description: string
  }>>([])
  const [newParam, setNewParam] = useState({ name: '', type: 'number', required: true, description: '' })

  const handleAddParameter = () => {
    if (newParam.name.trim()) {
      setParameters([...parameters, { ...newParam }])
      setNewParam({ name: '', type: 'number', required: true, description: '' })
    }
  }

  const handleRemoveParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Build execute function from code
      let executeFunction
      if (formData.code.trim()) {
        // Try to create function from code string
        try {
          executeFunction = new Function('return ' + formData.code)()
        } catch (err) {
          // If that fails, try as function body
          executeFunction = new Function(...parameters.map(p => p.name), formData.code)
        }
      } else {
        // Default simple function
        executeFunction = function(...args: any[]) {
          return args[0]
        }
      }

      const functionDef = {
        name: formData.name,
        syntax: formData.syntax || `${formData.name}(${parameters.map(p => p.name).join(', ')})`,
        description: formData.description,
        execute: executeFunction,
        returnType: formData.returnType,
        parameters: parameters,
        category: formData.category
      }

      const response = await fetch('/api/reporting-engine/functions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(functionDef)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.details || 'Failed to register function')
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Function Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
            placeholder="MY_FUNCTION"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="returnType">Return Type *</Label>
          <Select
            value={formData.returnType}
            onValueChange={(value) => setFormData({ ...formData, returnType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="string">String</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="any">Any</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="syntax">Syntax</Label>
        <Input
          id="syntax"
          value={formData.syntax}
          onChange={(e) => setFormData({ ...formData, syntax: e.target.value })}
          placeholder="MY_FUNCTION(param1, param2)"
        />
        <p className="text-xs text-muted-foreground">
          Auto-generated if left empty
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="What does this function do?"
          required
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Custom</SelectItem>
            <SelectItem value="mathematical">Mathematical</SelectItem>
            <SelectItem value="string">String</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="financial">Financial</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Parameters</Label>
        <div className="grid grid-cols-4 gap-2">
          <Input
            placeholder="Parameter name"
            value={newParam.name}
            onChange={(e) => setNewParam({ ...newParam, name: e.target.value })}
          />
          <Select
            value={newParam.type}
            onValueChange={(value) => setNewParam({ ...newParam, type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="string">String</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="any">Any</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Description"
            value={newParam.description}
            onChange={(e) => setNewParam({ ...newParam, description: e.target.value })}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleAddParameter}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {parameters.length > 0 && (
          <div className="mt-2 space-y-1">
            {parameters.map((param, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                <span className="font-mono">{param.name}</span>
                <span className="text-muted-foreground">({param.type})</span>
                {param.description && (
                  <span className="text-muted-foreground">- {param.description}</span>
                )}
                <Button
                  type="button"
                  onClick={() => handleRemoveParameter(idx)}
                  size="sm"
                  variant="ghost"
                  className="ml-auto h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Function Code (JavaScript)</Label>
        <Textarea
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          placeholder="return param1 * param2;"
          rows={4}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          JavaScript code that returns the result. Use parameter names as variables.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Register Function
        </Button>
      </div>
    </form>
  )
}















