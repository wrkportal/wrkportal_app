# Dashboard-Centric Reporting System Architecture

## Executive Summary

This document outlines a **dashboard-centric** reporting system where users create reusable visualization cards in a Visualization Library, then compose them into multiple named dashboards. Each functional area (Finance, Sales, Operations, IT, Projects, Recruitment) has its own Dashboard page where users can create, save, and manage multiple dashboards.

---

## 1. User Flow & Architecture

### 1.1 User Journey

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Create Visualization                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Finance Dashboard Page                                 │  │
│  │                                                         │  │
│  │  [+ Create Visualization]                              │  │
│  │    ↓                                                    │  │
│  │  [Query Builder] → [Chart Config] → [Save]            │  │
│  │                                                         │  │
│  │  ✅ Visualization saved to Library                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Visualization Library                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  [Revenue Chart]  [Sales Table]  [KPI Card]          │  │
│  │  [Profit Chart]   [Expense Chart] [Trend Line]        │  │
│  │                                                         │  │
│  │  Each card has:                                        │  │
│  │  - [Add to Dashboard] dropdown                        │  │
│  │  - [Edit] [Duplicate] [Delete] options                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Create/Manage Dashboards                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Dashboard Tabs (Top Row):                          │  │
│  │  [Q4 Performance] [Monthly Review] [+ New Dashboard]│  │
│  │                                                         │  │
│  │  Canvas (Drag & Drop):                                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │  │
│  │  │ Revenue  │  │ Sales    │  │ KPI      │         │  │
│  │  │ Chart    │  │ Table    │  │ Card     │         │  │
│  │  └──────────┘  └──────────┘  └──────────┘         │  │
│  │                                                         │  │
│  │  [Auto Refresh: ON] [🔄 Manual Refresh] [Save]       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              Dashboard Pages (Per Functional Area)          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Finance      │  │ Sales        │  │ Operations   │     │
│  │ Dashboard    │  │ Dashboard    │  │ Dashboard    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                 │
│                            ▼                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Visualization Library (Shared)                │  │
│  │  - Reusable visualization cards                       │  │
│  │  - Can be added to any dashboard                      │  │
│  │  - Functional area specific + cross-functional        │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Dashboard Management                          │  │
│  │  - Multiple named dashboards per user                  │  │
│  │  - Dashboard tabs in top row                         │  │
│  │  - Auto-refresh + manual refresh                     │  │
│  │  - Save/Load dashboard configurations                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Data Model (Refined)

### 2.1 Core Entities

```prisma
// Visualization Library - Reusable visualization cards
model Visualization {
  id            String   @id @default(cuid())
  name          String
  description   String?
  type          String   // CHART, TABLE, KPI, MAP, etc.
  
  // Functional Area
  functionalArea String  // FINANCE, SALES, OPERATIONS, IT, PROJECTS, RECRUITMENT, CROSS_FUNCTIONAL
  
  // Query & Data
  queryId       String
  query         Query    @relation(fields: [queryId], references: [id])
  
  // Visualization Config
  config        Json     // Chart config, colors, axes, etc.
  
  // Layout (for when added to dashboard)
  defaultWidth  Int      @default(6)  // Grid columns (1-12)
  defaultHeight Int      @default(4)  // Grid rows
  
  // Metadata
  createdById   String
  createdBy     User     @relation("VisualizationCreator", fields: [createdById], references: [id])
  workspaceId   String?
  workspace     Workspace? @relation(fields: [workspaceId], references: [id])
  
  // Sharing
  isPublic      Boolean  @default(false)
  isTemplate    Boolean  @default(false)
  tags          String[]
  
  // Usage tracking
  usedInDashboards DashboardVisualization[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([functionalArea])
  @@index([createdById])
  @@index([workspaceId])
}

// Dashboard - User-created dashboard collections
model Dashboard {
  id            String   @id @default(cuid())
  name          String
  description   String?
  
  // Functional Area
  functionalArea String  // FINANCE, SALES, OPERATIONS, IT, PROJECTS, RECRUITMENT
  
  // Owner
  createdById   String
  createdBy     User     @relation("DashboardCreator", fields: [createdById], references: [id])
  workspaceId   String?
  workspace     Workspace? @relation(fields: [workspaceId], references: [id])
  
  // Layout Configuration
  layout        Json     // Grid layout configuration
  // Example: {
  //   columns: 12,
  //   rowHeight: 80,
  //   items: [
  //     { id: 'viz-1', x: 0, y: 0, w: 6, h: 4 },
  //     { id: 'viz-2', x: 6, y: 0, w: 6, h: 4 }
  //   ]
  // }
  
  // Refresh Configuration
  autoRefresh   Boolean  @default(false)
  refreshInterval Int?    // seconds (e.g., 300 for 5 minutes)
  lastRefreshed  DateTime?
  
  // Visualizations in this dashboard
  visualizations DashboardVisualization[]
  
  // Sharing
  isPublic      Boolean  @default(false)
  sharedWith    DashboardShare[]
  permissions   DashboardPermission[]
  
  // Metadata
  isDefault     Boolean  @default(false) // Default dashboard for functional area
  order         Int      @default(0)     // Order in tabs
  tags          String[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([functionalArea])
  @@index([createdById])
  @@index([workspaceId])
  @@index([isDefault, functionalArea])
}

// Junction table: Dashboard ↔ Visualization
model DashboardVisualization {
  id              String   @id @default(cuid())
  dashboardId     String
  dashboard       Dashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)
  visualizationId String
  visualization   Visualization @relation(fields: [visualizationId], references: [id], onDelete: Cascade)
  
  // Position in dashboard
  position        Json     // { x, y, w, h } for grid layout
  order           Int      @default(0)
  
  // Per-dashboard customization (overrides visualization defaults)
  customConfig    Json?    // Optional: dashboard-specific config overrides
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([dashboardId, visualizationId])
  @@index([dashboardId])
  @@index([visualizationId])
}

// Query - Reusable data queries
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
  
  // Security
  securityFilters Json?  // Auto-injected RLS filters
  
  // Results & Cache
  cachedResult  Json?
  cacheExpiry   DateTime?
  
  // Metadata
  executionTime Int?     // milliseconds
  rowCount      Int?
  createdById   String
  createdBy     User     @relation("QueryCreator", fields: [createdById], references: [id])
  
  // Usage
  visualizations Visualization[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([dataSourceId])
  @@index([createdById])
}

// Data Source - Available data sources
model DataSource {
  id            String   @id @default(cuid())
  name          String
  description   String?
  type          String   // DATABASE_TABLE, API, FILE, CUSTOM_QUERY
  connection    Json     // Connection details (encrypted)
  schema        Json?    // Table/field metadata
  
  // Functional Area
  functionalArea String? // FINANCE, SALES, etc. (null = cross-functional)
  
  workspaceId   String?
  workspace     Workspace? @relation(fields: [workspaceId], references: [id])
  
  // Access Control
  accessibleBy  DataSourceAccess[]
  
  // Metadata
  lastSynced    DateTime?
  syncFrequency String?  // REAL_TIME, HOURLY, DAILY
  
  // Usage
  queries       Query[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([workspaceId])
  @@index([type])
  @@index([functionalArea])
}

// Dashboard Sharing
model DashboardShare {
  id          String   @id @default(cuid())
  dashboardId String
  dashboard   Dashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  permission  String   // VIEW, EDIT, ADMIN
  createdAt   DateTime @default(now())
  
  @@unique([dashboardId, userId])
  @@index([dashboardId])
  @@index([userId])
}

// Dashboard Permissions (Role-based)
model DashboardPermission {
  id          String   @id @default(cuid())
  dashboardId String
  dashboard   Dashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)
  userRole    String?  // UserRole enum
  groupRole   String?  // GroupRole enum
  permission  String   // VIEW, EDIT, ADMIN
  createdAt   DateTime @default(now())
  
  @@index([dashboardId])
}

// Add relations to User model
// User {
//   ...
//   createdVisualizations Visualization[] @relation("VisualizationCreator")
//   createdDashboards     Dashboard[]     @relation("DashboardCreator")
//   createdQueries         Query[]         @relation("QueryCreator")
//   sharedDashboards       DashboardShare[]
//   ...
// }
```

---

## 3. Dashboard Page Structure

### 3.1 UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Finance Dashboard                                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Dashboard Tabs:                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Q4 Performance│ │ Monthly Review│ │ [+ New Dashboard]│  │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Toolbar                                                │  │
│  │  [Auto Refresh: ON (5 min)] [🔄 Refresh] [⚙️ Settings]│  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Dashboard Canvas (React Grid Layout)                   │  │
│  │                                                         │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │ Revenue      │  │ Sales        │  │ Total        │ │  │
│  │  │ Chart        │  │ by Region    │  │ Revenue      │ │  │
│  │  │              │  │              │  │ $1.2M        │ │  │
│  │  │ [Chart]      │  │ [Chart]      │  │ [KPI Card]   │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │  │
│  │                                                         │  │
│  │  ┌──────────────┐  ┌──────────────┐                   │  │
│  │  │ Top          │  │ Expense      │                   │  │
│  │  │ Products     │  │ Trends       │                   │  │
│  │  │ [Table]      │  │ [Line Chart] │                   │  │
│  │  └──────────────┘  └──────────────┘                   │  │
│  │                                                         │  │
│  │  [+ Add Visualization]                                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Visualization Library (Collapsible Sidebar)            │  │
│  │  [Revenue Chart] [Sales Table] [KPI Card]             │  │
│  │  [Profit Chart] [Expense Chart] [Trend Line]          │  │
│  │                                                         │  │
│  │  Each card:                                            │  │
│  │  [Add to Dashboard ▼] [Edit] [Duplicate] [Delete]     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Key Features

1. **Dashboard Tabs (Top Row)**
   - Show all saved dashboards for current functional area
   - Active dashboard highlighted
   - "+ New Dashboard" button
   - Click to switch between dashboards
   - Drag to reorder

2. **Auto-Refresh**
   - Toggle switch: ON/OFF
   - Interval selector: 1 min, 5 min, 15 min, 30 min, 1 hour
   - Visual indicator when refreshing
   - Manual refresh button (always available)

3. **Dashboard Canvas**
   - React Grid Layout (already in use)
   - Drag-and-drop visualizations
   - Resize visualizations
   - "+ Add Visualization" button opens library

4. **Visualization Library**
   - Collapsible sidebar or modal
   - Filter by type, tags, functional area
   - Search visualizations
   - Each card shows preview
   - Quick actions: Add to Dashboard, Edit, Duplicate, Delete

---

## 4. Technology Stack Justification

### 4.1 Frontend Visualization: Apache ECharts

**Why ECharts is the BEST choice for enterprise reporting:**

✅ **Enterprise-Grade Performance**
- Used by major companies: Alibaba, Baidu, Tencent, Microsoft
- Handles millions of data points efficiently
- GPU-accelerated rendering for large datasets
- Optimized for real-time updates

✅ **Comprehensive Chart Types**
- 20+ built-in chart types
- Custom chart support
- 3D visualizations
- Geographic maps
- Complex interactions (drill-down, brush, zoom)

✅ **Scalability**
- Handles complex reporting structures
- Supports nested data
- Efficient memory management
- Works with large datasets (100K+ points)

✅ **Flexibility**
- Highly customizable
- Theme system
- Plugin architecture
- Can extend with custom charts

✅ **React Integration**
- `echarts-for-react` provides seamless React integration
- Component-based architecture
- Easy to integrate with your existing React setup

**Comparison:**
- **Recharts**: Good for simple charts, but limited for complex reporting
- **D3.js**: Powerful but requires more code, steeper learning curve
- **Chart.js**: Too basic for enterprise reporting needs
- **ECharts**: Perfect balance of power, performance, and ease of use

### 4.2 Analytics Database: DuckDB

**Why DuckDB is the BEST choice for analytics:**

✅ **Performance**
- **10-100x faster** than PostgreSQL for analytical queries
- Columnar storage optimized for aggregations
- Vectorized execution engine
- Handles complex joins efficiently

✅ **Scalability**
- Processes billions of rows
- Efficient memory usage
- Can handle complex reporting structures
- Supports window functions, CTEs, subqueries

✅ **Integration**
- **Already in your dependencies!**
- In-process (no separate server)
- SQL-compatible (easy migration)
- Can read directly from PostgreSQL

✅ **Enterprise Adoption**
- Used by: MotherDuck, Datafold, Evidence.dev
- Active development and community
- Production-ready

**Comparison:**
- **PostgreSQL**: Great for OLTP, slower for analytics
- **ClickHouse**: Requires separate infrastructure
- **DuckDB**: Best balance - fast, easy, already available

### 4.3 Primary Database: PostgreSQL

**Why PostgreSQL is the RIGHT choice:**

✅ **Battle-Tested**
- Used by major enterprises worldwide
- Handles complex queries
- ACID compliance
- Excellent for transactional data

✅ **Already in Use**
- Your Prisma schema uses PostgreSQL
- No migration needed
- Team already familiar

✅ **Hybrid Approach**
- PostgreSQL for OLTP (transactional data)
- DuckDB for OLAP (analytical queries)
- Best of both worlds

### 4.4 Frontend Framework: React + Next.js

**Why this stack is PERFECT:**

✅ **Already in Use**
- Your entire app is React/Next.js
- Consistent architecture
- Team expertise

✅ **Component-Based**
- Perfect for reusable visualization cards
- Easy to build dashboard components
- Great for complex reporting structures

✅ **Performance**
- Server-side rendering (Next.js)
- Code splitting
- Optimized for large applications

✅ **Ecosystem**
- Rich library ecosystem
- Great tooling
- Active community

### 4.5 Caching: Redis (Optional Initially)

**Why Redis (but optional):**
- **Initially**: In-memory cache (simpler)
- **Later**: Redis for distributed caching
- **Scalability**: Can add when needed

---

## 5. Auto-Refresh Implementation

### 5.1 Architecture

```typescript
// Dashboard Auto-Refresh System
interface DashboardRefreshConfig {
  dashboardId: string
  autoRefresh: boolean
  refreshInterval: number // seconds
  lastRefreshed: Date | null
  nextRefresh: Date | null
}

// Client-Side (React)
const useDashboardRefresh = (dashboardId: string, config: DashboardRefreshConfig) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  useEffect(() => {
    if (!config.autoRefresh) return
    
    const interval = setInterval(async () => {
      setIsRefreshing(true)
      await refreshDashboard(dashboardId)
      setIsRefreshing(false)
    }, config.refreshInterval * 1000)
    
    return () => clearInterval(interval)
  }, [dashboardId, config.autoRefresh, config.refreshInterval])
  
  const manualRefresh = async () => {
    setIsRefreshing(true)
    await refreshDashboard(dashboardId)
    setIsRefreshing(false)
  }
  
  return { isRefreshing, manualRefresh }
}

// Server-Side (Background Jobs)
// Use node-cron or Next.js API routes with setInterval
// For production: Use a job queue (Bull, BullMQ) or serverless functions
```

### 5.2 Refresh Strategy

1. **Client-Side Polling** (Initial Implementation)
   - Simple, works immediately
   - Good for < 100 concurrent dashboards
   - Uses WebSocket or polling

2. **Server-Side Scheduled Jobs** (Production)
   - More efficient for many users
   - Use node-cron or job queue
   - Pre-compute results, push updates

3. **WebSocket Real-Time** (Advanced)
   - Push updates when data changes
   - Most efficient
   - Requires WebSocket infrastructure

---

## 6. Implementation Phases (Refined)

### Phase 1: Foundation (Weeks 1-4)
- Database schema (Visualization, Dashboard, Query models)
- Data source management
- Security filters (RLS)
- Basic visualization creation

### Phase 2: Visualization Library (Weeks 5-7)
- Visualization Library UI
- Card management (add, edit, delete, duplicate)
- Add to dashboard functionality
- Visualization preview

### Phase 3: Dashboard Builder (Weeks 8-11)
- Dashboard creation and management
- Dashboard tabs
- Drag-and-drop canvas
- Grid layout system
- Save/load dashboards

### Phase 4: ECharts Integration (Weeks 12-15)
- Install and configure ECharts
- Build chart components
- 20+ chart types
- Chart interactions

### Phase 5: Auto-Refresh (Weeks 16-17)
- Auto-refresh toggle
- Interval configuration
- Manual refresh button
- Refresh status indicators

### Phase 6: Advanced Features (Weeks 18-20)
- Cross-functional visualizations
- Dashboard sharing
- Templates
- Export functionality

---

## 7. Example: Finance Dashboard Flow

### Step 1: Create Visualization
```
User clicks "Create Visualization" on Finance Dashboard
→ Opens Query Builder
→ Selects "Finance Invoices" data source
→ Builds query: SUM(amount) GROUP BY month
→ Chooses "Line Chart"
→ Configures: Title, Colors, Axes
→ Saves as "Monthly Revenue Trend"
→ Added to Visualization Library
```

### Step 2: Add to Dashboard
```
User opens Visualization Library
→ Sees "Monthly Revenue Trend" card
→ Clicks "Add to Dashboard" dropdown
→ Selects "Q4 Performance" dashboard (or creates new)
→ Visualization appears on dashboard canvas
→ User can drag, resize, reposition
```

### Step 3: Manage Dashboard
```
User sees dashboard tabs: [Q4 Performance] [Monthly Review] [+ New]
→ Clicks "Q4 Performance" tab
→ Sees all visualizations in grid layout
→ Toggles "Auto Refresh: ON (5 min)"
→ Clicks manual refresh button
→ Dashboard updates with latest data
→ Saves dashboard
```

---

## 8. Scalability Considerations

### 8.1 Performance Optimizations

1. **Query Caching**
   - Cache query results (5-15 min TTL)
   - Invalidate on data updates
   - Cache key: query hash + user ID + role

2. **Lazy Loading**
   - Load visualizations on-demand
   - Virtual scrolling for large lists
   - Code splitting for dashboard pages

3. **Data Aggregation**
   - Pre-compute common aggregations
   - Materialized views in DuckDB
   - Background ETL jobs

4. **Dashboard Rendering**
   - Render visible visualizations first
   - Lazy load below-the-fold
   - Debounce resize operations

### 8.2 Scalability Metrics

- **Visualizations per Dashboard**: 20-50 (optimized)
- **Dashboards per User**: Unlimited
- **Concurrent Users**: 1000+ (with proper caching)
- **Data Points per Chart**: 100K+ (with ECharts)
- **Query Response Time**: < 2s (with caching)

---

## 9. Security (Same as Original Plan)

- Row-level security (RLS) filters
- Column-level security
- Role-based access control
- Data source permissions
- Dashboard sharing controls

---

## 10. Conclusion

This dashboard-centric approach provides:

✅ **Better UX**: Familiar dashboard model (like Power BI, Tableau)
✅ **Reusability**: Visualizations can be used across dashboards
✅ **Flexibility**: Multiple dashboards per functional area
✅ **Scalability**: Tech stack handles complex reporting structures
✅ **Performance**: Auto-refresh + manual refresh options

**Tech Stack is Enterprise-Ready:**
- ✅ Apache ECharts: Industry-leading, handles complex visualizations
- ✅ DuckDB: 10-100x faster than PostgreSQL for analytics
- ✅ PostgreSQL: Battle-tested, already in use
- ✅ React/Next.js: Perfect for component-based architecture

This architecture will scale to handle enterprise-level reporting requirements while providing an intuitive, user-friendly experience.

---

**Document Version**: 2.0 (Dashboard-Centric)  
**Last Updated**: 2024  
**Status**: Ready for Implementation
