# 🚀 Reporting Studio - Access Guide

## How to Access Reporting Studio Features

All Reporting Studio features are accessible through the **sidebar navigation** in your application.

---

## 📍 Main Entry Point

### **Reporting Studio** (Home Page)
**URL:** `/reporting-studio`  
**Sidebar:** Click "Reporting Studio" in the left sidebar  
**Icon:** ✨ Sparkles icon

This is the main landing page that provides:
- Overview of platform capabilities
- Quick access cards to all features
- Feature highlights
- Implementation timeline

---

## 🔗 All Available Features (Sidebar Navigation)

When you click on "Reporting Studio" in the sidebar, you'll see these sub-menu items:

### 1. **Data Sources** 📊
**URL:** `/reporting-studio/data-sources`  
**Sidebar:** Reporting Studio → Data Sources  
**Icon:** Database icon

**Features:**
- Upload files (CSV, Excel, JSON, Parquet)
- Connect to databases (PostgreSQL, MySQL, SQL Server, MongoDB)
- View and manage all data sources
- Test database connections
- Browse database tables and schemas

---

### 2. **Datasets** 📁
**URL:** `/reporting-studio/datasets`  
**Sidebar:** Reporting Studio → Datasets  
**Icon:** FileStack icon

**Features:**
- View all datasets
- Create new datasets from data sources
- Manage dataset metadata
- Refresh datasets
- View dataset details

---

### 3. **Visualizations** 📈
**URL:** `/reporting-studio/visualizations`  
**Sidebar:** Reporting Studio → Visualizations  
**Icon:** BarChart3 icon

**Features:**
- Create new visualizations
- Choose from 15+ chart types:
  - Standard: Bar, Line, Area, Pie, Scatter, Column, Table
  - Advanced: Sankey, Sunburst, Treemap, Heatmap, Box Plot, Waterfall, Gantt
  - Geospatial: Choropleth Maps, Point Maps, Heat Maps
- Configure chart settings
- View and edit existing visualizations

---

### 4. **Query Builder** 🔧
**URL:** `/reporting-studio/query-builder`  
**Sidebar:** Reporting Studio → Query Builder  
**Icon:** Code icon

**Features:**
- **Visual Builder Tab:**
  - Build SQL queries visually
  - Select tables, columns, joins
  - Add filters, aggregations, sorting
  - View generated SQL

- **Natural Language Tab (NEW!):**
  - Ask questions in plain English
  - Automatically generates SQL queries
  - Examples:
    - "Show me the top 10 customers by revenue"
    - "What are the total sales by region for last month?"
    - "Find all orders with status pending"
  - Generated SQL can be reviewed and executed

---

### 5. **Dashboards** 📊
**URL:** `/reporting-studio/dashboards`  
**Sidebar:** Reporting Studio → Dashboards  
**Icon:** LayoutGrid icon

**Features:**
- View all dashboards
- Create new dashboards (click "New Dashboard")
  - Choose from 6 pre-built templates:
    1. Executive Summary
    2. Sales Performance
    3. Operations Overview
    4. Financial Dashboard
    5. Custom Empty Dashboard
    6. KPI Monitoring
- Drag-and-drop dashboard builder
- Add widgets and charts
- Resize and arrange widgets
- Save and share dashboards
- Export dashboards (PNG/PDF)

**Dashboard Routes:**
- List: `/reporting-studio/dashboards`
- Create: `/reporting-studio/dashboards/new`
- View/Edit: `/reporting-studio/dashboards/[id]`

---

## 🎯 Quick Start Workflow

### For First-Time Users:

1. **Start with Data Sources**
   - Go to `/reporting-studio/data-sources`
   - Upload a file OR connect to a database
   - Test the connection

2. **Create a Dataset**
   - Go to `/reporting-studio/datasets`
   - Create a dataset from your data source

3. **Try Natural Language Query**
   - Go to `/reporting-studio/query-builder`
   - Click the "Natural Language" tab
   - Ask a question about your data
   - Review the generated SQL

4. **Create a Visualization**
   - Go to `/reporting-studio/visualizations`
   - Create a new chart from your dataset
   - Choose a chart type
   - Configure the visualization

5. **Build a Dashboard**
   - Go to `/reporting-studio/dashboards`
   - Click "New Dashboard"
   - Choose a template or start from scratch
   - Add widgets and charts
   - Save your dashboard

---

## 🔍 Feature Highlights

### ✨ Natural Language Query (NEW!)
- **Location:** Query Builder → Natural Language tab
- **What it does:** Converts plain English questions into SQL queries
- **Examples:**
  - "Show me sales by region"
  - "What are the top 10 products?"
  - "Find customers with orders over $1000"

### 📊 Dashboard Templates
- **Location:** Dashboards → New Dashboard
- **Templates Available:**
  1. Executive Summary
  2. Sales Performance
  3. Operations Overview
  4. Financial Dashboard
  5. Custom Empty Dashboard
  6. KPI Monitoring

### 🗺️ Advanced Visualizations
- **15+ Chart Types** including:
  - Geospatial maps (Choropleth, Point, Heat)
  - Network diagrams (Sankey)
  - Hierarchical (Sunburst, Treemap)
  - Statistical (Box Plot, Heatmap)

---

## 💡 Tips

1. **Sidebar Navigation:**
   - Click "Reporting Studio" to expand/collapse the sub-menu
   - All features are accessible from the sidebar

2. **Natural Language Query:**
   - Be specific in your questions
   - Mention table/column names if you know them
   - Include filtering criteria (dates, categories, etc.)

3. **Dashboard Builder:**
   - Start with a template to see examples
   - Drag widgets to rearrange
   - Resize widgets by dragging corners
   - Save frequently

---

## 🚨 Troubleshooting

**Can't see Reporting Studio in sidebar?**
- Make sure you're logged in
- Check your user role (all roles should have access)

**Query Builder not working?**
- Make sure you have at least one data source configured
- Select a data source from the dropdown

**Natural Language Query errors?**
- Ensure your question is specific enough
- Try rephrasing the question
- Check that your data source is properly configured

---

## 📝 Summary

All features are accessible through:
- **Sidebar Navigation** → Reporting Studio → [Feature Name]
- **Direct URLs:** `/reporting-studio/[feature-name]`
- **Main Landing Page:** `/reporting-studio` (with quick access cards)

The Reporting Studio is your central hub for all data analytics, visualization, and reporting needs!

