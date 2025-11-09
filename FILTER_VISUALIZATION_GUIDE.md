# Filter Visualization Guide

## Overview

The Filter visualization allows users to create interactive filters that control data displayed across ALL charts in the Data Lab dashboard. Users can apply multiple filters simultaneously, and all charts will automatically update to show only the filtered data.

## Features

### 1. **Filter Creation**
- Add a Filter visualization from the Visualizations section (first icon)
- Configure which field/column to filter on
- The filter will display all unique values from that field with checkboxes

### 2. **Multiple Filters**
- Add multiple filter visualizations for different fields
- All active filters work together (AND logic)
- Example: Filter by "Region" AND "Product Category" simultaneously

### 3. **Real-Time Updates**
- When you check/uncheck filter values, all charts automatically refresh
- Charts re-aggregate their data based on the active filters
- No need to manually refresh

### 4. **Filter Display**
- Shows all unique values for the selected field
- Displays count of records for each value in parentheses
- Checkbox interface for easy selection/deselection
- "Clear All" button to reset the filter

## How to Use

### Step 1: Add a Filter

1. Click on the **Filter** icon in the Visualizations section (first icon, gray)
2. Click "Add Data" on the newly created filter card
3. Select a **Data Source** (the same data source your charts use)
4. Select a **Filter Field** (the column you want to filter by)
5. Click "Apply"

### Step 2: Select Filter Values

1. The filter will display all unique values from the selected field
2. Check the boxes next to the values you want to include
3. All charts using the same data source will automatically update

### Step 3: Add More Filters (Optional)

1. Repeat Step 1 to add another filter for a different field
2. Multiple filters work together - charts show data that matches ALL active filters

### Step 4: Clear Filters

- Click "Clear All" button on a filter to deselect all values for that filter
- Or manually uncheck individual values
- To remove a filter completely, click the X button on the filter card

## Example Workflow

**Scenario**: Sales dashboard with data containing Region, Product, and Year fields

1. **Add Filter 1**: Region
   - Shows: North, South, East, West
   - Select: North, East
   
2. **Add Filter 2**: Product
   - Shows: Widget, Gadget, Tool
   - Select: Widget
   
3. **Result**: All charts now show only data for:
   - Regions: North OR East
   - Product: Widget
   - Combined: (North OR East) AND Widget

## Technical Details

### How Filters Work

1. **Global State**: Active filters are stored in global state as `{fieldName: [values]}`
2. **Data Filtering**: When aggregating chart data, rows are filtered first before aggregation
3. **Auto-Refresh**: A `useEffect` watches for filter changes and re-fetches/re-aggregates all chart data
4. **Filter Logic**: Multiple filters use AND logic; multiple values within one filter use OR logic

### Filter Types Supported

- **Text fields**: Names, categories, regions, etc.
- **Numeric fields**: Years, IDs, counts (displayed as text)
- **Date fields**: Displayed as formatted strings

### Performance Considerations

- **Optimal**: < 5 filters with < 50 values each
- **Good**: < 10 filters with < 100 values each
- **Maximum**: Limited by browser memory and data source size

### Data Requirements

- Filters must use the SAME data source as the charts they control
- The filter field must exist in the data source
- Charts automatically filter their data based on ALL active filters

## Limitations

1. **Same Data Source**: Filters only affect charts using the same data source
2. **No Cross-Filter**: Clicking on a chart element doesn't update filters (one-way)
3. **OR within, AND across**: Values in one filter use OR logic, different filters use AND logic

## Best Practices

### Filter Placement

- Place filters on the left or top of your dashboard
- Keep filters small (height: 2-3 grid units)
- Group related filters together

### Filter Selection

- Choose high-cardinality fields for filters (fields with many distinct values)
- Avoid filtering on unique identifiers (too many values)
- Common filter fields: Region, Category, Year, Status, Type

### User Experience

- Label filters clearly (rename the chart title)
- Start with no values selected, or common defaults
- Add multiple filters for drill-down analysis
- Use "Clear All" to reset complex filter combinations

## Troubleshooting

### Filters Not Working?

1. **Check Data Source**: Ensure the filter and charts use the same data source
2. **Check Field Names**: The filter field must exist in the data
3. **Refresh Page**: Clear localStorage if needed
4. **Check Console**: Look for errors in browser DevTools

### Charts Not Updating?

1. **Select Filter Values**: Charts only filter when you check boxes
2. **Check Chart Data**: Ensure charts have data configured (not just added)
3. **Wait for Refresh**: Large datasets may take a moment to re-aggregate

### Filter Shows "N/A"?

- This indicates null/empty values in the source data
- You can filter by "N/A" to show records with missing data

## Advanced Use Cases

### Cascading Filters

While not natively supported, you can simulate cascading filters:
1. Filter by Region → updates all charts
2. See which Products exist in that Region from updated charts
3. Add Product filter with relevant values

### Date Range Filtering

For date ranges:
1. Create a calculated field for "Year" or "Month" in the Database tab
2. Use that calculated field as a filter
3. Select multiple years/months for a range

### Dynamic Dashboards

Create different dashboard views by:
1. Setting up multiple filter combinations
2. Saving screenshots of each configuration
3. Or using browser bookmarks with different filter states (if implementing URL state)

## Future Enhancements

Potential improvements:
- Search within filter values
- Select All / Deselect All buttons
- Filter value sorting options
- Date range picker for date fields
- Numeric range slider for numeric fields
- Filter dependencies (cascading filters)
- Save filter presets
- URL state persistence



