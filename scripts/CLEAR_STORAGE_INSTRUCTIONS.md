# Clear Browser Storage Instructions

To see welcome messages on all dashboards, you need to clear the browser's localStorage which stores widget preferences.

## Quick Method (Browser Console)

1. Open your browser's Developer Tools (Press `F12`)
2. Go to the **Console** tab
3. Copy and paste this code:

```javascript
// Clear all dashboard widget preferences
const keys = Object.keys(localStorage);
let clearedCount = 0;

keys.forEach(key => {
  if (
    key.includes('widgets') || 
    key.includes('layout') || 
    key.includes('dashboard') ||
    key.includes('-widgets') ||
    key.includes('-layouts') ||
    key.includes('-layout')
  ) {
    localStorage.removeItem(key);
    clearedCount++;
    console.log('✓ Removed:', key);
  }
});

console.log(`\n✅ Cleared ${clearedCount} dashboard preference(s)!`);
console.log('🔄 Please refresh the page to see welcome messages on all dashboards.');
```

4. Press Enter to run
5. Refresh the page (Press `Ctrl+Shift+R` or `Cmd+Shift+R` on Mac)

## Alternative: Clear Everything

If you want to clear ALL localStorage (including other app data):

```javascript
localStorage.clear();
console.log('✅ All localStorage cleared!');
location.reload();
```

## What Gets Cleared

- `sales-dashboard-widgets`
- `operations-widgets`
- `it-widgets`
- `recruitment-widgets`
- `pm-widgets`
- `finance-widgets`
- `project-dashboard-widgets`
- All `-layouts` and `-layout` keys
- Any other dashboard-related preferences

## After Clearing

1. Refresh the page
2. Navigate to any dashboard
3. You should see:
   - Welcome message with action buttons
   - No widgets visible by default
   - Option to add widgets from the widget gallery

## Verify It Worked

After clearing, check localStorage again:

```javascript
const dashboardKeys = Object.keys(localStorage).filter(key => 
  key.includes('widgets') || key.includes('layout') || key.includes('dashboard')
);
console.log('Remaining dashboard keys:', dashboardKeys);
// Should be empty or only contain new keys you just created
```
