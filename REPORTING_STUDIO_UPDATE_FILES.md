# Reporting Studio - File Update & Auto-Remerge Feature

## Overview
The File Update feature allows users to update their uploaded data files while maintaining data integrity and automatically updating any merged files that depend on them.

## How It Works

### 1. Update a File
Each uploaded file in the sidebar has an "Update" button (refresh icon) that appears on hover.

**Process:**
1. Click the refresh icon next to any uploaded file
2. Select the new/updated file from your computer
3. System validates that headers match the original file
4. If headers match, the file is replaced
5. If headers don't match, you'll see an error showing the mismatch

### 2. Header Validation
The system ensures data consistency by validating that:
- The new file has the same number of columns
- All column names match exactly (case-sensitive)

**If headers don't match:**
- You'll see a clear error message showing:
  - Old headers: [list of original columns]
  - New headers: [list of new columns]
- The update is rejected to prevent breaking merged files

### 3. Automatic Re-Merge
When you update a source file that's used in merged tables:

1. **Dependency Tracking**: System identifies all merged files that use the updated file
2. **Auto-Update**: Automatically re-runs the merge operation for each dependent file
3. **Notification**: You'll see a message like:
   ```
   File updated successfully! 
   3 merged file(s) were automatically updated.
   ```

## Database Schema

### ReportingFile Model
```prisma
model ReportingFile {
  // ... existing fields ...
  
  // Merge tracking fields
  isMerged      Boolean  @default(false)
  mergeConfig   Json?
  sourceFiles   String[] @default([])
}
```

**Fields:**
- `isMerged`: Indicates if this file was created through a merge operation
- `mergeConfig`: Stores the complete merge configuration (joins, columns, etc.)
- `sourceFiles`: Array of source file IDs used in the merge

## API Endpoints

### POST `/api/reporting-studio/files/[id]/update`
Updates an existing file with validation.

**Request:**
- Multipart form data with `file` field
- File must be CSV or Excel format

**Response (Success):**
```json
{
  "success": true,
  "file": {
    "id": "...",
    "name": "...",
    "rowCount": 100,
    "columnCount": 5
  },
  "dependentFiles": [
    {
      "id": "...",
      "name": "Merged Report",
      "config": { ... }
    }
  ],
  "message": "File updated successfully"
}
```

**Response (Header Mismatch):**
```json
{
  "error": "Header mismatch",
  "message": "The new file headers do not match the original file headers",
  "oldHeaders": ["ID", "Name", "Date"],
  "newHeaders": ["ID", "Full Name", "Date"]
}
```

### POST `/api/reporting-studio/remerge`
Re-executes a merge operation for a merged file.

**Request:**
```json
{
  "fileId": "merged_file_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Merged file updated successfully"
}
```

## Usage Examples

### Example 1: Simple Update
```
1. You have "Sales_2024.xlsx" uploaded
2. You click the refresh icon
3. Upload "Sales_2024_Updated.xlsx" with same headers
4. File is updated with new data
5. Success message appears
```

### Example 2: Update with Dependencies
```
1. You have two files:
   - "Customers.xlsx"
   - "Orders.xlsx"
   
2. You created a merged file:
   - "Customer_Orders_Merged.xlsx" (from Customers + Orders)
   
3. You update "Customers.xlsx" with new customer data

4. System automatically:
   - Updates "Customers.xlsx"
   - Detects "Customer_Orders_Merged.xlsx" depends on it
   - Re-runs the merge with new customer data
   - Updates "Customer_Orders_Merged.xlsx"
   
5. You see: "File updated successfully! 1 merged file(s) were automatically updated."
```

### Example 3: Header Mismatch
```
1. Original file has columns: ["ID", "Name", "Email"]
2. You try to update with columns: ["ID", "Full_Name", "Email"]
3. System rejects the update
4. Error shows:
   - Old headers: ID, Name, Email
   - New headers: ID, Full_Name, Email
5. You fix the column name and try again
```

## Benefits

1. **Data Freshness**: Keep your reports up-to-date with latest data
2. **Consistency**: Header validation ensures merged files don't break
3. **Automation**: No need to manually recreate merged files
4. **Transparency**: Clear feedback about what files are affected
5. **Efficiency**: Update once, all dependent reports update automatically

## UI/UX

### Visual Indicators
- **Update Icon**: Refresh/circular arrows icon (appears on hover)
- **Spinning Icon**: When update is in progress
- **Success Alert**: Shows number of dependent files updated
- **Error Alert**: Shows detailed header mismatch information

### User Flow
1. Hover over a file → Update icon appears
2. Click update icon → File picker opens
3. Select new file → Upload and validation
4. See progress → Spinning icon
5. Get feedback → Success or error message

## Error Handling

The system handles these scenarios:
- **File not found**: Clear error message
- **Unauthorized**: User can only update their own files
- **Unsupported format**: Only CSV and Excel allowed
- **Header mismatch**: Detailed comparison shown
- **Re-merge failure**: Individual errors caught and reported

## Performance Considerations

- Updates are processed synchronously for immediate feedback
- Re-merge operations run in parallel for speed
- Large files may take longer to process
- User sees loading indicators throughout

## Security

- Users can only update files they uploaded
- Tenant isolation ensures no cross-tenant updates
- File validation prevents malicious uploads
- Merge configurations are validated before re-execution

## Future Enhancements

Potential improvements:
1. Batch file updates
2. Schedule automatic updates
3. Version history for files
4. Rollback to previous versions
5. Diff view showing what changed
6. Email notifications for dependent file updates

