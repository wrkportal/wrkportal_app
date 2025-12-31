# Integration Install Issue - Debug Guide

## 🔍 Problem
After installing a template, the integration doesn't appear in "My Integrations" tab.

## ✅ Fixes Applied

### **1. Enhanced Logging**
- Added console logs in install flow
- Added logs in fetchIntegrations to see what's being fetched
- Added logs in API routes to track tenantId and integration creation

### **2. Improved Tab Switching**
- Added automatic tab switch after installation
- Added delay to ensure database write completes
- Added double-fetch to ensure data is loaded

### **3. Better Error Handling**
- Added detailed error messages
- Added fallback to refresh if integration doesn't appear

## 🔧 What to Check

### **Check Browser Console:**
1. After installing, look for:
   - `Install successful, response:` - Should show integration data
   - `Fetching integrations for tenantId:` - Should show your tenant ID
   - `Found X integration(s)` - Should show count > 0

### **Check Server Console (Terminal):**
1. Look for:
   - `Installation successful, created integration:` - Shows integration was created
   - Integration details with id, name, tenantId

### **Possible Issues:**

#### **1. Tenant ID Mismatch**
- Integration created with one tenantId
- Fetch query uses different tenantId
- **Solution:** Check console logs for tenantId consistency

#### **2. Database Transaction Not Committed**
- Integration created but not yet committed
- Fetch happens too quickly
- **Solution:** Added 300ms delay before fetch

#### **3. Prisma Client Out of Date**
- New integration not visible to Prisma client
- **Solution:** Restart dev server after migrations

#### **4. Permission Check Failing**
- Integration created but permission check fails on fetch
- **Solution:** Check browser console for permission errors

## 🛠️ Debug Steps

1. **Install a template**
2. **Check browser console** - Look for logs
3. **Check server console** - Look for creation logs
4. **Manual refresh** - Click refresh or reload page
5. **Check database directly** - Query Integration table
6. **Check network tab** - Verify API responses

## 📋 Next Steps

If integration still doesn't appear:

1. **Open browser console** (F12)
2. **Install a template**
3. **Copy all console logs** 
4. **Check:**
   - Does "Install successful" appear?
   - Does "Found X integration(s)" show 0 or 1+?
   - Any error messages?

5. **If still not working:**
   - Check server terminal for errors
   - Verify database has the integration row
   - Check tenantId matches in all logs

## 🚀 Quick Fixes

### **Manual Refresh:**
- Click the refresh button in "My Integrations" tab
- Or reload the page (F5)

### **Check Integration Directly:**
```javascript
// In browser console, run:
fetch('/api/integrations').then(r => r.json()).then(console.log)
```

This will show all integrations returned by the API.

