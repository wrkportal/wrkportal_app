# 🚀 Advanced Reporting Engine - Usage Guide

## Quick Start

### 1. Execute a Query

```typescript
// POST /api/reporting-engine/query
{
  "query": {
    "select": ["project_name", "SUM(budget) as total_budget"],
    "from": "projects",
    "where": "status = 'ACTIVE'",
    "groupBy": ["project_name"],
    "orderBy": "total_budget DESC",
    "limit": 100
  },
  "options": {
    "limit": 1000,
    "offset": 0,
    "cache": true
  }
}
```

### 2. Register a Custom Function

```typescript
// POST /api/reporting-engine/functions
{
  "name": "CUSTOM_METRIC",
  "syntax": "CUSTOM_METRIC(param1, param2)",
  "description": "Calculate custom business metric",
  "execute": "function(param1, param2) { return param1 * param2 / 100; }",
  "returnType": "number",
  "parameters": [
    { "name": "param1", "type": "number", "required": true },
    { "name": "param2", "type": "number", "required": true }
  ],
  "category": "custom"
}
```

### 3. Install a Plugin

```typescript
// POST /api/reporting-engine/plugins
{
  "name": "financial-metrics",
  "version": "1.0.0",
  "description": "Financial calculation functions",
  "functions": [
    {
      "name": "PROFIT_MARGIN",
      "syntax": "PROFIT_MARGIN(revenue, cost)",
      "execute": "function(revenue, cost) { return ((revenue - cost) / revenue) * 100; }",
      "returnType": "number",
      "parameters": [
        { "name": "revenue", "type": "number", "required": true },
        { "name": "cost", "type": "number", "required": true }
      ]
    }
  ],
  "enabled": true
}
```

---

## 📚 Complete Examples

### Example 1: Simple Aggregation Query

```typescript
const query = {
  select: ["department", "SUM(salary) as total_salary", "AVG(salary) as avg_salary"],
  from: "employees",
  where: "status = 'ACTIVE'",
  groupBy: ["department"],
  orderBy: "total_salary DESC",
  limit: 10
}

// Execute
const response = await fetch('/api/reporting-engine/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query })
})

const result = await response.json()
// {
//   columns: ["department", "total_salary", "avg_salary"],
//   rows: [["Engineering", 500000, 100000], ...],
//   rowCount: 10,
//   executionTime: 45,
//   cached: false
// }
```

### Example 2: Complex Query with Joins

```typescript
const query = {
  select: [
    "p.name as project_name",
    "u.name as manager_name",
    "COUNT(t.id) as task_count",
    "SUM(t.estimated_hours) as total_hours"
  ],
  from: "projects",
  joins: [
    {
      type: "LEFT",
      table: "users",
      on: { left: "projects.manager_id", right: "users.id" }
    },
    {
      type: "LEFT",
      table: "tasks",
      on: { left: "projects.id", right: "tasks.project_id" }
    }
  ],
  where: "projects.status = 'ACTIVE'",
  groupBy: ["p.name", "u.name"],
  orderBy: "task_count DESC",
  limit: 50
}
```

### Example 3: Using Custom Functions

```typescript
// First, register a custom function
await fetch('/api/reporting-engine/functions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "REVENUE_PER_EMPLOYEE",
    syntax: "REVENUE_PER_EMPLOYEE(revenue, employees)",
    description: "Calculate revenue per employee",
    execute: "function(revenue, employees) { return employees > 0 ? revenue / employees : 0; }",
    returnType: "number",
    parameters: [
      { name: "revenue", type: "number", required: true },
      { name: "employees", type: "number", required: true }
    ],
    category: "business"
  })
})

// Then use it in a query
const query = {
  select: [
    "department",
    "REVENUE_PER_EMPLOYEE(SUM(revenue), COUNT(employee_id)) as rev_per_emp"
  ],
  from: "sales",
  groupBy: ["department"]
}
```

### Example 4: Creating a Plugin

```typescript
// plugins/my-custom-plugin/index.ts
import { Plugin } from '@/lib/reporting-engine/plugin-system'

const plugin: Plugin = {
  name: 'my-custom-plugin',
  version: '1.0.0',
  description: 'My custom business logic',
  
  functions: [
    {
      name: 'MY_CUSTOM_FUNCTION',
      syntax: 'MY_CUSTOM_FUNCTION(value)',
      description: 'My custom calculation',
      execute: (value: number) => {
        // Your custom logic
        return value * 1.2
      },
      returnType: 'number',
      parameters: [
        { name: 'value', type: 'number', required: true }
      ]
    }
  ],
  
  syntax: [
    {
      name: 'my_shortcut',
      pattern: /MY_SHORTCUT\(([^)]+)\)/g,
      transform: 'MY_CUSTOM_FUNCTION($1)',
      description: 'Shortcut syntax'
    }
  ],
  
  hooks: {
    beforeQuery: (query) => {
      // Modify query before execution
      return query
    },
    afterQuery: (results) => {
      // Process results after execution
      return results
    }
  }
}

export default plugin
```

### Example 5: Loading a Plugin

```typescript
// Load plugin from file
import plugin from '@/plugins/my-custom-plugin'

await fetch('/api/reporting-engine/plugins', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(plugin)
})

// Or load dynamically
const pluginCode = await import('@/plugins/my-custom-plugin')
await fetch('/api/reporting-engine/plugins', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(pluginCode.default)
})
```

---

## 🔧 API Reference

### Query Endpoint

**POST** `/api/reporting-engine/query`

**Request Body**:
```typescript
{
  query: Query,
  options?: QueryOptions
}
```

**Response**:
```typescript
{
  columns: string[],
  rows: any[][],
  rowCount: number,
  executionTime: number,
  cached: boolean
}
```

### Functions Endpoint

**GET** `/api/reporting-engine/functions`
- List all functions
- Query params: `?category=financial`

**POST** `/api/reporting-engine/functions`
- Register a custom function

**GET** `/api/reporting-engine/functions/:name`
- Get function details

**PUT** `/api/reporting-engine/functions/:name`
- Update function

**DELETE** `/api/reporting-engine/functions/:name`
- Remove function

### Plugins Endpoint

**GET** `/api/reporting-engine/plugins`
- List all plugins

**POST** `/api/reporting-engine/plugins`
- Install plugin

**GET** `/api/reporting-engine/plugins/:name`
- Get plugin details

**DELETE** `/api/reporting-engine/plugins/:name`
- Uninstall plugin

**POST** `/api/reporting-engine/plugins/:name`
- Enable/disable plugin
- Body: `{ "action": "enable" | "disable" }`

---

## 💡 Best Practices

### 1. Query Optimization

- **Use LIMIT**: Always specify a limit to avoid loading too much data
- **Select Specific Columns**: Don't use `SELECT *` - select only needed columns
- **Use Indexes**: Ensure WHERE clauses use indexed columns
- **Filter Early**: Apply WHERE filters before JOINs when possible

### 2. Custom Functions

- **Keep Functions Simple**: Complex logic should be in plugins
- **Validate Inputs**: Always validate function parameters
- **Handle Errors**: Return sensible defaults for edge cases
- **Document Well**: Provide clear descriptions and examples

### 3. Plugins

- **Version Your Plugins**: Use semantic versioning
- **Test Thoroughly**: Test plugins before deploying
- **Handle Errors**: Wrap plugin code in try-catch
- **Keep Dependencies Minimal**: Avoid heavy dependencies

### 4. Performance

- **Use Caching**: Enable caching for frequently used queries
- **Paginate Results**: Use LIMIT and OFFSET for large datasets
- **Optimize Queries**: Review query execution plans
- **Monitor Performance**: Track execution times

---

## 🎯 Common Use Cases

### 1. Financial Reporting

```typescript
// Calculate profit margins by department
{
  select: [
    "department",
    "SUM(revenue) as total_revenue",
    "SUM(cost) as total_cost",
    "PROFIT_MARGIN(SUM(revenue), SUM(cost)) as margin"
  ],
  from: "sales",
  groupBy: ["department"],
  orderBy: "margin DESC"
}
```

### 2. Project Analytics

```typescript
// Project performance metrics
{
  select: [
    "p.name as project",
    "COUNT(t.id) as tasks",
    "SUM(t.estimated_hours) as estimated",
    "SUM(t.actual_hours) as actual",
    "AVG(t.completion_percentage) as avg_completion"
  ],
  from: "projects",
  joins: [{
    type: "LEFT",
    table: "tasks",
    on: { left: "projects.id", right: "tasks.project_id" }
  }],
  where: "p.status = 'ACTIVE'",
  groupBy: ["p.name"]
}
```

### 3. User Analytics

```typescript
// User productivity metrics
{
  select: [
    "u.name as user",
    "COUNT(t.id) as tasks_completed",
    "SUM(t.actual_hours) as hours_logged",
    "AVG(t.rating) as avg_rating"
  ],
  from: "users",
  joins: [{
    type: "LEFT",
    table: "tasks",
    on: { left: "users.id", right: "tasks.assigned_to_id" }
  }],
  where: "t.status = 'COMPLETED' AND t.completed_at >= CURRENT_DATE - INTERVAL '30 days'",
  groupBy: ["u.name"],
  orderBy: "tasks_completed DESC"
}
```

---

## 🔒 Security Considerations

1. **Input Validation**: All queries are validated before execution
2. **SQL Injection Prevention**: Parameterized queries prevent SQL injection
3. **Tenant Isolation**: All queries automatically filter by tenant
4. **Access Control**: Only admins can register functions/plugins
5. **Resource Limits**: Queries have timeout and row limits

---

## 🐛 Troubleshooting

### Query Fails

- Check query syntax
- Verify table/column names exist
- Check tenant permissions
- Review error message details

### Function Not Found

- Verify function is registered
- Check function name spelling
- Ensure plugin is enabled (if custom function)

### Performance Issues

- Add LIMIT to queries
- Use indexes on WHERE columns
- Enable caching
- Review query execution plan

---

## 📖 Next Steps

1. Review the architecture document: `ADVANCED_REPORTING_ENGINE_ARCHITECTURE.md`
2. Try the example plugin: `plugins/example-financial-metrics/index.ts`
3. Create your own custom functions
4. Build plugins for your business logic
5. Integrate with your UI components

---

## 🎉 You're Ready!

You now have a powerful, extensible reporting engine that can:
- Handle millions of rows
- Execute complex queries
- Support custom functions
- Extend with plugins
- Transform custom syntax

Start building your custom reporting solutions! 🚀















