# 🎨 UI Integration Guide - Reporting Engine

## Overview

This guide shows how to integrate the advanced reporting engine with your UI components.

---

## Step 1: Create Query Builder Component

### Basic Query Builder

```typescript
// components/reporting-engine/query-builder.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface QueryBuilderProps {
  onExecute: (query: any) => void
  tables?: string[]
}

export function QueryBuilder({ onExecute, tables = [] }: QueryBuilderProps) {
  const [query, setQuery] = useState({
    select: ['*'],
    from: '',
    where: '',
    groupBy: [],
    orderBy: '',
    limit: 100
  })

  const handleExecute = () => {
    onExecute(query)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Query Builder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* FROM Clause */}
        <div>
          <label className="text-sm font-medium">From Table</label>
          <Select value={query.from} onValueChange={(value) => setQuery({ ...query, from: value })}>
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
        <div>
          <label className="text-sm font-medium">Select Columns</label>
          <Input
            placeholder="id, name, email or * for all"
            value={Array.isArray(query.select) ? query.select.join(', ') : query.select}
            onChange={(e) => {
              const value = e.target.value.trim()
              setQuery({
                ...query,
                select: value === '*' ? '*' : value.split(',').map(s => s.trim())
              })
            }}
          />
        </div>

        {/* WHERE Clause */}
        <div>
          <label className="text-sm font-medium">Where (optional)</label>
          <Input
            placeholder="status = 'ACTIVE'"
            value={query.where}
            onChange={(e) => setQuery({ ...query, where: e.target.value })}
          />
        </div>

        {/* LIMIT */}
        <div>
          <label className="text-sm font-medium">Limit</label>
          <Input
            type="number"
            value={query.limit}
            onChange={(e) => setQuery({ ...query, limit: parseInt(e.target.value) || 100 })}
          />
        </div>

        <Button onClick={handleExecute} className="w-full">
          Execute Query
        </Button>
      </CardContent>
    </Card>
  )
}
```

---

## Step 2: Create Function Selector Component

```typescript
// components/reporting-engine/function-selector.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Function {
  name: string
  syntax: string
  description: string
  category?: string
  parameters: Array<{ name: string; type: string; required: boolean }>
}

export function FunctionSelector({ onSelect }: { onSelect: (func: Function) => void }) {
  const [functions, setFunctions] = useState<Function[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadFunctions()
  }, [])

  const loadFunctions = async () => {
    try {
      const response = await fetch('/api/reporting-engine/functions')
      const data = await response.json()
      setFunctions(data.functions || [])
      
      // Extract categories
      const cats = [...new Set(data.functions.map((f: Function) => f.category || 'uncategorized'))]
      setCategories(cats)
    } catch (error) {
      console.error('Failed to load functions:', error)
    }
  }

  const filteredFunctions = functions.filter(f => {
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
                         f.description.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Functions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <Input
          placeholder="Search functions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Function List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredFunctions.map(func => (
            <div
              key={func.name}
              className="p-3 border rounded-lg hover:bg-muted cursor-pointer"
              onClick={() => onSelect(func)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{func.name}</div>
                  <div className="text-sm text-muted-foreground">{func.description}</div>
                  <code className="text-xs mt-1 block">{func.syntax}</code>
                </div>
                {func.category && (
                  <Badge variant="outline">{func.category}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## Step 3: Create Query Results Component

```typescript
// components/reporting-engine/query-results.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface QueryResult {
  columns: string[]
  rows: any[][]
  rowCount: number
  executionTime: number
  cached: boolean
}

export function QueryResults({ result }: { result: QueryResult | null }) {
  if (!result) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Execute a query to see results
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Query Results</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">
              {result.rowCount} rows
            </Badge>
            <Badge variant="outline">
              {result.executionTime}ms
            </Badge>
            {result.cached && (
              <Badge variant="secondary">Cached</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {result.columns.map((col, idx) => (
                  <TableHead key={idx}>{col}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.rows.slice(0, 100).map((row, rowIdx) => (
                <TableRow key={rowIdx}>
                  {row.map((cell, cellIdx) => (
                    <TableCell key={cellIdx}>
                      {typeof cell === 'object' ? JSON.stringify(cell) : String(cell)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {result.rows.length > 100 && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing first 100 of {result.rowCount} rows
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## Step 4: Create Main Reporting Engine Page

```typescript
// app/reporting-engine/page.tsx
'use client'

import { useState } from 'react'
import { QueryBuilder } from '@/components/reporting-engine/query-builder'
import { FunctionSelector } from '@/components/reporting-engine/function-selector'
import { QueryResults } from '@/components/reporting-engine/query-results'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'

export default function ReportingEnginePage() {
  const [queryResult, setQueryResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableTables = [
    'User',
    'Project',
    'Task',
    'Timesheet',
    'OKR',
    'Program'
  ]

  const handleExecuteQuery = async (query: any) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/reporting-engine/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Query failed')
      }

      const result = await response.json()
      setQueryResult(result)
    } catch (err: any) {
      setError(err.message)
      console.error('Query error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectFunction = (func: any) => {
    // Insert function into query builder
    // This would integrate with your query builder
    console.log('Selected function:', func)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Advanced Reporting Engine</h1>
        <p className="text-muted-foreground">
          Build and execute queries with custom functions
        </p>
      </div>

      <Tabs defaultValue="query" className="space-y-4">
        <TabsList>
          <TabsTrigger value="query">Query Builder</TabsTrigger>
          <TabsTrigger value="functions">Functions</TabsTrigger>
          <TabsTrigger value="plugins">Plugins</TabsTrigger>
        </TabsList>

        <TabsContent value="query" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <QueryBuilder
                onExecute={handleExecuteQuery}
                tables={availableTables}
              />
            </div>
            <div className="lg:col-span-2">
              {loading && (
                <Card>
                  <CardContent className="p-8 text-center">
                    Executing query...
                  </CardContent>
                </Card>
              )}
              {error && (
                <Card>
                  <CardContent className="p-8 text-center text-destructive">
                    Error: {error}
                  </CardContent>
                </Card>
              )}
              {!loading && !error && (
                <QueryResults result={queryResult} />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="functions">
          <FunctionSelector onSelect={handleSelectFunction} />
        </TabsContent>

        <TabsContent value="plugins">
          <PluginsManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## Step 5: Create Plugins Manager Component

```typescript
// components/reporting-engine/plugins-manager.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

interface Plugin {
  name: string
  version: string
  description?: string
  enabled?: boolean
}

export function PluginsManager() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlugins()
  }, [])

  const loadPlugins = async () => {
    try {
      const response = await fetch('/api/reporting-engine/plugins')
      const data = await response.json()
      setPlugins(data.plugins || [])
    } catch (error) {
      console.error('Failed to load plugins:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePlugin = async (pluginName: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/reporting-engine/plugins/${pluginName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: enabled ? 'enable' : 'disable' })
      })

      if (response.ok) {
        loadPlugins() // Reload list
      }
    } catch (error) {
      console.error('Failed to toggle plugin:', error)
    }
  }

  if (loading) {
    return <div>Loading plugins...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Plugins</h2>
        <Button>Install Plugin</Button>
      </div>

      <div className="grid gap-4">
        {plugins.map(plugin => (
          <Card key={plugin.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{plugin.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    v{plugin.version}
                  </p>
                  {plugin.description && (
                    <p className="text-sm mt-2">{plugin.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={plugin.enabled ? 'default' : 'secondary'}>
                    {plugin.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <Switch
                    checked={plugin.enabled}
                    onCheckedChange={(checked) => togglePlugin(plugin.name, checked)}
                  />
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

---

## Step 6: Update Existing Reporting Studio

### Integrate with Database Page

```typescript
// app/reporting-studio/database/page.tsx
// Add this to your existing page

import { QueryBuilder } from '@/components/reporting-engine/query-builder'

// In your component:
const handleAdvancedQuery = async (query: any) => {
  try {
    const response = await fetch('/api/reporting-engine/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    })
    
    const result = await response.json()
    // Use result in your existing table view
    setTableData({
      columns: result.columns,
      rows: result.rows
    })
  } catch (error) {
    console.error('Query failed:', error)
  }
}

// Add QueryBuilder to your UI
<QueryBuilder onExecute={handleAdvancedQuery} tables={availableTables} />
```

---

## Step 7: Add Function Autocomplete

```typescript
// components/reporting-engine/function-autocomplete.tsx
'use client'

import { useState, useEffect } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'

export function FunctionAutocomplete({ onSelect }: { onSelect: (func: string) => void }) {
  const [functions, setFunctions] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch('/api/reporting-engine/functions')
      .then(res => res.json())
      .then(data => setFunctions(data.functions || []))
  }, [])

  return (
    <Command>
      <CommandInput placeholder="Search functions..." />
      <CommandList>
        <CommandEmpty>No functions found.</CommandEmpty>
        <CommandGroup heading="Functions">
          {functions.map(func => (
            <CommandItem
              key={func.name}
              value={func.name}
              onSelect={() => {
                onSelect(func.syntax)
                setOpen(false)
              }}
            >
              <div>
                <div className="font-semibold">{func.name}</div>
                <div className="text-xs text-muted-foreground">{func.description}</div>
                <code className="text-xs">{func.syntax}</code>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
```

---

## Step 8: Add to Sidebar Navigation

```typescript
// components/layout/sidebar.tsx
// Add to your navigation items:

{
  title: 'Advanced Reporting',
  href: '/reporting-engine',
  icon: BarChart3,
  children: [
    {
      title: 'Query Builder',
      href: '/reporting-engine',
    },
    {
      title: 'Functions',
      href: '/reporting-engine?tab=functions',
    },
    {
      title: 'Plugins',
      href: '/reporting-engine?tab=plugins',
    },
  ]
}
```

---

## Step 9: Testing the Integration

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to:** `http://localhost:3000/reporting-engine`

3. **Test Query Builder:**
   - Select a table
   - Enter columns
   - Add WHERE clause
   - Execute query
   - View results

4. **Test Functions:**
   - Browse available functions
   - Search by name/description
   - Filter by category
   - Select function to use

5. **Test Plugins:**
   - View installed plugins
   - Enable/disable plugins
   - Install new plugins

---

## Step 10: Production Considerations

### Error Handling
- Add try-catch blocks
- Show user-friendly error messages
- Log errors for debugging

### Loading States
- Show loading indicators
- Disable buttons during execution
- Show progress for long queries

### Performance
- Implement query result pagination
- Cache frequently used queries
- Debounce search inputs
- Virtualize large result tables

### Security
- Validate all user inputs
- Sanitize query parameters
- Check user permissions
- Rate limit API calls

---

## Next Steps

1. ✅ Test all components
2. ✅ Add error handling
3. ✅ Improve UI/UX
4. ✅ Add more features
5. ✅ Deploy to production

See `TESTING_GUIDE.md` and `CREATE_CUSTOM_PLUGINS_GUIDE.md` for more details!















