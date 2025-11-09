# Pie Chart Multi-Selection Drill-Down Guide

## Overview
Enhanced pie chart drill-down functionality with multi-selection support, visual indicators, and **animated connection lines** that visually connect parent segments to their drill-down charts.

## New Features

### 1. **Visual Connection Lines** ✨
   - **Curved Lines**: Smooth bezier curves connect each pie segment to its corresponding drill-down chart
   - **Color-Coded**: Lines match the segment color for easy identification
   - **Directional Arrows**: Arrow heads point from parent to child
   - **Start Indicators**: Colored dots mark the origin point on the parent segment
   - **Non-Intrusive**: Lines are semi-transparent and don't interfere with interactions

### 2. **Multi-Selection Drill-Down**
   - **Single-Click (Normal Mode)**: Click on any pie slice to immediately create a drill-down chart for that segment
   - **Multi-Select Mode (Ctrl/Cmd + Click)**: Hold Ctrl (Windows/Linux) or Cmd (Mac) while clicking to select multiple slices
   - When segments are selected, a "Drill Down (n)" button appears in the chart header
   - Click the button to create drill-down charts for all selected segments at once

### 3. **Visual Indicators**

#### For Parent Charts:
   - **Selected Segments Display**: Shows badges with the names of selected segments, color-coded to match the pie chart colors
   - **Drill Down Button**: Appears when segments are selected, showing the count of selected segments
   - **Reset Button**: Appears when drill-down charts exist, allowing you to remove all drill-down charts at once

#### For Drill-Down Charts:
   - **Color Indicator**: A colored circle at the top of the chart showing which parent segment it represents
   - **"Drill-down from" Label**: Shows the parent segment name (e.g., "Drill-down from: Category A")
   - **Breadcrumb Path**: Shows the full drill-down path (e.g., "Region > Country > City")
   - **Connection Line**: Visual curved line from parent segment to drill-down chart

#### On Pie Slices:
   - **Visual Selection Feedback**:
     - Selected slices have reduced opacity (0.7)
     - White border (stroke) around selected slices
     - Hover cursor changes to pointer when drill-down is available

### 4. **Color Consistency**
   - Each segment maintains the same color across parent and drill-down charts
   - Connection lines match segment colors
   - Colors are assigned based on segment position in the parent chart
   - This makes it easy to visually connect drill-down charts to their parent segments

## Usage Instructions

### Single Segment Drill-Down:
1. Configure a pie chart with drill-down levels
2. Click on any pie slice
3. A new drill-down chart appears immediately showing the breakdown of that segment
4. A curved connection line appears linking the segment to its drill-down chart

### Multiple Segment Drill-Down:
1. Configure a pie chart with drill-down levels
2. Hold Ctrl (or Cmd on Mac) and click on multiple pie slices
3. Selected slices will show with a white border and reduced opacity
4. Selected segment names appear as colored badges in the chart header
5. Click the "Drill Down (n)" button to create drill-down charts for all selected segments
6. All drill-down charts appear in a grid layout below the parent chart
7. Connection lines appear for each drill-down, color-coded to their parent segments

### Managing Drill-Down Charts:
- **Remove Individual Drill-Down**: Click the X button on any drill-down chart (connection line disappears)
- **Reset All Drill-Downs**: Click the "Reset" button on the parent chart to remove all drill-down charts and clear selections
- **Clear Selections**: Click selected slices again while holding Ctrl/Cmd to deselect them

## Configuration

In the chart configuration dialog:
1. Select a pie chart
2. In the "Drill-Down Levels (Optional)" section:
   - Add drill-down levels (up to 3 levels)
   - The first level is your X-axis (already selected)
   - Each additional level represents a deeper breakdown

Example hierarchy:
- Level 1 (X-axis): Region
- Level 2: Country
- Level 3: City

## Visual Layout

Drill-down charts are automatically positioned:
- Arranged in a 3-column grid below the parent chart
- Each drill-down maintains the same size as the parent
- Charts stack vertically when more than 3 drill-downs exist
- Connection lines dynamically adjust to chart positions
- Lines are drawn from the center of each segment to the top-center of its drill-down chart

## Benefits

1. **Compare Multiple Segments**: Drill down into several segments simultaneously to compare their breakdowns
2. **Visual Clarity**: Connection lines make it immediately clear which drill-down belongs to which parent segment
3. **Color Coordination**: Consistent color scheme across segments, badges, indicators, and connection lines
4. **Efficient Exploration**: Select multiple interesting segments at once instead of drilling down one at a time
5. **Easy Navigation**: Reset button allows quick return to the parent view
6. **Professional Appearance**: Similar to marketing infographic style with connecting lines

## Technical Details

### Connection Line Rendering:
- **SVG Overlay**: Absolute positioned SVG layer over the grid layout
- **Quadratic Bezier Curves**: Smooth curves using quadratic bezier paths
- **Dynamic Calculation**: Line positions recalculate based on:
  - Parent chart position and size
  - Child chart position and size
  - Pie segment angle and position
  - Grid layout coordinates

### Line Calculation Algorithm:
1. Calculate parent segment angle based on data values
2. Determine the midpoint angle of the segment
3. Calculate X/Y coordinates at the edge of the segment
4. Calculate top-center of drill-down chart
5. Create curved path with control point for smooth bezier curve
6. Add arrow marker at the end
7. Add dot indicator at the start

### State Management:
- `selectedPieSegments`: Tracks which segments are selected per chart
- `drillDownSegment`: Stores the parent segment name for each drill-down chart
- Color mapping ensures consistent colors across related charts and connection lines

### Event Handling:
- Detects Ctrl/Cmd key press to toggle multi-select mode
- Native Recharts onClick event captures segment data and browser event
- Pointer-events disabled on SVG overlay to prevent click interference

### Chart Relationships:
- Each drill-down chart has a `drillDownParent` property linking it to the parent
- Parent charts can identify their children for batch operations (like reset)
- Connection lines are only drawn when both parent and child charts exist in layout

## Connection Line Properties

- **Stroke Width**: 3px for visibility
- **Opacity**: 0.6 (60%) for subtlety
- **Color**: Matches parent segment color
- **Style**: Curved bezier path
- **Arrow**: SVG marker at end point
- **Start Indicator**: 5px radius circle with white stroke
- **Z-Index**: 1 (above grid but below chart interactions)
- **Pointer Events**: None (lines don't interfere with clicks)

