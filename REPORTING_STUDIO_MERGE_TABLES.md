# Advanced Table Merging - Reporting Studio

## Overview
The Reporting Studio now includes an **advanced table merging feature** that allows you to combine multiple database tables and uploaded files using SQL-style joins with a visual interface.

## 🎯 Key Features

### 1. **Multiple Join Types**
- **Inner Join (⋂)**: Only matching records from both tables
- **Left Join (⊆)**: All records from left table + matches from right
- **Right Join (⊇)**: All records from right table + matches from left
- **Full Outer Join (⋃)**: All records from both tables

### 2. **Multi-Table Support**
- Merge up to **5 tables** simultaneously
- Chain joins sequentially (Table A → B → C → D → E)
- Mix database tables and uploaded files

### 3. **Column Selection**
- Choose specific columns from each table
- Prevent data overload by selecting only what you need
- Columns are prefixed with table names (e.g., `user_name`, `project_title`)

### 4. **Smart Key Matching**
- Select any column as join key
- Common keys: `id`, `userId`, `projectId`, `tenantId`
- Automatically fetch available columns for each table

### 5. **Preview Before Merge**
- Preview first 10 rows before executing
- See column count and row count
- Validate your join configuration

## 🚀 How to Use

### Step 1: Select a Database Table
1. Navigate to **Reporting Studio > Database**
2. Click the **"Tables"** tab
3. Select any database table (e.g., Projects, Users, Tasks)

### Step 2: Open Merge Dialog
1. Click the **"Merge Tables"** button in the header
2. The merge dialog opens with your selected table as the base

### Step 3: Configure First Join
1. **Base Table**: Already selected (your current table)
2. **Join With Table**: Select the table to merge with
3. **Join Type**: Choose INNER, LEFT, RIGHT, or FULL
4. **Left Join Key**: Select matching column from base table
5. **Right Join Key**: Select matching column from second table
6. **Select Columns**: Check the columns you want to include

### Step 4: Add More Joins (Optional)
1. Click **"Add Another Join"** to chain more tables
2. Configure each join independently
3. Maximum 5 joins supported

### Step 5: Preview & Execute
1. Click **"Preview"** to see first 10 rows
2. Review the merged data structure
3. Click **"Merge Tables"** to execute full merge (up to 1000 rows)

## 📊 Example Use Cases

### Use Case 1: User Projects Report
**Goal**: Show all users with their assigned projects

```
Base Table: User
Join With: Project
Join Type: LEFT (show all users, even without projects)
Left Key: id
Right Key: managerId
Columns: 
  - User: name, email, department
  - Project: name, status, startDate
```

**Result**: Every user appears once per project they manage

### Use Case 2: Project Tasks with Time Tracking
**Goal**: Analyze time spent on tasks across projects

```
Join 1:
  Base: Project
  With: Task
  Type: INNER
  Keys: project.id = task.projectId

Join 2:
  Base: (merged from join 1)
  With: Timesheet
  Type: LEFT
  Keys: task.id = timesheet.taskId
```

**Result**: Projects → Tasks → Timesheets in one view

### Use Case 3: OKR Progress Dashboard
**Goal**: Goals with Key Results and check-ins

```
Join 1:
  Base: Goal
  With: KeyResult
  Type: LEFT
  Keys: goal.id = keyResult.goalId

Join 2:
  Base: (merged)
  With: KRCheckIn
  Type: LEFT
  Keys: keyResult.id = krCheckIn.keyResultId
```

**Result**: Complete OKR hierarchy with progress tracking

### Use Case 4: Cross-Reference with Uploaded Data
**Goal**: Compare database projects with budget spreadsheet

```
Base Table: Project (from database)
Join With: Budget_2024.xlsx (uploaded file)
Join Type: LEFT
Keys: project.name = budget_2024_Project_Name
```

**Result**: Database projects enriched with budget data from Excel

## 🔧 Technical Details

### API Endpoint
`POST /api/reporting-studio/merge-tables`

**Request Body:**
```json
{
  "joins": [
    {
      "leftTable": "user",
      "rightTable": "project",
      "joinType": "INNER",
      "leftKey": "id",
      "rightKey": "managerId",
      "selectedColumns": {
        "left": ["id", "name", "email"],
        "right": ["id", "name", "status"]
      }
    }
  ],
  "limit": 1000
}
```

**Response:**
```json
{
  "columns": ["user_id", "user_name", "user_email", "project_id", "project_name", "project_status"],
  "rows": [
    ["1", "John Doe", "john@example.com", "101", "Website Redesign", "In Progress"],
    ["2", "Jane Smith", "jane@example.com", "102", "Mobile App", "Completed"]
  ],
  "rowCount": 2,
  "totalLeft": 2,
  "totalRight": 2
}
```

### Join Algorithm
The merge is performed **in-memory** using JavaScript:
1. Index the right table by join key (O(n))
2. For each left row, lookup matching right rows (O(1) average)
3. Merge matching rows with column prefixes
4. Handle unmatched rows based on join type

### Column Naming
- **Format**: `{tableName}_{columnName}`
- **Example**: `user_id`, `project_name`, `task_title`
- **Prevents**: Column name conflicts

### Performance
- **Limit**: 1000 rows per merge (configurable)
- **Preview**: 10 rows
- **Memory**: All data loaded into browser
- **Recommended**: Merge tables with < 10,000 records each

## ⚠️ Limitations

1. **Row Limit**: Maximum 1000 rows in final result
2. **Table Count**: Maximum 5 tables can be joined
3. **Memory**: Processed in browser (not server-side)
4. **No Aggregation**: No GROUP BY or aggregate functions
5. **Read-Only**: Merged results are temporary (not saved to database)
6. **Tenant Filter**: All data is filtered by your organization automatically

## 💡 Best Practices

### 1. **Start Small**
- Test with INNER join first
- Use Preview before full merge
- Select only needed columns

### 2. **Choose Right Join Type**
- **INNER**: When you only want matching records
- **LEFT**: When base table is primary and you want all its records
- **RIGHT**: Rarely used; prefer LEFT join with swapped tables
- **FULL**: When you need everything from both sides

### 3. **Optimize Column Selection**
- Don't select all columns if not needed
- Reduces memory usage
- Faster rendering in table view

### 4. **Use Consistent Keys**
- Match data types (both should be `id` or both should be `userId`)
- Ensure keys have same format
- Watch for nulls in join keys

### 5. **Chain Joins Logically**
- Join in order of relationships
- Example: Users → Projects → Tasks (not Tasks → Users → Projects)

## 🎨 UI Features

### Visual Join Type Selector
- Icons for each join type (⋂ ⋃ ⊆ ⊇)
- Hover descriptions
- Active state highlighting

### Column Checkboxes
- Select individual columns
- "Select All" button for convenience
- Scrollable list for tables with many columns

### Multi-Join Cards
- Each join in its own card
- Remove button for flexibility
- Sequential numbering (Join 1, Join 2, etc.)

### Preview Table
- Shows first 10 rows
- Scrollable within dialog
- Column and row counts displayed

## 🔮 Future Enhancements

Possible improvements:
- [ ] Server-side join processing (handle larger datasets)
- [ ] GROUP BY and aggregate functions (SUM, AVG, COUNT)
- [ ] Save merged views as virtual tables
- [ ] Export merged results to CSV/Excel
- [ ] Visual join diagram/flowchart
- [ ] AI-suggested joins based on relationships
- [ ] Incremental loading for large results
- [ ] WHERE clause filtering

## 🐛 Troubleshooting

### "No matching records found after join"
- **Cause**: Join keys don't match any records
- **Solution**: Try LEFT/RIGHT join, or verify key values are identical

### "Failed to fetch table data"
- **Cause**: Invalid table ID or permissions
- **Solution**: Refresh the page, ensure table exists in your tenant

### "Memory error during merge"
- **Cause**: Too much data loaded at once
- **Solution**: Reduce row limit, select fewer columns, or merge fewer tables

### Preview shows data but merge fails
- **Cause**: Full dataset exceeds limits
- **Solution**: Add filters to source tables first, or increase row limit cautiously

## 📈 Performance Tips

1. **Filter First**: Apply WHERE conditions at table level before merging
2. **Select Less**: Only include columns you need
3. **INNER Over FULL**: INNER joins are faster than FULL joins
4. **Limit Results**: Keep under 1000 rows for best performance
5. **Avoid Text Columns**: Large text fields slow down rendering

---

**The merge feature brings SQL-like power to your reporting studio with a user-friendly visual interface!** 🎉

