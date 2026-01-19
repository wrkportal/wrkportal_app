# Clear Browser LocalStorage

To complete the first-time setup, you need to clear browser localStorage which stores widget preferences.

## Method 1: Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Run this command:

```javascript
// Clear all dashboard widget preferences
const keys = Object.keys(localStorage);
keys.forEach(key => {
  if (key.includes('widgets') || key.includes('layout') || key.includes('dashboard')) {
    localStorage.removeItem(key);
    console.log('Removed:', key);
  }
});
console.log('✅ All dashboard preferences cleared!');
```

## Method 2: Clear All LocalStorage

```javascript
localStorage.clear();
console.log('✅ All localStorage cleared!');
```

## Method 3: Manual Browser Settings

1. Open Browser Settings
2. Go to Privacy/Security
3. Clear browsing data
4. Select "Cookies and other site data"
5. Select "Cached images and files"
6. Choose "All time"
7. Click "Clear data"

## After Clearing

1. Refresh the page
2. All dashboards will show welcome messages
3. All widgets will be hidden by default
4. Users can add widgets as needed
