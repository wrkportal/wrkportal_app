# Enterprise Self-Service Reporting System - Comprehensive Architecture Plan

## Executive Summary

This document outlines a comprehensive, enterprise-grade self-service reporting system designed to eliminate the need for external tools like Excel or Power BI. The system will provide users with advanced data visualization, query building, data transformation, and report generation capabilities while maintaining strict security and role-based access control.

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer (Next.js/React)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Report       │  │ Query        │  │ Visualization │      │
│  │ Builder      │  │ Builder      │  │ Studio       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Query API    │  │ Security     │  │ Cache        │      │
│  │              │  │ Filter       │  │ Manager      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Data Processing & Query Engine                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ SQL Builder  │  │ ETL Engine   │  │ Data Cleaner │      │
│  │              │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Storage Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PostgreSQL   │  │ DuckDB        │  │ Redis Cache  │      │
│  │ (OLTP)       │  │ (OLAP/Analytics)│              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Core Components

1. **Visual Query Builder** - Drag-and-drop interface for building queries
2. **Data Transformation Engine** - Clean, merge, aggregate data
3. **Visualization Engine** - Create charts, graphs, tables
4. **Report Builder** - Combine queries and visualizations into reports
5. **Security & Access Control** - Row-level and column-level security
6. **Data Catalog** - Metadata management and data discovery
7. **Scheduling & Distribution** - Automated report generation and delivery

---

## 2. Data Architecture

### 2.1 Data Storage Strategy

#### Primary Database (PostgreSQL - OLTP)

- **Purpose**: Transactional data storage (current Prisma schema)
- **Tables**: All existing functional area tables (sales, operations, IT, finance, projects, etc.)
- **Access**: Direct read access for real-time queries

#### Analytics Database (DuckDB - OLAP)

- **Purpose**: Fast analytical queries, aggregations, and data transformations
- **Why DuckDB**:
  - In-process analytical database (no separate server needed)
  - Extremely fast for analytical workloads
  - SQL-compatible
  - Already in dependencies
  - Supports columnar storage
- **Data Flow**:
  - Periodic sync from PostgreSQL (ETL jobs)
  - Materialized views for common aggregations
  - Pre-computed metrics for dashboards

#### Cache Layer (Redis)

- **Purpose**: Query result caching, session management
- **Cache Strategy**:
  - Query results cached for 5-15 minutes (configurable)
  - Invalidate on data updates
  - Cache key includes user ID + role + query hash

### 2.2 Data Model for Reporting System

```prisma
// Reporting System Tables (add to schema.prisma)

model Report {
  id            String   @id @default(cuid())
  name          String
  description   String?
  createdById   String
  createdBy     User     @relation("ReportCreator", fields: [createdById], references: [id])
  workspaceId   String?
  workspace     Workspace? @relation(fields: [workspaceId], references: [id])

  // Report Configuration
  config        Json     // Report structure, queries, visualizations
  isPublic      Boolean  @default(false)
  isTemplate    Boolean  @default(false)

  // Access Control
  sharedWith    ReportShare[]
  permissions   ReportPermission[]

  // Scheduling
  schedule      ReportSchedule?

  // Metadata
  tags          String[]
  category      String?  // sales, operations, finance, etc.
  version       Int      @default(1)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([createdById])
  @@index([workspaceId])
  @@index([category])
}

model ReportShare {
  id          String   @id @default(cuid())
  reportId    String
  report      Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  roleId      String?  // For role-based sharing
  permission  String   // VIEW, EDIT, ADMIN
  createdAt   DateTime @default(now())

  @@unique([reportId, userId])
  @@index([reportId])
  @@index([userId])
}

model ReportPermission {
  id          String   @id @default(cuid())
  reportId    String
  report      Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  userRole    String?  // UserRole enum
  groupRole   String?  // GroupRole enum
  permission  String   // VIEW, EDIT, ADMIN
  createdAt   DateTime @default(now())

  @@index([reportId])
}

model ReportSchedule {
  id          String   @id @default(cuid())
  reportId    String   @unique
  report      Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  frequency   String   // DAILY, WEEKLY, MONTHLY, CUSTOM
  cronExpression String?
  recipients  String[] // Email addresses or user IDs
  format      String   // PDF, EXCEL, CSV, HTML
  timezone    String   @default("UTC")
  enabled     Boolean  @default(true)
  lastRun     DateTime?
  nextRun     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model DataSource {
  id            String   @id @default(cuid())
  name          String
  description   String?
  type          String   // DATABASE_TABLE, API, FILE, CUSTOM_QUERY
  connection    Json     // Connection details (encrypted)
  schema        Json?    // Table/field metadata
  workspaceId   String?
  workspace     Workspace? @relation(fields: [workspaceId], references: [id])

  // Access Control
  accessibleBy  DataSourceAccess[]

  // Metadata
  lastSynced    DateTime?
  syncFrequency String?  // REAL_TIME, HOURLY, DAILY
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([workspaceId])
  @@index([type])
}

model DataSourceAccess {
  id          String     @id @default(cuid())
  dataSourceId String
  dataSource  DataSource @relation(fields: [dataSourceId], references: [id], onDelete: Cascade)
  userId      String?
  user        User?      @relation(fields: [userId], references: [id])
  userRole    String?    // UserRole enum
  permission  String     // READ, WRITE
  createdAt   DateTime   @default(now())

  @@unique([dataSourceId, userId])
  @@index([dataSourceId])
}

model Query {
  id            String   @id @default(cuid())
  name          String
  description   String?
  dataSourceId  String
  dataSource    DataSource @relation(fields: [dataSourceId], references: [id])

  // Query Definition
  sql           String?  // Raw SQL (for advanced users)
  queryBuilder  Json?    // Visual query builder JSON
  parameters    Json?    // Parameter definitions

  // Results & Cache
  cachedResult  Json?
  cacheExpiry   DateTime?

  // Metadata
  executionTime Int?     // milliseconds
  rowCount      Int?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([dataSourceId])
}

model DataTransformation {
  id            String   @id @default(cuid())
  name          String
  description   String?
  queryId       String
  query         Query    @relation(fields: [queryId], references: [id])

  // Transformation Steps
  steps         Json     // Array of transformation operations
  // Example: [
  //   { type: 'FILTER', condition: 'status = "active"' },
  //   { type: 'GROUP_BY', fields: ['category'] },
  //   { type: 'AGGREGATE', function: 'SUM', field: 'amount' },
  //   { type: 'SORT', field: 'amount', order: 'DESC' }
  // ]

  outputSchema  Json?    // Result schema
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([queryId])
}

model Visualization {
  id            String   @id @default(cuid())
  name          String
  type          String   // CHART, TABLE, KPI, MAP, etc.
  queryId       String
  query         Query    @relation(fields: [queryId], references: [id])

  // Visualization Config
  config        Json     // Chart config, colors, axes, etc.
  // Example: {
  //   chartType: 'bar',
  //   xAxis: 'category',
  //   yAxis: 'amount',
  //   colors: ['#3b82f6', '#10b981'],
  //   showLegend: true
  // }

  // Layout
  width         Int?
  height        Int?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([queryId])
  @@index([type])
}

model ReportExecution {
  id            String   @id @default(cuid())
  reportId      String
  report        Report   @relation(fields: [reportId], references: [id])
  executedBy   String
  executedByUser User   @relation(fields: [executedBy], references: [id])

  // Execution Details
  status        String   // PENDING, RUNNING, COMPLETED, FAILED
  startedAt     DateTime @default(now())
  completedAt   DateTime?
  executionTime Int?     // milliseconds

  // Results
  resultUrl     String?  // URL to generated report
  errorMessage  String?

  @@index([reportId])
  @@index([executedBy])
  @@index([status])
}
```

---

## 3. Security & Access Control

### 3.1 Multi-Layer Security Model

#### Layer 1: Role-Based Access Control (RBAC)

- **User Roles**: Platform Owner, Tenant Admin, Org Admin, PMO Lead, Project Manager, Team Member, etc.
- **Functional Access**: Sales, Operations, IT, Finance, Projects, Recruitment
- **Permission Levels**:
  - `VIEW` - Can view reports
  - `CREATE` - Can create own reports
  - `EDIT` - Can edit shared reports
  - `ADMIN` - Full control over reports
  - `EXPORT` - Can export data

#### Layer 2: Row-Level Security (RLS)

- **Implementation**: SQL WHERE clauses automatically injected based on user context
- **Examples**:
  - Sales users only see their own leads/opportunities
  - Project managers see only their projects
  - Finance users see all financial data but filtered by organization
- **Dynamic Filters**:
  ```sql
  -- Automatically injected based on user role
  WHERE (
    -- User's own data
    created_by_id = :userId
    OR
    -- Data user has access to via team membership
    project_id IN (SELECT project_id FROM project_members WHERE user_id = :userId)
    OR
    -- Organization-level access
    (user_role = 'ORG_ADMIN' AND organization_id = :orgId)
  )
  ```

#### Layer 3: Column-Level Security

- **Sensitive Fields**: Hide/mask sensitive columns based on role
- **Examples**:
  - Salary data: Only HR and Finance roles
  - Personal information: Only admins
  - Financial details: Only Finance roles
- **Implementation**: Column-level permissions in query builder

#### Layer 4: Data Source Access Control

- Each data source has explicit access rules
- Users can only query data sources they have access to
- Cross-functional data access requires explicit permission

### 3.2 Shared Data Strategy

**Question**: Should users with single functional access share raw data with users having multiple functional access?

**Answer**: **YES, with proper security controls**

**Implementation**:

1. **Unified Data Catalog**: All functional data sources are discoverable
2. **Access Request System**: Users can request access to additional data sources
3. **Automatic Merging**: When user has access to multiple sources, queries can join across them
4. **Security Filters**: Always applied, regardless of data source combination

**Example Scenario**:

- User A: Sales role only → Can query Sales data
- User B: Sales + Finance roles → Can query Sales + Finance data, can create cross-functional reports
- User C: All roles → Can query all data, create enterprise-wide reports

**Data Merging Rules**:

- Users can only merge data sources they have access to
- Security filters are applied to each data source independently
- Result set respects the most restrictive permission

---

## 4. Visual Query Builder

### 4.1 Interface Design

```
┌─────────────────────────────────────────────────────────┐
│  Visual Query Builder                                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Data        │  │ Join        │  │ Filter      │     │
│  │ Sources     │  │ Builder     │  │ Builder     │     │
│  │             │  │             │  │             │     │
│  │ [Sales]     │  │ Sales ──┐   │  │ Status =    │     │
│  │ [Finance]   │  │         │   │  │ "Active"     │     │
│  │ [Projects]  │  │ Finance ┘   │  │             │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Group By    │  │ Aggregate   │  │ Sort        │     │
│  │             │  │             │  │             │     │
│  │ Category    │  │ SUM(Amount) │  │ Amount DESC │     │
│  │ Region      │  │ COUNT(*)    │  │             │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ SQL Preview                                        │  │
│  │ SELECT category, SUM(amount) as total             │  │
│  │ FROM sales_opportunities                           │  │
│  │ WHERE status = 'ACTIVE'                           │  │
│  │ GROUP BY category                                 │  │
│  │ ORDER BY total DESC                               │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  [Test Query]  [Save Query]  [Create Visualization]      │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Query Builder Features

1. **Data Source Selection**

   - Browse available data sources
   - Search by name, category, tags
   - Preview schema and sample data
   - See access permissions

2. **Join Builder**

   - Visual join interface (drag-and-drop)
   - Support for INNER, LEFT, RIGHT, FULL OUTER joins
   - Automatic join suggestions based on foreign keys
   - Join condition builder

3. **Filter Builder**

   - Visual filter interface
   - Support for: =, !=, >, <, >=, <=, IN, NOT IN, LIKE, BETWEEN, IS NULL
   - Date range picker
   - Multi-select dropdowns
   - Parameterized filters (user input at runtime)

4. **Group By & Aggregation**

   - Drag fields to group by
   - Aggregate functions: SUM, COUNT, AVG, MIN, MAX, COUNT DISTINCT
   - Custom expressions

5. **Sort & Limit**

   - Multi-column sorting
   - Limit results
   - Pagination support

6. **SQL Mode**
   - Advanced users can write raw SQL
   - SQL validation and security checks
   - Parameter injection protection
   - Query explanation and optimization hints

---

## 5. Data Transformation Engine

### 5.1 Transformation Operations

1. **Data Cleaning**

   - Remove duplicates
   - Handle nulls (fill, remove, default)
   - Trim whitespace
   - Standardize formats (dates, numbers, text)
   - Remove outliers

2. **Data Merging**

   - Join multiple data sources
   - Union/concatenate datasets
   - Merge on keys
   - Handle conflicts (first, last, average, etc.)

3. **Data Enrichment**

   - Add calculated columns
   - Lookup values from reference tables
   - Add date/time dimensions
   - Geocoding (if applicable)

4. **Aggregation**

   - Group by multiple fields
   - Multiple aggregation functions
   - Window functions (running totals, rankings)
   - Pivot/unpivot

5. **Filtering**
   - Row-level filters
   - Top N / Bottom N
   - Conditional filtering

### 5.2 Transformation Pipeline

```typescript
interface TransformationStep {
  id: string
  type:
    | 'FILTER'
    | 'GROUP_BY'
    | 'AGGREGATE'
    | 'JOIN'
    | 'CLEAN'
    | 'ENRICH'
    | 'SORT'
  config: Record<string, any>
  order: number
}

// Example Transformation Pipeline
const pipeline: TransformationStep[] = [
  {
    id: '1',
    type: 'FILTER',
    config: { field: 'status', operator: '=', value: 'ACTIVE' },
    order: 1,
  },
  {
    id: '2',
    type: 'CLEAN',
    config: {
      operations: [
        { type: 'REMOVE_DUPLICATES', fields: ['id'] },
        { type: 'FILL_NULLS', field: 'amount', value: 0 },
      ],
    },
    order: 2,
  },
  {
    id: '3',
    type: 'JOIN',
    config: {
      source: 'finance_invoices',
      joinType: 'LEFT',
      on: { left: 'opportunity_id', right: 'id' },
    },
    order: 3,
  },
  {
    id: '4',
    type: 'GROUP_BY',
    config: { fields: ['category', 'region'] },
    order: 4,
  },
  {
    id: '5',
    type: 'AGGREGATE',
    config: {
      functions: [
        { field: 'amount', function: 'SUM', alias: 'total_amount' },
        { field: 'id', function: 'COUNT', alias: 'count' },
      ],
    },
    order: 5,
  },
  {
    id: '6',
    type: 'SORT',
    config: { field: 'total_amount', order: 'DESC' },
    order: 6,
  },
]
```

### 5.3 Implementation with DuckDB

```typescript
import { Database } from 'duckdb'

async function executeTransformation(
  sourceData: any[],
  steps: TransformationStep[]
): Promise<any[]> {
  const db = new Database(':memory:')
  const conn = db.connect()

  // Load source data into DuckDB
  await conn.query(
    `
    CREATE TABLE source_data AS 
    SELECT * FROM read_json_auto(?)
  `,
    [JSON.stringify(sourceData)]
  )

  // Execute each transformation step
  let currentTable = 'source_data'
  for (const step of steps.sort((a, b) => a.order - b.order)) {
    const sql = buildTransformationSQL(step, currentTable)
    const tempTable = `temp_${step.id}`
    await conn.query(`CREATE TABLE ${tempTable} AS ${sql}`)
    currentTable = tempTable
  }

  // Return final result
  const result = await conn.query(`SELECT * FROM ${currentTable}`)
  conn.close()
  db.close()

  return result.toArray()
}
```

---

## 6. Visualization Engine

### 6.1 Supported Chart Types

1. **Basic Charts**

   - Bar Chart (vertical, horizontal, stacked, grouped)
   - Line Chart (single, multi-series, area)
   - Pie/Donut Chart
   - Scatter Plot
   - Bubble Chart

2. **Advanced Charts**

   - Heatmap
   - Treemap
   - Sankey Diagram
   - Gantt Chart
   - Waterfall Chart
   - Funnel Chart
   - Radar/Spider Chart

3. **Tables**

   - Data Table (sortable, filterable, paginated)
   - Pivot Table
   - Cross-tabulation

4. **KPIs & Metrics**

   - Single KPI card
   - KPI grid
   - Sparklines
   - Gauge/Progress indicators

5. **Maps** (if geospatial data available)
   - Choropleth maps
   - Point maps
   - Heat maps

### 6.2 Visualization Library

**Primary Choice: Apache ECharts (via echarts-for-react)**

**Why ECharts?**

- Enterprise-grade, highly customizable
- Extensive chart types
- Excellent performance
- Active development
- Good documentation
- Can be embedded in React

**Alternative/Complementary:**

- **Recharts** (already in dependencies) - For simpler charts
- **D3.js** (already in dependencies) - For custom visualizations
- **Plotly.js** - For advanced statistical charts

### 6.3 Visualization Builder Interface

```
┌─────────────────────────────────────────────────────────┐
│  Visualization Builder                                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Chart Type: [Bar Chart ▼]                              │
│                                                           │
│  ┌─────────────────┐  ┌─────────────────┐            │
│  │ Data Mapping     │  │ Chart Options    │            │
│  │                  │  │                  │            │
│  │ X-Axis:          │  │ Title:           │            │
│  │ [category ▼]     │  │ [Sales by...]    │            │
│  │                  │  │                  │            │
│  │ Y-Axis:          │  │ Colors:          │            │
│  │ [amount ▼]       │  │ [Blue, Green]    │            │
│  │                  │  │                  │            │
│  │ Series:          │  │ Legend: [✓] Show │            │
│  │ [region ▼]       │  │                  │            │
│  │                  │  │ Stack: [ ]       │            │
│  └─────────────────┘  └─────────────────┘            │
│                                                           │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Preview                                             │ │
│  │                                                     │ │
│  │     [Bar Chart Preview]                            │ │
│  │                                                     │ │
│  └───────────────────────────────────────────────────┘ │
│                                                           │
│  [Save]  [Add to Report]  [Export]                       │
└─────────────────────────────────────────────────────────┘
```

### 6.4 Visualization Configuration Schema

```typescript
interface VisualizationConfig {
  type: string
  title?: string
  data: {
    source: string // Query ID
    xAxis?: string | string[]
    yAxis?: string | string[]
    series?: string[]
    values?: string[]
  }
  style: {
    colors?: string[]
    showLegend?: boolean
    showGrid?: boolean
    showLabels?: boolean
    stacked?: boolean
    // ... other style options
  }
  layout: {
    width?: number
    height?: number
    responsive?: boolean
  }
  interactions: {
    tooltip?: boolean
    zoom?: boolean
    brush?: boolean
    drillDown?: boolean
  }
}
```

---

## 7. Report Builder

### 7.1 Report Structure

A report consists of:

1. **Header** - Title, description, filters, date range
2. **Sections** - Multiple sections with different visualizations
3. **Footer** - Metadata, export options, sharing

### 7.2 Report Builder Interface

```
┌─────────────────────────────────────────────────────────┐
│  Report Builder                                          │
├─────────────────────────────────────────────────────────┤
│  Report Name: [Sales Performance Q4 2024]                │
│                                                           │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Report Canvas (Drag & Drop)                       │ │
│  │                                                     │ │
│  │  ┌─────────────────────────────────────────────┐  │ │
│  │  │ [KPI Card] Total Revenue: $1.2M            │  │ │
│  │  └─────────────────────────────────────────────┘  │ │
│  │                                                     │ │
│  │  ┌─────────────────────────────────────────────┐  │ │
│  │  │ [Bar Chart] Sales by Region                │  │ │
│  │  │     [Chart visualization]                   │  │ │
│  │  └─────────────────────────────────────────────┘  │ │
│  │                                                     │ │
│  │  ┌─────────────────────────────────────────────┐  │ │
│  │  │ [Table] Top 10 Opportunities                │  │ │
│  │  │     [Data table]                           │  │ │
│  │  └─────────────────────────────────────────────┘  │ │
│  │                                                     │ │
│  └───────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Add KPI     │  │ Add Chart   │  │ Add Table   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                           │
│  [Save]  [Preview]  [Schedule]  [Share]  [Export]       │
└─────────────────────────────────────────────────────────┘
```

### 7.3 Report Configuration Schema

```typescript
interface ReportConfig {
  id: string
  name: string
  description?: string
  sections: ReportSection[]
  filters?: ReportFilter[]
  layout: {
    columns: number
    spacing: number
  }
  theme?: {
    colors: string[]
    font?: string
  }
}

interface ReportSection {
  id: string
  type: 'VISUALIZATION' | 'KPI' | 'TABLE' | 'TEXT' | 'IMAGE'
  visualizationId?: string
  queryId?: string
  config: any
  position: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface ReportFilter {
  id: string
  field: string
  type: 'DATE_RANGE' | 'SELECT' | 'MULTI_SELECT' | 'TEXT' | 'NUMBER'
  defaultValue?: any
  required?: boolean
}
```

---

## 8. Technology Stack

### 8.1 Frontend

- **Framework**: Next.js 16 + React 18 (already in use)
- **UI Components**: Radix UI (already in use)
- **Visualization**:
  - **Apache ECharts** (via `echarts-for-react`) - Primary charting library
  - **Recharts** - For simpler charts (already in dependencies)
  - **D3.js** - For custom visualizations (already in dependencies)
- **Query Builder UI**: Custom React components with drag-and-drop
- **State Management**: Zustand (already in use) + React Query (already in use)
- **Form Handling**: React Hook Form (already in use)

### 8.2 Backend

- **API Framework**: Next.js API Routes (already in use)
- **Database**:
  - **PostgreSQL** (via Prisma) - Primary OLTP database (already in use)
  - **DuckDB** - Analytics/OLAP database (already in dependencies!)
- **Cache**: Redis (recommended, but can use in-memory cache initially)
- **Query Execution**:
  - DuckDB for analytical queries
  - Prisma for transactional queries
- **Security**: NextAuth.js (already in use)

### 8.3 Data Processing

- **ETL**: Custom Node.js scripts using DuckDB
- **Data Transformation**: DuckDB SQL + custom transformation engine
- **Query Optimization**: DuckDB query planner + custom optimizations

### 8.4 Additional Libraries Needed

```json
{
  "dependencies": {
    "echarts": "^5.5.0",
    "echarts-for-react": "^3.0.2",
    "@tanstack/react-table": "^8.0.0", // For advanced tables
    "react-dnd": "^16.0.0", // For drag-and-drop
    "react-dnd-html5-backend": "^16.0.0",
    "date-fns": "^3.3.0", // Already in dependencies
    "lodash": "^4.17.21", // For data manipulation
    "ioredis": "^5.3.2", // Redis client (optional)
    "node-cron": "^3.0.3", // For scheduled reports
    "puppeteer": "^21.0.0", // For PDF generation
    "xlsx": "^0.18.5" // Already in dependencies
  }
}
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Weeks 1-3)

**Goal**: Basic query execution and simple visualizations

**Tasks**:

1. Set up database schema (Prisma migrations)
2. Create data source management API
3. Build basic query builder UI
4. Implement SQL query execution with security filters
5. Create simple visualization components (bar, line, pie)
6. Basic report builder (single visualization per report)

**Deliverables**:

- Users can select data sources
- Users can build simple queries
- Users can create basic charts
- Users can save and view reports

### Phase 2: Advanced Querying (Weeks 4-6)

**Goal**: Advanced query features and data transformations

**Tasks**:

1. Implement visual join builder
2. Build filter builder with all operators
3. Add group by and aggregation UI
4. Implement data transformation engine
5. Add data cleaning operations
6. Build query parameter system

**Deliverables**:

- Users can join multiple data sources
- Users can apply complex filters
- Users can transform and clean data
- Users can create parameterized queries

### Phase 3: Advanced Visualizations (Weeks 7-9)

**Goal**: Rich visualization library and customization

**Tasks**:

1. Integrate Apache ECharts
2. Build visualization configuration UI
3. Add all chart types
4. Implement chart interactions (drill-down, filtering)
5. Add KPI cards and metrics
6. Build pivot tables

**Deliverables**:

- 20+ chart types available
- Fully customizable visualizations
- Interactive charts with drill-down
- Professional-looking reports

### Phase 4: Report Builder & Sharing (Weeks 10-12)

**Goal**: Complete report builder and collaboration features

**Tasks**:

1. Build drag-and-drop report canvas
2. Implement report sections and layouts
3. Add report sharing and permissions
4. Build report templates
5. Implement report versioning
6. Add comments and annotations

**Deliverables**:

- Multi-section reports
- Report sharing and collaboration
- Report templates library
- Version control for reports

### Phase 5: Scheduling & Distribution (Weeks 13-14)

**Goal**: Automated report generation and delivery

**Tasks**:

1. Build scheduling system
2. Implement email delivery
3. Add export formats (PDF, Excel, CSV)
4. Build report execution history
5. Add performance monitoring

**Deliverables**:

- Scheduled report generation
- Email delivery
- Multiple export formats
- Execution tracking

### Phase 6: Performance & Optimization (Weeks 15-16)

**Goal**: Optimize for scale and performance

**Tasks**:

1. Implement query result caching
2. Add DuckDB materialized views
3. Optimize query execution
4. Add query performance monitoring
5. Implement pagination and lazy loading
6. Add data source sync optimization

**Deliverables**:

- Fast query execution (< 2s for most queries)
- Efficient caching
- Scalable architecture
- Performance monitoring dashboard

### Phase 7: Advanced Features (Weeks 17-20)

**Goal**: Enterprise features and polish

**Tasks**:

1. Build data catalog with metadata
2. Add data lineage tracking
3. Implement audit logging
4. Build usage analytics
5. Add AI-powered insights
6. Create onboarding and tutorials

**Deliverables**:

- Complete data catalog
- Full audit trail
- Usage analytics
- AI insights
- User training materials

---

## 10. Security Considerations

### 10.1 SQL Injection Prevention

- Parameterized queries only
- SQL validation and sanitization
- Whitelist of allowed SQL functions
- Query timeout limits
- Result set size limits

### 10.2 Data Access Control

- Row-level security filters (automatic injection)
- Column-level security (field masking)
- Data source access control
- Query result filtering

### 10.3 Authentication & Authorization

- NextAuth.js integration (already in use)
- Role-based permissions
- Report-level permissions
- Audit logging for all queries

### 10.4 Data Privacy

- PII masking for non-authorized users
- Data retention policies
- Export restrictions
- Watermarking for exported reports

---

## 11. Performance Optimization

### 11.1 Query Optimization

- Query result caching (Redis or in-memory)
- Materialized views for common queries
- Query execution plan analysis
- Index recommendations

### 11.2 Data Processing

- Incremental data sync
- Background processing for large queries
- Streaming results for large datasets
- Pagination and lazy loading

### 11.3 Frontend Optimization

- Code splitting for report builder
- Lazy loading of visualizations
- Virtual scrolling for large tables
- Debounced query execution

---

## 12. User Experience

### 12.1 Onboarding

- Interactive tutorial
- Sample reports and templates
- Video guides
- Contextual help

### 12.2 Usability

- Intuitive drag-and-drop interface
- Real-time query preview
- Visual feedback for all actions
- Error messages with suggestions
- Auto-save functionality

### 12.3 Accessibility

- Keyboard navigation
- Screen reader support
- High contrast mode
- WCAG 2.1 AA compliance

---

## 13. Success Metrics

1. **Adoption**: % of users creating reports
2. **Usage**: Reports created per user per month
3. **Performance**: Average query execution time
4. **Satisfaction**: User feedback scores
5. **Efficiency**: Time saved vs. Excel/Power BI
6. **Data Quality**: % of reports with data issues

---

## 14. Future Enhancements

1. **AI-Powered Insights**: Auto-generate insights from data
2. **Natural Language Queries**: "Show me sales by region"
3. **Predictive Analytics**: Forecasting and trend analysis
4. **Mobile App**: Native mobile reporting
5. **API Access**: Programmatic report generation
6. **Custom Visualizations**: User-defined chart types
7. **Real-time Dashboards**: Live data updates
8. **Collaborative Editing**: Multiple users editing reports simultaneously

---

## 15. Conclusion

This enterprise reporting system will provide users with powerful, self-service reporting capabilities that eliminate the need for external tools. The architecture is designed to be:

- **Scalable**: Handles large datasets and many concurrent users
- **Secure**: Multi-layer security with role-based access control
- **Flexible**: Supports all functional areas with cross-functional reporting
- **User-Friendly**: Intuitive interface requiring minimal training
- **Performant**: Fast query execution with caching and optimization
- **Extensible**: Easy to add new data sources and features

The phased implementation approach ensures steady progress with regular deliverables, allowing for feedback and iteration throughout the development process.

---

## Appendix A: Example Use Cases

### Use Case 1: Sales Manager - Sales Performance Report

1. User selects "Sales Opportunities" data source
2. Applies filter: Status = "Won", Date Range = "Last Quarter"
3. Groups by: Region, Sales Rep
4. Aggregates: SUM(Amount), COUNT(\*)
5. Creates bar chart: Revenue by Region
6. Creates table: Top 10 Sales Reps
7. Saves as "Q4 Sales Performance Report"
8. Schedules weekly email delivery

### Use Case 2: Finance Manager - Cross-Functional Report

1. User selects "Sales Opportunities" and "Finance Invoices" data sources
2. Joins on Opportunity ID
3. Applies filters: Status = "Won", Invoice Status = "Paid"
4. Groups by: Month, Product Category
5. Calculates: Revenue, Invoiced Amount, Collection Rate
6. Creates line chart: Revenue vs. Invoiced over time
7. Creates KPI: Average Collection Rate
8. Shares report with Sales and Finance teams

### Use Case 3: Operations Manager - Resource Utilization

1. User selects "Operations Resources" and "Projects" data sources
2. Joins on Resource ID
3. Applies filter: Date Range = "Current Month"
4. Groups by: Resource Type, Project
5. Aggregates: SUM(Hours), AVG(Utilization)
6. Creates heatmap: Resource utilization by project
7. Creates table: Underutilized resources
8. Exports to Excel for further analysis

---

## Appendix B: API Endpoints

```
/api/reporting-engine/
  ├── /data-sources
  │   ├── GET    - List available data sources
  │   ├── POST   - Create new data source
  │   ├── /[id]
  │   │   ├── GET    - Get data source details
  │   │   ├── PUT    - Update data source
  │   │   ├── DELETE - Delete data source
  │   │   └── /schema - Get data source schema
  │   └── /[id]/preview - Preview sample data
  │
  ├── /queries
  │   ├── GET    - List queries
  │   ├── POST   - Create/execute query
  │   ├── /[id]
  │   │   ├── GET    - Get query details
  │   │   ├── PUT    - Update query
  │   │   ├── DELETE - Delete query
  │   │   └── /execute - Execute query
  │   └── /[id]/results - Get query results
  │
  ├── /transformations
  │   ├── POST   - Create transformation
  │   └── /[id]/execute - Execute transformation
  │
  ├── /visualizations
  │   ├── GET    - List visualizations
  │   ├── POST   - Create visualization
  │   ├── /[id]
  │   │   ├── GET    - Get visualization
  │   │   ├── PUT    - Update visualization
  │   │   └── DELETE - Delete visualization
  │   └── /[id]/data - Get visualization data
  │
  ├── /reports
  │   ├── GET    - List reports
  │   ├── POST   - Create report
  │   ├── /[id]
  │   │   ├── GET    - Get report
  │   │   ├── PUT    - Update report
  │   │   ├── DELETE - Delete report
  │   │   ├── /execute - Execute report
  │   │   ├── /share - Share report
  │   │   └── /export - Export report (PDF, Excel, CSV)
  │   └── /templates - Get report templates
  │
  └── /schedules
      ├── GET    - List schedules
      ├── POST   - Create schedule
      └── /[id]
          ├── PUT    - Update schedule
          └── DELETE - Delete schedule
```

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Author**: Enterprise Reporting System Architecture Team
