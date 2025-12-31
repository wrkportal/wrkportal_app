# 🧪 Testing Guide - Advanced Reporting Engine

## Prerequisites

1. **Start your development server:**

   ```bash
   npm run dev
   ```

2. **Make sure you're logged in** to the application

3. **Open browser DevTools** (F12) to see API responses

---

## 1. Test Query Execution

### Step 1: Open Browser Console

1. Go to `http://localhost:3000`
2. Press `F12` to open DevTools
3. Go to the **Console** tab

### Step 2: Execute a Simple Query

Copy and paste this into the console:

```javascript
// Test 1: Simple aggregation query
async function testQuery() {
  try {
    const response = await fetch('/api/reporting-engine/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          select: ['id', 'name', 'email'],
          from: 'User',
          where: "status = 'ACTIVE'",
          limit: 10,
        },
        options: {
          limit: 10,
          cache: true,
        },
      }),
    })

    const result = await response.json()
    console.log('✅ Query Result:', result)
    console.log('Columns:', result.columns)
    console.log('Rows:', result.rows)
    console.log('Row Count:', result.rowCount)
    console.log('Execution Time:', result.executionTime, 'ms')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testQuery()
```

### Step 3: Test Aggregation Query

```javascript
// Test 2: Aggregation with GROUP BY
async function testAggregation() {
  try {
    const response = await fetch('/api/reporting-engine/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          select: [
            'status',
            'COUNT(id) as project_count',
            'SUM(budget) as total_budget',
          ],
          from: 'Project',
          where: 'status IS NOT NULL',
          groupBy: ['status'],
          orderBy: 'total_budget DESC',
          limit: 20,
        },
      }),
    })

    const result = await response.json()
    console.log('✅ Aggregation Result:', result)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testAggregation()
```

### Step 4: Test with Joins

```javascript
// Test 3: Query with JOIN
async function testJoin() {
  try {
    const response = await fetch('/api/reporting-engine/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          select: [
            'p.name as project_name',
            'u.name as manager_name',
            'COUNT(t.id) as task_count',
          ],
          from: 'Project',
          joins: [
            {
              type: 'LEFT',
              table: 'User',
              on: { left: 'Project.managerId', right: 'User.id' },
            },
            {
              type: 'LEFT',
              table: 'Task',
              on: { left: 'Project.id', right: 'Task.projectId' },
            },
          ],
          where: "p.status = 'ACTIVE'",
          groupBy: ['p.name', 'u.name'],
          limit: 50,
        },
      }),
    })

    const result = await response.json()
    console.log('✅ Join Result:', result)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testJoin()
```

---

## 2. Register a Custom Function

### Step 1: Create a Simple Custom Function

```javascript
// Test: Register custom function
async function registerCustomFunction() {
  try {
    const response = await fetch('/api/reporting-engine/functions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'DOUBLE_VALUE',
        syntax: 'DOUBLE_VALUE(number)',
        description: 'Double a numeric value',
        execute: function (value) {
          return value * 2
        },
        returnType: 'number',
        parameters: [
          {
            name: 'value',
            type: 'number',
            required: true,
            description: 'Number to double',
          },
        ],
        category: 'mathematical',
        examples: ['DOUBLE_VALUE(5) → 10', 'DOUBLE_VALUE(budget)'],
      }),
    })

    const result = await response.json()
    console.log('✅ Function Registered:', result)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

registerCustomFunction()
```

### Step 2: List All Functions

```javascript
// Test: List all functions
async function listFunctions() {
  try {
    const response = await fetch('/api/reporting-engine/functions')
    const result = await response.json()
    console.log('✅ All Functions:', result.functions)
    console.log('Total:', result.functions.length)

    // Group by category
    const byCategory = {}
    result.functions.forEach((fn) => {
      const cat = fn.category || 'uncategorized'
      if (!byCategory[cat]) byCategory[cat] = []
      byCategory[cat].push(fn.name)
    })
    console.log('By Category:', byCategory)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

listFunctions()
```

### Step 3: Get Function Details

```javascript
// Test: Get function details
async function getFunctionDetails() {
  try {
    const response = await fetch('/api/reporting-engine/functions/DOUBLE_VALUE')
    const result = await response.json()
    console.log('✅ Function Details:', result.function)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

getFunctionDetails()
```

### Step 4: Test Business Logic Function

```javascript
// Test: Register business-specific function
async function registerBusinessFunction() {
  try {
    const response = await fetch('/api/reporting-engine/functions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'PROJECT_HEALTH_SCORE',
        syntax:
          'PROJECT_HEALTH_SCORE(completion, budget_variance, timeline_variance)',
        description: 'Calculate project health score (0-100)',
        execute: function (completion, budgetVar, timelineVar) {
          // Health score calculation
          let score = completion * 0.5 // 50% weight on completion

          // Budget variance (lower is better)
          const budgetScore = Math.max(0, 100 - Math.abs(budgetVar) * 10)
          score += budgetScore * 0.25 // 25% weight

          // Timeline variance (lower is better)
          const timelineScore = Math.max(0, 100 - Math.abs(timelineVar) * 10)
          score += timelineScore * 0.25 // 25% weight

          return Math.round(Math.min(100, Math.max(0, score)))
        },
        returnType: 'number',
        parameters: [
          { name: 'completion', type: 'number', required: true },
          { name: 'budget_variance', type: 'number', required: true },
          { name: 'timeline_variance', type: 'number', required: true },
        ],
        category: 'business',
        examples: ['PROJECT_HEALTH_SCORE(80, 5, -10) → 75'],
      }),
    })

    const result = await response.json()
    console.log('✅ Business Function Registered:', result)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

registerBusinessFunction()
```

---

## 3. Install the Example Plugin

### Step 1: Load the Example Plugin

First, you need to import the plugin. Create a test file or use the browser console:

```javascript
// Test: Install example plugin
async function installExamplePlugin() {
  try {
    // Import the plugin (you'll need to adjust the path)
    // In a real scenario, you'd load this from the server
    const plugin = {
      name: 'financial-metrics',
      version: '1.0.0',
      description: 'Financial calculation functions and shortcuts',
      enabled: true,
      functions: [
        {
          name: 'PROFIT_MARGIN',
          syntax: 'PROFIT_MARGIN(revenue, cost)',
          description: 'Calculate profit margin percentage',
          execute: function (revenue, cost) {
            if (revenue === 0) return 0
            return ((revenue - cost) / revenue) * 100
          },
          returnType: 'number',
          parameters: [
            { name: 'revenue', type: 'number', required: true },
            { name: 'cost', type: 'number', required: true },
          ],
          category: 'financial',
          examples: ['PROFIT_MARGIN(1000, 700) → 30'],
        },
        {
          name: 'ROI',
          syntax: 'ROI(investment, return)',
          description: 'Calculate Return on Investment',
          execute: function (investment, returnValue) {
            if (investment === 0) return 0
            return ((returnValue - investment) / investment) * 100
          },
          returnType: 'number',
          parameters: [
            { name: 'investment', type: 'number', required: true },
            { name: 'return', type: 'number', required: true },
          ],
          category: 'financial',
        },
      ],
      syntax: [
        {
          name: 'profit_margin_shortcut',
          pattern: 'MARGIN\\(([^,]+),\\s*([^)]+)\\)',
          transform: 'PROFIT_MARGIN($1, $2)',
          description: 'Shortcut for profit margin',
        },
      ],
    }

    const response = await fetch('/api/reporting-engine/plugins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(plugin),
    })

    const result = await response.json()
    console.log('✅ Plugin Installed:', result)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

installExamplePlugin()
```

### Step 2: List Installed Plugins

```javascript
// Test: List plugins
async function listPlugins() {
  try {
    const response = await fetch('/api/reporting-engine/plugins')
    const result = await response.json()
    console.log('✅ Installed Plugins:', result.plugins)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

listPlugins()
```

### Step 3: Get Plugin Details

```javascript
// Test: Get plugin details
async function getPluginDetails() {
  try {
    const response = await fetch(
      '/api/reporting-engine/plugins/financial-metrics'
    )
    const result = await response.json()
    console.log('✅ Plugin Details:', result.plugin)
    console.log(
      'Functions:',
      result.plugin.functions?.map((f) => f.name)
    )
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

getPluginDetails()
```

### Step 4: Enable/Disable Plugin

```javascript
// Test: Disable plugin
async function disablePlugin() {
  try {
    const response = await fetch(
      '/api/reporting-engine/plugins/financial-metrics',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'disable' }),
      }
    )

    const result = await response.json()
    console.log('✅ Plugin Disabled:', result)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Test: Enable plugin
async function enablePlugin() {
  try {
    const response = await fetch(
      '/api/reporting-engine/plugins/financial-metrics',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'enable' }),
      }
    )

    const result = await response.json()
    console.log('✅ Plugin Enabled:', result)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// disablePlugin()
// enablePlugin()
```

---

## 4. Complete Test Suite

Run all tests at once:

```javascript
// Complete test suite
async function runAllTests() {
  console.log('🧪 Starting Test Suite...\n')

  // Test 1: Query
  console.log('1️⃣ Testing Query Execution...')
  await testQuery()
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Test 2: Functions
  console.log('\n2️⃣ Testing Function Registration...')
  await registerCustomFunction()
  await listFunctions()
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Test 3: Plugins
  console.log('\n3️⃣ Testing Plugin Installation...')
  await installExamplePlugin()
  await listPlugins()
  await new Promise((resolve) => setTimeout(resolve, 1000))

  console.log('\n✅ All tests completed!')
}

// Uncomment to run:
// runAllTests()
```

---

## 5. Using Postman/Thunder Client

If you prefer using API tools:

### Postman Collection

1. **Create a new Collection**: "Reporting Engine API"

2. **Add Environment Variables**:

   - `baseUrl`: `http://localhost:3000`
   - `token`: (your auth token if needed)

3. **Create Requests**:

   **Query Request:**

   - Method: `POST`
   - URL: `{{baseUrl}}/api/reporting-engine/query`
   - Body (JSON):

   ```json
   {
     "query": {
       "select": ["id", "name"],
       "from": "User",
       "limit": 10
     }
   }
   ```

   **Register Function:**

   - Method: `POST`
   - URL: `{{baseUrl}}/api/reporting-engine/functions`
   - Body: (use the function JSON from above)

   **Install Plugin:**

   - Method: `POST`
   - URL: `{{baseUrl}}/api/reporting-engine/plugins`
   - Body: (use the plugin JSON from above)

---

## 6. Troubleshooting

### Error: "Unauthorized"

- Make sure you're logged in
- Check your session cookie

### Error: "Function already exists"

- Delete the function first:
  ```javascript
  await fetch('/api/reporting-engine/functions/DOUBLE_VALUE', {
    method: 'DELETE',
  })
  ```

### Error: "Query execution failed"

- Check table/column names exist
- Verify SQL syntax
- Check tenant permissions

### Error: "Plugin already loaded"

- Unload first:
  ```javascript
  await fetch('/api/reporting-engine/plugins/financial-metrics', {
    method: 'DELETE',
  })
  ```

---

## 7. Next Steps

After testing:

1. ✅ Create custom plugins (see next guide)
2. ✅ Integrate with UI (see UI integration guide)
3. ✅ Build production queries
4. ✅ Monitor performance














