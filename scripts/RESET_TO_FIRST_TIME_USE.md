# Reset to First-Time Use Environment

This guide will help you reset the application to a first-time use state, showing welcome messages on all dashboards.

## Steps to Reset

### 1. Clean the Database

Run the database cleanup script:

```bash
# Using tsx (recommended)
npx tsx scripts/clean-database.ts

# Or using ts-node
npx ts-node scripts/clean-database.ts

# Or compile and run
tsc scripts/clean-database.ts
node scripts/clean-database.js
```

This will:
- Delete all data from all tables
- Preserve the database schema
- Keep user accounts (you may want to delete test users separately)

### 2. Clear Browser LocalStorage

Open your browser's Developer Console (F12) and run:

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

Or clear everything:

```javascript
localStorage.clear();
console.log('✅ All localStorage cleared!');
```

### 3. Restart the Application

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### 4. Verify

1. Log in to the application
2. Navigate to any dashboard (Sales, Operations, IT, Recruitment, Product Management, Finance, Projects)
3. You should see:
   - Welcome message with action buttons
   - No widgets visible by default
   - Option to add widgets from the widget gallery

## What Gets Reset

### Database
- ✅ All tasks
- ✅ All projects
- ✅ All sales data (leads, opportunities, accounts, contacts)
- ✅ All collaborations and messages
- ✅ All calls
- ✅ All OKRs
- ✅ All notifications
- ✅ All operations data
- ✅ All IT data
- ✅ All recruitment data
- ✅ All finance data
- ✅ All widget default preferences

### Browser Storage
- ✅ Widget visibility preferences
- ✅ Layout configurations
- ✅ Task view modes
- ✅ Useful links
- ✅ Other dashboard-specific preferences

## What Stays

- ✅ User accounts (you may want to delete test users)
- ✅ Database schema
- ✅ Application configuration
- ✅ Authentication settings

## Welcome Messages

After reset, all dashboards will show welcome messages:

- **Sales Dashboard**: "Welcome to Your Sales Dashboard" with buttons to Create Lead, Create Opportunity, Create Contact, Create Account
- **Operations Dashboard**: "Welcome to Your Operations Dashboard" with buttons to Add Widget, View Tasks
- **IT Dashboard**: "Welcome to Your IT Dashboard" with buttons to Add Widget, View Tickets
- **Recruitment Dashboard**: "Welcome to Your Recruitment Dashboard" with buttons to Add Widget, View Candidates
- **Product Management Dashboard**: "Welcome to Your Product Management Dashboard" with buttons to Add Widget, View Projects
- **Finance Dashboard**: "Welcome to Your Finance Dashboard" with buttons to Add Widget, View Reports
- **Projects Dashboard**: "Welcome to Your Projects Dashboard" with buttons to Add Widget, Create Project

## Adding Widgets

Users can add widgets by:
1. Clicking the widget gallery icon in the dashboard header
2. Selecting widgets to add
3. Widgets will appear on the pinboard
4. Widgets can be dragged and resized
5. Preferences are saved automatically

## Troubleshooting

If welcome messages don't appear:

1. **Check localStorage**: Make sure you cleared all dashboard-related keys
2. **Check database**: Verify the cleanup script ran successfully
3. **Hard refresh**: Press Ctrl+Shift+R (or Cmd+Shift+R on Mac) to clear cache
4. **Check console**: Look for any JavaScript errors in the browser console
5. **Verify widgets**: Check that all widgets are set to `visible: false` in localStorage

## Production Warning

⚠️ **DO NOT** run the cleanup script in production without:
- Backing up the database first
- Notifying all users
- Having a rollback plan
- Testing in a staging environment first
