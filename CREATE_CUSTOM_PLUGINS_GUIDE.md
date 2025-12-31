# 🔌 Creating Custom Plugins - Complete Guide

## Overview

Plugins allow you to extend the reporting engine with:
- Custom functions
- Custom syntax shortcuts
- Query hooks (before/after processing)
- Business-specific logic

---

## Step 1: Plugin Structure

### Basic Plugin Template

```typescript
// plugins/my-custom-plugin/index.ts
import { Plugin } from '@/lib/reporting-engine/plugin-system'

const plugin: Plugin = {
  name: 'my-custom-plugin',
  version: '1.0.0',
  description: 'My custom business logic',
  enabled: true,

  functions: [
    // Your custom functions here
  ],

  syntax: [
    // Your custom syntax rules here
  ],

  hooks: {
    // Optional hooks
    beforeQuery: (query) => query,
    afterQuery: (results) => results
  }
}

export default plugin
```

---

## Step 2: Create Custom Functions

### Example 1: Simple Calculation Function

```typescript
{
  name: 'CALCULATE_TAX',
  syntax: 'CALCULATE_TAX(amount, taxRate)',
  description: 'Calculate tax on an amount',
  execute: function(amount: number, taxRate: number) {
    return amount * (taxRate / 100)
  },
  returnType: 'number',
  parameters: [
    { name: 'amount', type: 'number', required: true },
    { name: 'taxRate', type: 'number', required: true }
  ],
  category: 'financial',
  examples: [
    'CALCULATE_TAX(1000, 10) → 100',
    'CALCULATE_TAX(total_amount, tax_percentage)'
  ]
}
```

### Example 2: Complex Business Logic

```typescript
{
  name: 'EMPLOYEE_UTILIZATION',
  syntax: 'EMPLOYEE_UTILIZATION(hoursWorked, hoursAllocated)',
  description: 'Calculate employee utilization percentage',
  execute: function(hoursWorked: number, hoursAllocated: number) {
    if (hoursAllocated === 0) return 0
    const utilization = (hoursWorked / hoursAllocated) * 100
    // Cap at 100%
    return Math.min(100, Math.max(0, utilization))
  },
  returnType: 'number',
  parameters: [
    { name: 'hoursWorked', type: 'number', required: true },
    { name: 'hoursAllocated', type: 'number', required: true }
  ],
  category: 'hr',
  examples: [
    'EMPLOYEE_UTILIZATION(160, 200) → 80'
  ]
}
```

### Example 3: String Manipulation

```typescript
{
  name: 'FULL_NAME',
  syntax: 'FULL_NAME(firstName, lastName)',
  description: 'Combine first and last name',
  execute: function(firstName: string, lastName: string) {
    return `${firstName} ${lastName}`.trim()
  },
  returnType: 'string',
  parameters: [
    { name: 'firstName', type: 'string', required: true },
    { name: 'lastName', type: 'string', required: true }
  ],
  category: 'string',
  examples: [
    'FULL_NAME("John", "Doe") → "John Doe"'
  ]
}
```

### Example 4: Date Calculations

```typescript
{
  name: 'DAYS_UNTIL_DEADLINE',
  syntax: 'DAYS_UNTIL_DEADLINE(deadlineDate)',
  description: 'Calculate days until deadline from today',
  execute: function(deadlineDate: Date | string) {
    const deadline = deadlineDate instanceof Date 
      ? deadlineDate 
      : new Date(deadlineDate)
    const today = new Date()
    const diff = deadline.getTime() - today.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  },
  returnType: 'number',
  parameters: [
    { name: 'deadlineDate', type: 'date', required: true }
  ],
  category: 'date',
  examples: [
    'DAYS_UNTIL_DEADLINE("2024-12-31") → 45'
  ]
}
```

---

## Step 3: Define Custom Syntax

### Syntax Rule Structure

```typescript
{
  name: 'rule_name',
  pattern: /REGEX_PATTERN/g,
  transform: 'FUNCTION_NAME($1, $2)',
  description: 'What this syntax does'
}
```

### Example 1: Simple Shortcut

```typescript
{
  name: 'tax_shortcut',
  pattern: /TAX\(([^,]+),\s*([^)]+)\)/g,
  transform: 'CALCULATE_TAX($1, $2)',
  description: 'Shortcut for tax calculation'
}
```

**Usage:**
- Instead of: `CALCULATE_TAX(amount, rate)`
- Use: `TAX(amount, rate)`

### Example 2: Complex Transformation

```typescript
{
  name: 'utilization_shortcut',
  pattern: /UTIL\(([^,]+),\s*([^)]+)\)/g,
  transform: function(match, hoursWorked, hoursAllocated) {
    // Custom transformation logic
    return `EMPLOYEE_UTILIZATION(${hoursWorked}, ${hoursAllocated})`
  },
  description: 'Shortcut for utilization'
}
```

### Example 3: Multiple Patterns

```typescript
syntax: [
  {
    name: 'profit_shortcut',
    pattern: /PROFIT\(([^,]+),\s*([^)]+)\)/g,
    transform: 'PROFIT_MARGIN($1, $2)'
  },
  {
    name: 'roi_shortcut',
    pattern: /ROI_PCT\(([^,]+),\s*([^)]+)\)/g,
    transform: 'ROI($1, $2)'
  },
  {
    name: 'margin_shortcut',
    pattern: /MARGIN\(([^,]+),\s*([^)]+)\)/g,
    transform: 'PROFIT_MARGIN($1, $2)'
  }
]
```

---

## Step 4: Add Query Hooks

### Before Query Hook

Modify queries before execution:

```typescript
hooks: {
  beforeQuery: (query) => {
    // Add default filters
    if (!query.where) {
      query.where = "status = 'ACTIVE'"
    } else {
      query.where = `(${query.where}) AND status = 'ACTIVE'`
    }
    
    // Add default limit if not specified
    if (!query.limit) {
      query.limit = 1000
    }
    
    return query
  }
}
```

### After Query Hook

Process results after execution:

```typescript
hooks: {
  afterQuery: (results) => {
    // Format numbers
    results.rows = results.rows.map(row => 
      row.map((cell: any, index: number) => {
        const column = results.columns[index]
        if (column.includes('amount') || column.includes('price')) {
          return typeof cell === 'number' 
            ? parseFloat(cell.toFixed(2)) 
            : cell
        }
        return cell
      })
    )
    
    // Add metadata
    results.metadata = {
      processedAt: new Date().toISOString(),
      plugin: 'my-custom-plugin'
    }
    
    return results
  }
}
```

---

## Step 5: Complete Plugin Example

```typescript
// plugins/project-analytics/index.ts
import { Plugin } from '@/lib/reporting-engine/plugin-system'

const plugin: Plugin = {
  name: 'project-analytics',
  version: '1.0.0',
  description: 'Project management analytics functions',
  enabled: true,

  functions: [
    {
      name: 'PROJECT_HEALTH',
      syntax: 'PROJECT_HEALTH(completion, budgetVar, timelineVar)',
      description: 'Calculate project health score (0-100)',
      execute: function(completion: number, budgetVar: number, timelineVar: number) {
        let score = completion * 0.5
        
        const budgetScore = Math.max(0, 100 - Math.abs(budgetVar) * 10)
        score += budgetScore * 0.25
        
        const timelineScore = Math.max(0, 100 - Math.abs(timelineVar) * 10)
        score += timelineScore * 0.25
        
        return Math.round(Math.min(100, Math.max(0, score)))
      },
      returnType: 'number',
      parameters: [
        { name: 'completion', type: 'number', required: true },
        { name: 'budgetVar', type: 'number', required: true },
        { name: 'timelineVar', type: 'number', required: true }
      ],
      category: 'project',
      examples: [
        'PROJECT_HEALTH(80, 5, -10) → 75'
      ]
    },
    {
      name: 'BURNDOWN_RATE',
      syntax: 'BURNDOWN_RATE(remaining, daysLeft)',
      description: 'Calculate daily burndown rate',
      execute: function(remaining: number, daysLeft: number) {
        if (daysLeft <= 0) return 0
        return remaining / daysLeft
      },
      returnType: 'number',
      parameters: [
        { name: 'remaining', type: 'number', required: true },
        { name: 'daysLeft', type: 'number', required: true }
      ],
      category: 'project'
    }
  ],

  syntax: [
    {
      name: 'health_shortcut',
      pattern: /HEALTH\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g,
      transform: 'PROJECT_HEALTH($1, $2, $3)',
      description: 'Shortcut for project health'
    },
    {
      name: 'burndown_shortcut',
      pattern: /BURNDOWN\(([^,]+),\s*([^)]+)\)/g,
      transform: 'BURNDOWN_RATE($1, $2)',
      description: 'Shortcut for burndown rate'
    }
  ],

  hooks: {
    beforeQuery: (query) => {
      // Auto-add project filters
      if (query.from === 'Project' && !query.where) {
        query.where = "status IN ('ACTIVE', 'IN_PROGRESS')"
      }
      return query
    },
    afterQuery: (results) => {
      // Format project-related results
      if (results.columns.some(col => col.includes('health'))) {
        results.rows = results.rows.map(row => 
          row.map((cell: any, idx: number) => {
            if (results.columns[idx].includes('health')) {
              // Color code health scores
              const score = Number(cell)
              if (score >= 80) return { value: score, status: 'good' }
              if (score >= 60) return { value: score, status: 'warning' }
              return { value: score, status: 'critical' }
            }
            return cell
          })
        )
      }
      return results
    }
  }
}

export default plugin
```

---

## Step 6: Install Your Plugin

### Method 1: Via API (Runtime)

```javascript
// In browser console or API tool
async function installMyPlugin() {
  const plugin = {
    name: 'project-analytics',
    version: '1.0.0',
    // ... (plugin definition)
  }

  const response = await fetch('/api/reporting-engine/plugins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plugin)
  })

  const result = await response.json()
  console.log('Plugin installed:', result)
}
```

### Method 2: Via File System (Development)

1. Create plugin file: `plugins/my-plugin/index.ts`
2. Import and load on server startup:

```typescript
// app/api/reporting-engine/plugins/load/route.ts
import { getPluginSystem } from '@/lib/reporting-engine/plugin-system'
import myPlugin from '@/plugins/my-plugin'

export async function GET() {
  const pluginSystem = getPluginSystem()
  await pluginSystem.load(myPlugin)
  return Response.json({ success: true })
}
```

---

## Step 7: Test Your Plugin

```javascript
// Test plugin functions
async function testPlugin() {
  // 1. Install plugin
  await installMyPlugin()
  
  // 2. List functions
  const functions = await fetch('/api/reporting-engine/functions')
  const funcs = await functions.json()
  console.log('Available functions:', funcs.functions.map(f => f.name))
  
  // 3. Use in query
  const query = {
    select: [
      'name',
      'PROJECT_HEALTH(completion, budget_variance, timeline_variance) as health'
    ],
    from: 'Project',
    where: "status = 'ACTIVE'"
  }
  
  const result = await fetch('/api/reporting-engine/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  })
  
  console.log('Query result:', await result.json())
}
```

---

## Step 8: Best Practices

### 1. Function Design
- ✅ Keep functions pure (no side effects)
- ✅ Validate all inputs
- ✅ Handle edge cases (division by zero, null values)
- ✅ Return sensible defaults
- ✅ Document with examples

### 2. Syntax Rules
- ✅ Use clear, memorable shortcuts
- ✅ Match common patterns
- ✅ Test regex thoroughly
- ✅ Document transformations

### 3. Hooks
- ✅ Keep hooks fast (don't block)
- ✅ Don't modify queries destructively
- ✅ Handle errors gracefully
- ✅ Log important changes

### 4. Plugin Structure
- ✅ Version your plugins
- ✅ Include descriptions
- ✅ Group related functions
- ✅ Test before deploying

---

## Step 9: Advanced Examples

### Example: Multi-Table Plugin

```typescript
const plugin: Plugin = {
  name: 'cross-table-analytics',
  version: '1.0.0',
  
  functions: [
    {
      name: 'PROJECT_TEAM_SIZE',
      syntax: 'PROJECT_TEAM_SIZE(projectId)',
      description: 'Get team size for a project',
      execute: async function(projectId: string) {
        // This would need to query the database
        // For now, return a placeholder
        return 5
      },
      returnType: 'number',
      parameters: [
        { name: 'projectId', type: 'string', required: true }
      ]
    }
  ],
  
  hooks: {
    beforeQuery: (query) => {
      // Auto-join related tables
      if (query.from === 'Project' && !query.joins) {
        query.joins = [
          {
            type: 'LEFT',
            table: 'Task',
            on: { left: 'Project.id', right: 'Task.projectId' }
          }
        ]
      }
      return query
    }
  }
}
```

---

## Step 10: Deploying Plugins

### Development
- Keep plugins in `plugins/` directory
- Load on server startup
- Hot reload in development

### Production
- Bundle plugins with application
- Load on application start
- Monitor plugin performance
- Version control all plugins

---

## Next Steps

1. ✅ Create your first plugin
2. ✅ Test with sample data
3. ✅ Deploy to development
4. ✅ Get user feedback
5. ✅ Iterate and improve

See `TESTING_GUIDE.md` for testing instructions!















