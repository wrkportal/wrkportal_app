# Database Tables Integration - Reporting Studio

## Overview
The Reporting Studio Database tab now displays **both uploaded files AND database tables** from your Prisma schema in the sidebar.

## Features

### 1. **Dual Data Sources**
- **Uploads Tab**: View and manage CSV/XLSX files you've uploaded
- **Tables Tab**: Access your live database tables directly

### 2. **Database Tables Included**
The following tables are available for reporting:
- **Users** - User accounts and profiles
- **Projects** - All projects in the organization
- **Tasks** - Project tasks and assignments
- **Timesheets** - Time tracking entries
- **OKRs** - Objectives and Key Results
- **Programs** - Program management
- **Skills** - Skills and competencies
- **Approvals** - Approval workflows
- **Audit Logs** - System audit trail
- **Notifications** - User notifications

### 3. **Tab Interface**
- Clean tab switcher at the top of the sidebar
- Shows count of items in each tab
- Upload button only appears on "Uploads" tab
- Search works for both file names and table names

### 4. **How It Works**

#### For Uploaded Files:
1. Click "Uploads" tab
2. Click "Upload File" button
3. Select CSV or XLSX file
4. File appears in the list
5. Click to preview and analyze

#### For Database Tables:
1. Click "Tables" tab
2. See all available database tables with:
   - Table name
   - Description
   - Record count (filtered by your tenant)
3. Click any table to preview its data
4. All data is automatically filtered to your organization (tenant)

### 5. **Data Security**
- **Tenant Isolation**: Each organization only sees their own data
- **Read-Only**: Database tables are read-only for safety
- **Limit**: First 100 rows are loaded for preview
- **No Writes**: Cannot modify database tables from this interface

### 6. **Same Features for Both**
Once you select either an uploaded file or a database table, you get:
- ✅ Data type management
- ✅ Formatting options (numbers, currency, dates)
- ✅ Calculated fields
- ✅ Column resizing
- ✅ Search/filter
- ✅ All settings persist in localStorage

## API Endpoints Created

### `GET /api/reporting-studio/database-tables`
Lists all available database tables with metadata:
```json
{
  "tables": [
    {
      "id": "users",
      "name": "Users",
      "description": "User accounts and profiles",
      "rowCount": 45,
      "type": "database_table",
      "icon": "users"
    }
  ]
}
```

### `GET /api/reporting-studio/database-tables/[tableId]`
Returns data from a specific table:
```json
{
  "columns": ["id", "name", "email", "createdAt"],
  "rows": [
    ["1", "John Doe", "john@example.com", "2024-01-15"],
    ["2", "Jane Smith", "jane@example.com", "2024-01-16"]
  ],
  "rowCount": 2
}
```

## Use Cases

### 1. **User Analytics**
- Select "Users" table
- Analyze user growth, departments, locations
- Create calculated fields for metrics

### 2. **Project Reporting**
- Select "Projects" table
- View project status, timelines, budgets
- Cross-reference with uploaded budget files

### 3. **Time Tracking Analysis**
- Select "Timesheets" table
- Analyze time spent across projects
- Compare with uploaded resource plans

### 4. **OKR Dashboards**
- Select "OKRs" table
- Track objectives and key results
- Create progress calculations

## Limitations

1. **Preview Only**: Maximum 100 rows displayed (configurable)
2. **Read-Only**: Cannot edit database tables
3. **No Joins**: Each table is viewed independently
4. **Calculated Fields**: Only work within the same table
5. **No Refresh**: Data is snapshot when page loads

## Future Enhancements

Possible future features:
- [ ] Real-time data refresh
- [ ] Join multiple tables
- [ ] SQL query builder
- [ ] Export to CSV
- [ ] Save custom views
- [ ] Scheduled snapshots

## Technical Notes

- Uses Prisma client dynamic model access: `(prisma as any)[tableName]`
- Tenant filtering applied automatically via `where: { tenantId }`
- Date objects are converted to ISO strings for display
- JSON objects in database are stringified for table view
- Settings persist in localStorage with prefix `reportingStudio_file_`

## Benefits

1. **No Data Export Needed**: Access live data directly
2. **Always Current**: See real-time data from your system
3. **Unified Interface**: Same tools for files and tables
4. **Secure**: Tenant isolation ensures data privacy
5. **Fast**: Leverages Prisma's optimized queries

