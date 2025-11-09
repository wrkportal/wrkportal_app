# Chart Properties Guide

## Page Settings

### Canvas Background Color
At the top of the sidebar, you'll find **Page Settings** with a **Canvas Background Color** picker:

- Click the color square to choose any background color for your dashboard canvas
- The color code is displayed next to the picker (e.g., `#f8fafc`)
- Click **Reset** to return to the default light gray background
- The background color persists across page refreshes
- **This affects the main canvas area** where all your charts are displayed

**Recommended Background Colors:**
- Light Gray (default): `#f8fafc` - Professional, clean look
- Light Blue: `#e0f2fe` - Calming, corporate
- Light Green: `#dcfce7` - Fresh, data-focused
- Light Purple: `#f3e8ff` - Creative, modern
- Dark Gray: `#1e293b` - For dark mode dashboards
- Custom colors work great for branded dashboards!

---

## How to Use Chart Properties

### Step 1: Select a Chart
Click on any chart in the Data Lab to select it and load its properties in the sidebar.

### Step 2: Modify Properties
Once selected, you can modify properties in the **CHART PROPERTIES** section of the sidebar:

- **Title**: Customize font, size, color, alignment, and style (bold, italic, underline)
- **Legend**: Show/hide legend and set its position (top, bottom, left, right)
- **Axis**: Customize axis labels font, size, color, and style
- **Data Labels**: Show/hide data labels, customize position, font, and color
- **Styling**: 
  - **Chart Background Color**: The background color of the individual chart card
  - **Background Transparency**: Controls how see-through the chart card is (0% = solid, 100% = fully transparent)
  - **Show Grid**: Toggle grid lines on/off (cartesian charts only)

### Step 3: Properties Persist
All property changes are automatically saved to localStorage and will persist across page refreshes.

---

## Understanding Background Colors & Transparency

### Canvas Background vs Chart Background

There are **TWO** different backgrounds you can control:

1. **Canvas Background** (Page Settings)
   - This is the color of the main dashboard area
   - Set in the "Page Settings" section at the top of the sidebar
   - Affects the entire canvas where charts are placed
   - Example: Set to pink (`#ec4899`) for a vibrant dashboard background

2. **Chart Background Color** (Chart Properties)
   - This is the color of each individual chart card
   - Set in the "Styling" section of Chart Properties
   - Default is white (`#ffffff`)
   - Each chart can have a different background color
   - Works together with "Background Opacity" to control transparency

### How to Use Transparency Effectively

**Example 1: Fully Transparent Charts on Colored Canvas (Glass Effect)**
1. Set **Canvas Background** to pink (`#ec4899`)
2. Select a chart
3. Keep **Chart Background Color** as white (`#ffffff`)
4. Set **Background Transparency** to 100%
5. Result: The chart data floats on the pink canvas with NO visible card background - you see the pink canvas behind it!

**Example 2: Semi-Transparent Charts**
1. Set **Canvas Background** to light blue (`#e0f2fe`)
2. Select a chart
3. Set **Chart Background Color** to white (`#ffffff`)
4. Set **Background Transparency** to 50%
5. Result: The chart card is semi-transparent, blending white and blue

**Example 3: Solid Colored Charts (No Transparency)**
1. Keep **Canvas Background** at default light gray
2. Select a chart
3. Set **Chart Background Color** to light green (`#dcfce7`)
4. Set **Background Transparency** to 0%
5. Result: Solid green chart card - completely opaque, no see-through effect

---

## Chart-Specific Behavior

### Pie Charts
- **Grid**: Pie charts do NOT have grids (this is by design - grids only apply to cartesian charts like Bar, Line, Area)
- **Multi-colored Slices**: Pie chart slices use a predefined color palette (red, blue, green, yellow, purple, orange, pink, cyan)
- **Chart Background**: The pie chart's card background can still be customized with color and opacity
- **Drill-Down**: Configure decomposition fields in "Add Data" to enable hierarchical drill-down

### Bar, Line, Area, Scatter Charts
- **Grid**: Toggle on/off the background grid
- **Data Color**: The bars, lines, areas, and scatter points use the chart's data color (default blue `#3b82f6`)
- **Chart Background**: The card background can be customized independently
- **Axes**: Both X and Y axes can be customized

---

## Troubleshooting

### Properties Not Showing/Working?
1. **Make sure a chart is selected**: Click on the chart first
2. **Expand property sections**: Click on the buttons (Title, Legend, Axis, etc.) to expand each section
3. **Clear localStorage**: If charts were created before the properties feature, you may need to clear localStorage:
   - Open browser DevTools (F12)
   - Go to Application > Local Storage > http://localhost:3000
   - Delete `datalab-charts` and `datalab-layout`
   - Refresh the page and add new charts

### Background Opacity Not Working?
- Ensure you have selected a chart (click on it)
- The transparency slider is in the "Styling" section under "Background Transparency"
- **Remember**: 
  - **0% = Solid** (fully opaque, no transparency)
  - **100% = Fully Transparent** (see-through, invisible background)
- The effect is more visible when:
  - The canvas background is a different/vibrant color
  - You increase the transparency above 50%
- At 0% transparency, the chart background is fully solid
- At 100% transparency, you see completely through the chart background to the canvas behind it

### Chart Background Color Not Changing?
- Make sure you've selected a chart first (click on it)
- The color picker is in the "Styling" section labeled "Chart Background Color"
- This is different from the data color (bars/lines) - it's the card background
- Changes apply immediately
- If not working, try clearing localStorage (see above)

### Canvas Background Not Changing?
- The canvas background picker is at the TOP of the sidebar in "Page Settings"
- It affects the entire dashboard area, not individual charts
- Click "Reset" to return to default light gray
- This setting persists across page refreshes

---

## Migration from Old Charts

If you have charts created before the properties feature was added, they will be automatically migrated with default properties when you refresh the page. However, if you experience issues:

1. Back up your work (export or screenshot your charts)
2. Clear localStorage (see Troubleshooting above)
3. Recreate your charts with the new property system

---

## Performance Note

Chart properties are stored in localStorage along with chart data. For optimal performance:
- Avoid creating too many charts (recommended: < 20 charts per Data Lab session)
- If you notice slowdowns, consider clearing old/unused charts
- Each property change triggers a re-render of the chart
