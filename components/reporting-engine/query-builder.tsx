'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X, Play } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface QueryBuilderProps {
  onExecute: (query: any) => void
  tables?: string[]
}

export function QueryBuilder({ onExecute, tables = [] }: QueryBuilderProps) {
  const [query, setQuery] = useState({
    select: ['*'],
    from: '',
    where: '',
    groupBy: [] as string[],
    orderBy: '',
    limit: 100
  })

  const [selectedColumns, setSelectedColumns] = useState<string[]>(['*'])
  const [newColumn, setNewColumn] = useState('')
  const [joins, setJoins] = useState<Array<{
    type: string
    table: string
    leftKey: string
    rightKey: string
  }>>([])

  const handleAddColumn = () => {
    if (newColumn.trim() && !selectedColumns.includes(newColumn.trim())) {
      const updated = selectedColumns[0] === '*' 
        ? [newColumn.trim()] 
        : [...selectedColumns, newColumn.trim()]
      setSelectedColumns(updated)
      setQuery({ ...query, select: updated })
      setNewColumn('')
    }
  }

  const handleRemoveColumn = (col: string) => {
    const updated = selectedColumns.filter(c => c !== col)
    if (updated.length === 0) {
      setSelectedColumns(['*'])
      setQuery({ ...query, select: ['*'] })
    } else {
      setSelectedColumns(updated)
      setQuery({ ...query, select: updated })
    }
  }

  const handleAddJoin = () => {
    setJoins([...joins, {
      type: 'LEFT',
      table: '',
      leftKey: '',
      rightKey: ''
    }])
  }

  const handleRemoveJoin = (index: number) => {
    setJoins(joins.filter((_, i) => i !== index))
  }

  const handleUpdateJoin = (index: number, field: string, value: string) => {
    const updated = joins.map((join, i) => 
      i === index ? { ...join, [field]: value } : join
    )
    setJoins(updated)
  }

  const handleExecute = () => {
    if (!query.from) {
      alert('Please select a table')
      return
    }

    const finalQuery = {
      ...query,
      select: selectedColumns[0] === '*' ? '*' : selectedColumns,
      joins: joins.length > 0 ? joins.map(j => ({
        type: j.type,
        table: j.table,
        on: { left: j.leftKey, right: j.rightKey }
      })) : undefined
    }

    onExecute(finalQuery)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Query Builder</CardTitle>
        <CardDescription>
          Build SQL-like queries visually
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* FROM Clause */}
        <div className="space-y-2">
          <Label>From Table *</Label>
          <Select 
            value={query.from} 
            onValueChange={(value) => setQuery({ ...query, from: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select table" />
            </SelectTrigger>
            <SelectContent>
              {tables.map(table => (
                <SelectItem key={table} value={table}>{table}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* SELECT Clause */}
        <div className="space-y-2">
          <Label>Select Columns</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Column name (e.g., id, name, COUNT(*))"
              value={newColumn}
              onChange={(e) => setNewColumn(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddColumn()}
            />
            <Button type="button" onClick={handleAddColumn} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedColumns.map((col, idx) => (
              <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                {col}
                <button
                  onClick={() => handleRemoveColumn(col)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* WHERE Clause */}
        <div className="space-y-2">
          <Label>Where (optional)</Label>
          <Textarea
            placeholder="status = 'ACTIVE' AND created_at > '2024-01-01'"
            value={query.where}
            onChange={(e) => setQuery({ ...query, where: e.target.value })}
            rows={2}
          />
        </div>

        {/* GROUP BY */}
        <div className="space-y-2">
          <Label>Group By (optional)</Label>
          <Input
            placeholder="Comma-separated columns: status, department"
            value={query.groupBy.join(', ')}
            onChange={(e) => setQuery({ 
              ...query, 
              groupBy: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
            })}
          />
        </div>

        {/* ORDER BY */}
        <div className="space-y-2">
          <Label>Order By (optional)</Label>
          <Input
            placeholder="column_name DESC"
            value={query.orderBy}
            onChange={(e) => setQuery({ ...query, orderBy: e.target.value })}
          />
        </div>

        {/* LIMIT */}
        <div className="space-y-2">
          <Label>Limit</Label>
          <Input
            type="number"
            value={query.limit}
            onChange={(e) => setQuery({ ...query, limit: parseInt(e.target.value) || 100 })}
            min={1}
            max={10000}
          />
        </div>

        {/* JOINS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Joins (optional)</Label>
            <Button type="button" onClick={handleAddJoin} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Join
            </Button>
          </div>
          {joins.map((join, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Join {index + 1}</span>
                <Button
                  type="button"
                  onClick={() => handleRemoveJoin(index)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={join.type}
                  onValueChange={(value) => handleUpdateJoin(index, 'type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INNER">INNER</SelectItem>
                    <SelectItem value="LEFT">LEFT</SelectItem>
                    <SelectItem value="RIGHT">RIGHT</SelectItem>
                    <SelectItem value="FULL">FULL</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={join.table}
                  onValueChange={(value) => handleUpdateJoin(index, 'table', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map(table => (
                      <SelectItem key={table} value={table}>{table}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Left key (e.g., Project.id)"
                  value={join.leftKey}
                  onChange={(e) => handleUpdateJoin(index, 'leftKey', e.target.value)}
                />
                <Input
                  placeholder="Right key (e.g., User.id)"
                  value={join.rightKey}
                  onChange={(e) => handleUpdateJoin(index, 'rightKey', e.target.value)}
                />
              </div>
            </Card>
          ))}
        </div>

        <Button onClick={handleExecute} className="w-full" size="lg">
          <Play className="h-4 w-4 mr-2" />
          Execute Query
        </Button>
      </CardContent>
    </Card>
  )
}















