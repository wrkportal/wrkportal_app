# Desktop App Implementation & Custom Formula Language

## Part 1: Building Native Desktop App in Your Current Structure

### Current Architecture Analysis

**Your Current Stack:**
- Next.js (React)
- TypeScript
- Prisma (Database)
- API Routes
- Vercel/Server deployment

**What We Need:**
- Electron wrapper for desktop
- Local DuckDB integration
- Offline storage
- Sync mechanism

---

### Implementation Approach

#### Option 1: Electron + Next.js (Recommended)

**Structure:**
```
project-root/
├── app/                    # Next.js app (existing)
├── components/             # React components (existing)
├── lib/                    # Utilities (existing)
├── electron/               # NEW: Electron main process
│   ├── main.js
│   ├── preload.js
│   └── local-db.js
├── desktop/                # NEW: Desktop-specific code
│   ├── sync-manager.ts
│   ├── offline-storage.ts
│   └── local-duckdb.ts
├── public/                  # Static assets (existing)
├── package.json            # Updated with Electron
└── electron-builder.config.js  # NEW: Build config
```

---

### Step-by-Step Implementation

#### Step 1: Install Dependencies

**What you need to share:**
- Your current `package.json`
- Your project structure (folder layout)

**I'll help you add:**

```json
{
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1",
    "@types/node": "^20.0.0"
  },
  "dependencies": {
    "duckdb": "^0.10.0",
    "electron-store": "^8.1.0",
    "better-sqlite3": "^9.2.0"
  },
  "scripts": {
    "electron:dev": "electron .",
    "electron:build": "electron-builder",
    "desktop": "next build && electron ."
  }
}
```

---

#### Step 2: Create Electron Main Process

**File: `electron/main.js`**

**What I need from you:**
- Your current API routes structure
- How authentication works
- Database connection details

**I'll create:**

```javascript
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const duckdb = require('duckdb')

let mainWindow
let nextProcess
let localDB

// Initialize local DuckDB
function initLocalDB() {
  const dbPath = path.join(app.getPath('userData'), 'local-data.db')
  localDB = new duckdb.Database(dbPath)
  console.log('Local DuckDB initialized at:', dbPath)
}

// Start Next.js dev server (for development)
function startNextDev() {
  nextProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..'),
    shell: true
  })
  
  nextProcess.stdout.on('data', (data) => {
    console.log(`Next.js: ${data}`)
  })
}

// Create Electron window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Load Next.js app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
    startNextDev()
  } else {
    // In production, serve built Next.js app
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'))
  }
}

// Initialize when ready
app.whenReady().then(() => {
  initLocalDB()
  createWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers for local database operations
ipcMain.handle('local-db:query', async (event, query, params = []) => {
  return new Promise((resolve, reject) => {
    localDB.all(query, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
})

ipcMain.handle('local-db:load-file', async (event, filePath) => {
  return new Promise((resolve, reject) => {
    // Load CSV/Excel into local DuckDB
    const query = `
      CREATE TABLE IF NOT EXISTS imported_data AS 
      SELECT * FROM read_csv_auto('${filePath}')
    `
    localDB.run(query, (err) => {
      if (err) reject(err)
      else resolve({ success: true })
    })
  })
})

ipcMain.handle('local-db:save-report', async (event, reportData) => {
  const fs = require('fs').promises
  const reportPath = path.join(
    app.getPath('userData'),
    'reports',
    `${reportData.id}.rptx`
  )
  
  // Ensure directory exists
  await fs.mkdir(path.dirname(reportPath), { recursive: true })
  
  // Save compressed report
  const compressed = JSON.stringify(reportData)
  await fs.writeFile(reportPath, compressed, 'utf-8')
  
  return { success: true, path: reportPath }
})

ipcMain.handle('local-db:load-report', async (event, reportId) => {
  const fs = require('fs').promises
  const reportPath = path.join(
    app.getPath('userData'),
    'reports',
    `${reportId}.rptx`
  )
  
  const data = await fs.readFile(reportPath, 'utf-8')
  return JSON.parse(data)
})
```

---

#### Step 3: Create Preload Script

**File: `electron/preload.js`**

```javascript
const { contextBridge, ipcRenderer } = require('electron')

// Expose safe API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Local database operations
  queryLocalDB: (query, params) => 
    ipcRenderer.invoke('local-db:query', query, params),
  
  loadFile: (filePath) => 
    ipcRenderer.invoke('local-db:load-file', filePath),
  
  saveReport: (reportData) => 
    ipcRenderer.invoke('local-db:save-report', reportData),
  
  loadReport: (reportId) => 
    ipcRenderer.invoke('local-db:load-report', reportId),
  
  // System info
  getAppPath: () => 
    ipcRenderer.invoke('app:get-path'),
  
  // Sync operations
  syncToCloud: (data) => 
    ipcRenderer.invoke('sync:to-cloud', data),
  
  syncFromCloud: () => 
    ipcRenderer.invoke('sync:from-cloud'),
  
  // Online status
  isOnline: () => navigator.onLine
})
```

---

#### Step 4: Update Your React Components

**File: `lib/desktop-api.ts`**

**What I need:**
- Your current API structure
- How you handle data fetching

**I'll create:**

```typescript
// Desktop API wrapper
export class DesktopAPI {
  private isElectron: boolean
  
  constructor() {
    this.isElectron = typeof window !== 'undefined' && 
                      'electronAPI' in window
  }
  
  // Query data (works offline)
  async query(query: string, params: any[] = []) {
    if (this.isElectron) {
      // Use local DuckDB
      return await (window as any).electronAPI.queryLocalDB(query, params)
    } else {
      // Use web API
      const response = await fetch('/api/query', {
        method: 'POST',
        body: JSON.stringify({ query, params })
      })
      return await response.json()
    }
  }
  
  // Load file
  async loadFile(filePath: string) {
    if (this.isElectron) {
      return await (window as any).electronAPI.loadFile(filePath)
    } else {
      // Web: upload file
      const formData = new FormData()
      formData.append('file', filePath)
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      return await response.json()
    }
  }
  
  // Save report
  async saveReport(report: any) {
    if (this.isElectron) {
      return await (window as any).electronAPI.saveReport(report)
    } else {
      const response = await fetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify(report)
      })
      return await response.json()
    }
  }
  
  // Sync to cloud (when online)
  async syncToCloud() {
    if (!this.isElectron) return
    
    const isOnline = await (window as any).electronAPI.isOnline()
    if (!isOnline) {
      throw new Error('Need internet connection to sync')
    }
    
    // Get local changes
    const localChanges = await this.getLocalChanges()
    
    // Upload to cloud
    return await (window as any).electronAPI.syncToCloud(localChanges)
  }
}

export const desktopAPI = new DesktopAPI()
```

---

#### Step 5: Update Your Components

**Example: `components/reporting/DataTable.tsx`**

**What I need:**
- Your current component structure
- How you currently fetch data

**I'll update:**

```typescript
import { desktopAPI } from '@/lib/desktop-api'
import { useState, useEffect } from 'react'

export function DataTable({ fileId }: { fileId: string }) {
  const [data, setData] = useState([])
  const [isOffline, setIsOffline] = useState(false)
  
  useEffect(() => {
    loadData()
    
    // Check online status
    setIsOffline(!navigator.onLine)
    window.addEventListener('online', () => setIsOffline(false))
    window.addEventListener('offline', () => setIsOffline(true))
  }, [fileId])
  
  async function loadData() {
    try {
      // Works both online and offline
      const result = await desktopAPI.query(`
        SELECT * FROM imported_data
        LIMIT 1000
      `)
      setData(result)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }
  
  return (
    <div>
      {isOffline && (
        <div className="bg-yellow-100 p-2">
          Working Offline - Changes will sync when online
        </div>
      )}
      {/* Your table component */}
    </div>
  )
}
```

---

### What You Need to Share With Me

**To build the desktop app, I need:**

1. **Project Structure:**
   ```
   - Your current folder structure
   - Key files (package.json, tsconfig.json)
   - How your app is organized
   ```

2. **API Routes:**
   ```
   - List of your API routes
   - How authentication works
   - Database connection details
   ```

3. **Data Flow:**
   ```
   - How you currently load data
   - Where calculations happen
   - How reports are saved
   ```

4. **Components:**
   ```
   - Key components that need offline support
   - How data is displayed
   - User interactions
   ```

**I'll create:**
- Electron main process files
- Preload scripts
- Desktop API wrapper
- Updated components
- Build configuration
- Installation instructions

---

## Part 2: Formula Language & Calculations

### How Calculations Work with DuckDB

#### Current System (Client-Side JavaScript)

**Your current approach:**
```typescript
// Client-side calculation
const sum = data.reduce((acc, row) => acc + row.amount, 0)
const avg = sum / data.length
```

**Problems:**
- Slow for large datasets
- Limited to browser memory
- No advanced functions

---

#### With DuckDB (Server-Side SQL)

**DuckDB approach:**
```typescript
// Fast SQL aggregation
const result = await db.query(`
  SELECT 
    SUM(amount) as total,
    AVG(amount) as average,
    COUNT(*) as count,
    MAX(amount) as maximum,
    MIN(amount) as minimum
  FROM data
`)
```

**Benefits:**
- ✅ Fast (columnar processing)
- ✅ Handles billions of rows
- ✅ Standard SQL functions

---

### Creating Your Own Formula Language (Like DAX but Different)

#### Custom Formula Language: "DataFlow" (Example Name)

**Design Goals:**
- Different syntax from DAX
- More intuitive
- Excel-like but better
- Unique to your platform

---

#### Language Design

**1. Basic Functions**

```typescript
// Your custom syntax (different from DAX)
interface DataFlowFunction {
  name: string
  syntax: string
  description: string
  implementation: (args: any[]) => string // SQL translation
}

const DATAFLOW_FUNCTIONS: DataFlowFunction[] = [
  {
    name: 'TOTAL',
    syntax: 'TOTAL(column)',
    description: 'Sum of all values in column',
    implementation: (args) => `SUM(${args[0]})`
  },
  {
    name: 'MEAN',
    syntax: 'MEAN(column)',
    description: 'Average of values',
    implementation: (args) => `AVG(${args[0]})`
  },
  {
    name: 'COUNT',
    syntax: 'COUNT(column)',
    description: 'Count of non-null values',
    implementation: (args) => `COUNT(${args[0]})`
  },
  {
    name: 'MAXIMUM',
    syntax: 'MAXIMUM(column)',
    description: 'Maximum value',
    implementation: (args) => `MAX(${args[0]})`
  },
  {
    name: 'MINIMUM',
    syntax: 'MINIMUM(column)',
    description: 'Minimum value',
    implementation: (args) => `MIN(${args[0]})`
  }
]
```

---

#### Advanced Functions (Your Unique Syntax)

```typescript
// Time-based functions (different from DAX)
{
  name: 'PERIOD_TOTAL',
  syntax: 'PERIOD_TOTAL(column, period)',
  description: 'Total for specific time period',
  implementation: (args) => {
    const [column, period] = args
    return `
      SUM(CASE 
        WHEN date_trunc('${period}', date_column) = date_trunc('${period}', CURRENT_DATE)
        THEN ${column} 
        ELSE 0 
      END)
    `
  }
},

// Conditional aggregation (unique syntax)
{
  name: 'IF_SUM',
  syntax: 'IF_SUM(condition, column)',
  description: 'Sum if condition is true',
  implementation: (args) => {
    const [condition, column] = args
    return `SUM(CASE WHEN ${condition} THEN ${column} ELSE 0 END)`
  }
},

// Percentage calculations (intuitive)
{
  name: 'PERCENT_OF',
  syntax: 'PERCENT_OF(value, total)',
  description: 'Calculate percentage',
  implementation: (args) => {
    const [value, total] = args
    return `(${value} * 100.0) / NULLIF(${total}, 0)`
  }
},

// Growth calculations
{
  name: 'GROWTH',
  syntax: 'GROWTH(current, previous)',
  description: 'Calculate growth percentage',
  implementation: (args) => {
    const [current, previous] = args
    return `((${current} - ${previous}) * 100.0) / NULLIF(${previous}, 0)`
  }
}
```

---

#### Formula Parser

**File: `lib/formula-parser.ts`**

```typescript
// Parse your custom formula language
export class DataFlowParser {
  private functions: Map<string, DataFlowFunction>
  
  constructor() {
    this.functions = new Map(
      DATAFLOW_FUNCTIONS.map(f => [f.name, f])
    )
  }
  
  // Parse formula to SQL
  parse(formula: string): string {
    // Remove whitespace
    formula = formula.trim()
    
    // Check if it's a function call
    const functionMatch = formula.match(/^(\w+)\((.*)\)$/)
    if (!functionMatch) {
      // Simple column reference
      return formula
    }
    
    const [, functionName, argsString] = functionMatch
    
    // Get function definition
    const func = this.functions.get(functionName.toUpperCase())
    if (!func) {
      throw new Error(`Unknown function: ${functionName}`)
    }
    
    // Parse arguments
    const args = this.parseArguments(argsString)
    
    // Generate SQL
    return func.implementation(args)
  }
  
  // Parse function arguments
  private parseArguments(argsString: string): string[] {
    const args: string[] = []
    let current = ''
    let depth = 0
    
    for (const char of argsString) {
      if (char === '(') depth++
      else if (char === ')') depth--
      else if (char === ',' && depth === 0) {
        args.push(current.trim())
        current = ''
        continue
      }
      current += char
    }
    
    if (current.trim()) {
      args.push(current.trim())
    }
    
    return args
  }
}

// Example usage
const parser = new DataFlowParser()

// Your syntax
parser.parse('TOTAL(amount)')
// → SQL: SUM(amount)

parser.parse('IF_SUM(category = "A", amount)')
// → SQL: SUM(CASE WHEN category = 'A' THEN amount ELSE 0 END)

parser.parse('PERCENT_OF(profit, revenue)')
// → SQL: (profit * 100.0) / NULLIF(revenue, 0)
```

---

#### Formula Builder UI

**File: `components/formula-builder.tsx`**

```typescript
import { useState } from 'react'
import { DataFlowParser } from '@/lib/formula-parser'

export function FormulaBuilder({ onFormulaChange }: {
  onFormulaChange: (formula: string, sql: string) => void
}) {
  const [formula, setFormula] = useState('')
  const [sql, setSql] = useState('')
  const parser = new DataFlowParser()
  
  function handleFormulaChange(value: string) {
    setFormula(value)
    
    try {
      const generatedSQL = parser.parse(value)
      setSql(generatedSQL)
      onFormulaChange(value, generatedSQL)
    } catch (error) {
      setSql(`Error: ${error.message}`)
    }
  }
  
  return (
    <div className="formula-builder">
      <div className="mb-4">
        <label>DataFlow Formula</label>
        <input
          type="text"
          value={formula}
          onChange={(e) => handleFormulaChange(e.target.value)}
          placeholder="TOTAL(amount)"
          className="w-full p-2 border rounded"
        />
        <div className="text-sm text-gray-500 mt-1">
          Your custom formula syntax
        </div>
      </div>
      
      <div className="mb-4">
        <label>Generated SQL</label>
        <div className="p-2 bg-gray-100 rounded text-sm font-mono">
          {sql || 'Enter a formula...'}
        </div>
      </div>
      
      <div className="function-list">
        <h3>Available Functions</h3>
        <ul>
          <li><code>TOTAL(column)</code> - Sum of values</li>
          <li><code>MEAN(column)</code> - Average</li>
          <li><code>IF_SUM(condition, column)</code> - Conditional sum</li>
          <li><code>PERCENT_OF(value, total)</code> - Percentage</li>
          <li><code>GROWTH(current, previous)</code> - Growth rate</li>
        </ul>
      </div>
    </div>
  )
}
```

---

#### Integration with DuckDB

**File: `lib/query-builder.ts`**

```typescript
import { DataFlowParser } from './formula-parser'
import { desktopAPI } from './desktop-api'

export class QueryBuilder {
  private parser: DataFlowParser
  
  constructor() {
    this.parser = new DataFlowParser()
  }
  
  // Build query from your formula
  async executeFormula(
    formula: string,
    table: string,
    groupBy?: string[]
  ) {
    // Parse formula to SQL
    const sqlExpression = this.parser.parse(formula)
    
    // Build full SQL query
    let query = `SELECT `
    
    if (groupBy && groupBy.length > 0) {
      query += `${groupBy.join(', ')}, `
    }
    
    query += `${sqlExpression} as result FROM ${table}`
    
    if (groupBy && groupBy.length > 0) {
      query += ` GROUP BY ${groupBy.join(', ')}`
    }
    
    // Execute (works offline with local DuckDB)
    return await desktopAPI.query(query)
  }
}

// Example usage
const builder = new QueryBuilder()

// Your custom formula
const result = await builder.executeFormula(
  'TOTAL(amount)',        // Your syntax
  'sales_data',
  ['category']           // Group by category
)

// Generates and executes:
// SELECT category, SUM(amount) as result 
// FROM sales_data 
// GROUP BY category
```

---

### Formula Language Comparison

| Feature | Power BI (DAX) | Your System (DataFlow) |
|---------|---------------|------------------------|
| **Syntax** | `SUM(Table[Column])` | `TOTAL(column)` |
| **Conditional** | `CALCULATE(SUM(...), FILTER(...))` | `IF_SUM(condition, column)` |
| **Time Intelligence** | `TOTALYTD(...)` | `PERIOD_TOTAL(column, 'year')` |
| **Percentage** | `DIVIDE(A, B) * 100` | `PERCENT_OF(A, B)` |
| **Growth** | `(A - B) / B` | `GROWTH(A, B)` |

**Your advantages:**
- ✅ More intuitive syntax
- ✅ Shorter formulas
- ✅ Different from Power BI (unique)
- ✅ Excel-like but better

---

## Implementation Checklist

### Desktop App
- [ ] Share your project structure
- [ ] Share API routes
- [ ] I'll create Electron files
- [ ] I'll update components
- [ ] I'll create build config

### Formula Language
- [ ] Define function names (your choice)
- [ ] I'll create parser
- [ ] I'll create UI components
- [ ] I'll integrate with DuckDB

---

## What to Share With Me

**For Desktop App:**
1. Your `package.json`
2. Folder structure (screenshot or list)
3. Key API routes (list)
4. How authentication works
5. Database schema (if relevant)

**For Formula Language:**
1. Preferred function names (or I'll suggest)
2. Syntax preferences
3. Common calculations you need

**I'll create:**
- Complete Electron setup
- Desktop API wrapper
- Updated components
- Formula parser
- Formula builder UI
- Integration code
- Build instructions

Ready to start? Share your project structure and I'll begin implementation!

