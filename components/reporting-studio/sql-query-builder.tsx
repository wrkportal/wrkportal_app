'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus,
  X,
  Play,
  Save,
  Code,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { buildSQLQuery, validateQueryConfig, QueryBuilderConfig, JoinConfig, FilterCondition, OrderByConfig } from '@/lib/reporting-studio/sql-builder'

interface SQLQueryBuilderProps {
  dataSourceId?: string
  onExecute?: (query: string, config: QueryBuilderConfig) => void
  onSave?: (query: string, config: QueryBuilderConfig, name: string) => void
  initialQuery?: string
}

export function SQLQueryBuilder({ dataSourceId, onExecute, onSave, initialQuery }: SQLQueryBuilderProps) {
  const [config, setConfig] = useState<QueryBuilderConfig>({
    select: ['*'],
    from: '',
    joins: [],
    where: [],
    groupBy: [],
    orderBy: [],
    limit: 100,
  })

  const [sqlQuery, setSqlQuery] = useState('')
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['*'])
  const [newColumn, setNewColumn] = useState('')
  const [availableTables, setAvailableTables] = useState<string[]>([])
  const [availableColumns, setAvailableColumns] = useState<Record<string, string[]>>({})
  const [isExecuting, setIsExecuting] = useState(false)
  const [showSQL, setShowSQL] = useState(false)
  const [queryName, setQueryName] = useState('')
  const [dialect, setDialect] = useState<'postgresql' | 'mysql' | 'sqlserver'>('postgresql')

  useEffect(() => {
    if (dataSourceId) {
      fetchTables()
    }
  }, [dataSourceId])

  useEffect(() => {
    if (config.from) {
      fetchColumns(config.from)
    }
  }, [config.from, dataSourceId])

  useEffect(() => {
    // If initialQuery is provided, use it (e.g., from NLQ)
    if (initialQuery && initialQuery.trim()) {
      setSqlQuery(initialQuery)
    } else {
      // Generate SQL from config
      try {
        const sql = buildSQLQuery(config, dialect)
        setSqlQuery(sql)
      } catch (error) {
        console.error('Error generating SQL:', error)
      }
    }
  }, [config, dialect, initialQuery])

  const fetchTables = async () => {
    if (!dataSourceId) return

    try {
      const response = await fetch(`/api/reporting-studio/data-sources/${dataSourceId}/tables`)
      if (response.ok) {
        const data = await response.json()
        setAvailableTables(data.tables?.map((t: any) => t.name) || [])
      }
    } catch (error) {
      console.error('Error fetching tables:', error)
    }
  }

  const fetchColumns = async (tableName: string) => {
    if (!dataSourceId) return

    // For now, we'll use a placeholder - in production, query information_schema
    // This would require an API endpoint to get table columns
    setAvailableColumns((prev) => ({
      ...prev,
      [tableName]: [], // Placeholder - would be populated from actual schema
    }))
  }

  const handleAddColumn = () => {
    if (newColumn.trim() && !selectedColumns.includes(newColumn.trim())) {
      const updated = selectedColumns[0] === '*' 
        ? [newColumn.trim()] 
        : [...selectedColumns, newColumn.trim()]
      setSelectedColumns(updated)
      setConfig({ ...config, select: updated })
      setNewColumn('')
    }
  }

  const handleRemoveColumn = (col: string) => {
    const updated = selectedColumns.filter(c => c !== col)
    if (updated.length === 0) {
      setSelectedColumns(['*'])
      setConfig({ ...config, select: ['*'] })
    } else {
      setSelectedColumns(updated)
      setConfig({ ...config, select: updated })
    }
  }

  const handleAddJoin = () => {
    setConfig({
      ...config,
      joins: [
        ...(config.joins || []),
        {
          type: 'LEFT',
          table: '',
          leftKey: '',
          rightKey: '',
        },
      ],
    })
  }

  const handleRemoveJoin = (index: number) => {
    setConfig({
      ...config,
      joins: config.joins?.filter((_, i) => i !== index) || [],
    })
  }

  const handleUpdateJoin = (index: number, field: keyof JoinConfig, value: any) => {
    setConfig({
      ...config,
      joins: config.joins?.map((join, i) =>
        i === index ? { ...join, [field]: value } : join
      ) || [],
    })
  }

  const handleAddFilter = () => {
    setConfig({
      ...config,
      where: [
        ...(config.where || []),
        {
          column: '',
          operator: 'equals',
          value: '',
        },
      ],
    })
  }

  const handleRemoveFilter = (index: number) => {
    setConfig({
      ...config,
      where: config.where?.filter((_, i) => i !== index) || [],
    })
  }

  const handleUpdateFilter = (index: number, field: keyof FilterCondition, value: any) => {
    setConfig({
      ...config,
      where: config.where?.map((filter, i) =>
        i === index ? { ...filter, [field]: value } : filter
      ) || [],
    })
  }

  const handleAddOrderBy = () => {
    setConfig({
      ...config,
      orderBy: [
        ...(config.orderBy || []),
        {
          column: '',
          direction: 'ASC',
        },
      ],
    })
  }

  const handleRemoveOrderBy = (index: number) => {
    setConfig({
      ...config,
      orderBy: config.orderBy?.filter((_, i) => i !== index) || [],
    })
  }

  const handleUpdateOrderBy = (index: number, field: keyof OrderByConfig, value: any) => {
    setConfig({
      ...config,
      orderBy: config.orderBy?.map((order, i) =>
        i === index ? { ...order, [field]: value } : order
      ) || [],
    })
  }

  const handleExecute = () => {
    const validation = validateQueryConfig(config)
    if (!validation.valid) {
      alert(validation.errors.join('\n'))
      return
    }

    if (onExecute) {
      setIsExecuting(true)
      try {
        onExecute(sqlQuery, config)
      } finally {
        setIsExecuting(false)
      }
    }
  }

  const handleSave = () => {
    if (!queryName.trim()) {
      alert('Please enter a name for the query')
      return
    }

    const validation = validateQueryConfig(config)
    if (!validation.valid) {
      alert(validation.errors.join('\n'))
      return
    }

    if (onSave) {
      onSave(sqlQuery, config, queryName.trim())
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SQL Query Builder</CardTitle>
              <CardDescription>
                Build SQL queries visually or edit SQL directly
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={dialect} onValueChange={(v: any) => setDialect(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="sqlserver">SQL Server</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setShowSQL(!showSQL)}>
                <Code className="h-4 w-4 mr-2" />
                {showSQL ? 'Hide' : 'Show'} SQL
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="visual" className="w-full">
            <TabsList>
              <TabsTrigger value="visual">Visual Builder</TabsTrigger>
              <TabsTrigger value="sql">SQL Editor</TabsTrigger>
            </TabsList>

            <TabsContent value="visual" className="space-y-4">
              {/* FROM Clause */}
              <div className="space-y-2">
                <Label>From Table *</Label>
                <Select
                  value={config.from}
                  onValueChange={(value) => setConfig({ ...config, from: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTables.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* SELECT Columns */}
              <div className="space-y-2">
                <Label>Select Columns</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Column name or expression (e.g., id, name, COUNT(*))"
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

              {/* JOINs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Joins</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddJoin}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Join
                  </Button>
                </div>
                {config.joins && config.joins.length > 0 && (
                  <div className="space-y-2 border rounded-lg p-4">
                    {config.joins.map((join, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <Select
                          value={join.type}
                          onValueChange={(value: any) => handleUpdateJoin(index, 'type', value)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INNER">INNER</SelectItem>
                            <SelectItem value="LEFT">LEFT</SelectItem>
                            <SelectItem value="RIGHT">RIGHT</SelectItem>
                            <SelectItem value="FULL">FULL</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm">JOIN</span>
                        <Input
                          placeholder="Table"
                          value={join.table}
                          onChange={(e) => handleUpdateJoin(index, 'table', e.target.value)}
                          className="flex-1"
                        />
                        <span className="text-sm">ON</span>
                        <Input
                          placeholder="Left key"
                          value={join.leftKey}
                          onChange={(e) => handleUpdateJoin(index, 'leftKey', e.target.value)}
                          className="flex-1"
                        />
                        <span className="text-sm">=</span>
                        <Input
                          placeholder="Right key"
                          value={join.rightKey}
                          onChange={(e) => handleUpdateJoin(index, 'rightKey', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveJoin(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* WHERE Filters */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Where Conditions</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddFilter}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Filter
                  </Button>
                </div>
                {config.where && config.where.length > 0 && (
                  <div className="space-y-2 border rounded-lg p-4">
                    {config.where.map((filter, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        {index > 0 && (
                          <Select
                            value={filter.logicalOperator || 'AND'}
                            onValueChange={(value: any) => handleUpdateFilter(index, 'logicalOperator', value)}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AND">AND</SelectItem>
                              <SelectItem value="OR">OR</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <Input
                          placeholder="Column"
                          value={filter.column}
                          onChange={(e) => handleUpdateFilter(index, 'column', e.target.value)}
                          className="flex-1"
                        />
                        <Select
                          value={filter.operator}
                          onValueChange={(value: any) => handleUpdateFilter(index, 'operator', value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="notEquals">Not Equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="startsWith">Starts With</SelectItem>
                            <SelectItem value="endsWith">Ends With</SelectItem>
                            <SelectItem value="greaterThan">Greater Than</SelectItem>
                            <SelectItem value="lessThan">Less Than</SelectItem>
                            <SelectItem value="greaterThanOrEqual">Greater or Equal</SelectItem>
                            <SelectItem value="lessThanOrEqual">Less or Equal</SelectItem>
                            <SelectItem value="between">Between</SelectItem>
                            <SelectItem value="in">In</SelectItem>
                            <SelectItem value="notIn">Not In</SelectItem>
                            <SelectItem value="isNull">Is Null</SelectItem>
                            <SelectItem value="isNotNull">Is Not Null</SelectItem>
                          </SelectContent>
                        </Select>
                        {!['isNull', 'isNotNull'].includes(filter.operator) && (
                          <Input
                            placeholder="Value"
                            value={filter.value}
                            onChange={(e) => handleUpdateFilter(index, 'value', e.target.value)}
                            className="flex-1"
                          />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFilter(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ORDER BY */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Order By</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddOrderBy}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sort
                  </Button>
                </div>
                {config.orderBy && config.orderBy.length > 0 && (
                  <div className="space-y-2 border rounded-lg p-4">
                    {config.orderBy.map((order, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <Input
                          placeholder="Column"
                          value={order.column}
                          onChange={(e) => handleUpdateOrderBy(index, 'column', e.target.value)}
                          className="flex-1"
                        />
                        <Select
                          value={order.direction}
                          onValueChange={(value: any) => handleUpdateOrderBy(index, 'direction', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ASC">Ascending</SelectItem>
                            <SelectItem value="DESC">Descending</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOrderBy(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LIMIT */}
              <div className="space-y-2">
                <Label>Limit</Label>
                <Input
                  type="number"
                  min="1"
                  value={config.limit || ''}
                  onChange={(e) => setConfig({ ...config, limit: parseInt(e.target.value) || undefined })}
                  className="w-32"
                />
              </div>
            </TabsContent>

            <TabsContent value="sql" className="space-y-4">
              <div className="space-y-2">
                <Label>SQL Query</Label>
                <Textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="font-mono text-sm min-h-[300px]"
                  placeholder="SELECT * FROM table_name WHERE..."
                />
                <p className="text-xs text-muted-foreground">
                  Edit SQL directly. Changes will not sync back to the visual builder.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Generated SQL Preview */}
          {showSQL && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Generated SQL</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(sqlQuery)}
                >
                  Copy SQL
                </Button>
              </div>
              <ScrollArea className="h-32">
                <pre className="text-xs font-mono">{sqlQuery}</pre>
              </ScrollArea>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Query name (for saving)"
                value={queryName}
                onChange={(e) => setQueryName(e.target.value)}
                className="w-48"
              />
              {onSave && (
                <Button variant="outline" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Query
                </Button>
              )}
            </div>
            <Button onClick={handleExecute} disabled={isExecuting || !config.from}>
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Execute Query
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

