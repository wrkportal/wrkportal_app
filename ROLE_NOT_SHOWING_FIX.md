# Role Not Showing in App - Fix Guide

## Problem
You changed the role in SQL but the app still shows the old role.

## Why This Happens
- Your session is cached when you log in
- NextAuth stores user info in JWT or session
- Database changes don't automatically update active sessions
- You need to refresh the session

---

## ✅ Quick Fix (Recommended)

### **1. Log Out and Log Back In**

This is the simplest solution:

1. Click your profile icon (top-right corner)
2. Click **"Logout"**
3. Log in again with the same credentials
4. ✅ Your new role (TENANT_SUPER_ADMIN) should now be visible!

### **Verify It Worked:**
- After logging back in, check the sidebar
- You should now see **"Admin"** section at the bottom
- Click Admin to see **"Tutorials"** option

---

## Alternative Fixes

### **2. Clear Browser Data**

If logging out doesn't work:

1. **Chrome/Edge:**
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Select "Cookies and other site data"
   - Select "Cached images and files"
   - Click "Clear data"

2. **Firefox:**
   - Press `Ctrl+Shift+Delete`
   - Select "Cookies" and "Cache"
   - Click "Clear Now"

3. **Close browser completely and reopen**
4. Log in again

### **3. Hard Refresh**

Try a hard refresh:
- **Windows:** `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac:** `Cmd + Shift + R`
- Then log out and back in

### **4. Incognito/Private Window**

Test in a fresh session:
1. Open incognito/private window
2. Navigate to your app
3. Log in
4. Check if role is correct

If it works here, clear your main browser's cookies/cache.

---

## 🔍 Verify Role in Database

First, confirm the role was actually changed:

```sql
SELECT id, email, name, role, updatedAt 
FROM "User" 
WHERE email = 'your@email.com';
```

**Expected output:**
```
role              | updatedAt
------------------|---------------------------
TENANT_SUPER_ADMIN| 2025-11-04 10:30:00
```

If it shows a different role, run the update again:
```sql
UPDATE "User" 
SET role = 'TENANT_SUPER_ADMIN' 
WHERE email = 'your@email.com';
```

---

## 🐛 Advanced Troubleshooting

### **Check Session in Browser**

1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Look under **Cookies**
4. Find cookies for your domain
5. Look for `next-auth.session-token` or similar
6. Delete this cookie
7. Refresh page - you'll be logged out
8. Log back in

### **Check Environment Variables**

Ensure these are set in your `.env`:
```bash
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

If these changed recently, restart your dev server:
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### **Force Session Refresh (Code Solution)**

If the issue persists, you might need to update the session callback.

Check `auth.ts` or `auth.config.ts`:

```typescript
callbacks: {
  async session({ session, token }) {
    if (session.user) {
      // This forces fetching fresh user data
      const freshUser = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { id: true, email: true, name: true, role: true, tenantId: true }
      })
      
      if (freshUser) {
        session.user = {
          id: freshUser.id,
          email: freshUser.email!,
          name: freshUser.name,
          role: freshUser.role,
          tenantId: freshUser.tenantId
        }
      }
    }
    return session
  }
}
```

---

## 📝 Step-by-Step: Complete Reset

If nothing above works, follow this complete reset:

### **Step 1: Verify Database**
```sql
SELECT email, role FROM "User" WHERE email = 'your@email.com';
```
Should show: `TENANT_SUPER_ADMIN`

### **Step 2: Clear All Browser Data**
1. Close ALL browser tabs for your app
2. Clear cookies, cache, and site data
3. Close browser completely

### **Step 3: Restart Server**
```bash
# In your terminal, stop the dev server (Ctrl+C)
npm run dev
```

### **Step 4: Fresh Login**
1. Open browser
2. Go to your app URL
3. Log in with your credentials
4. Check for Admin menu

---

## ✅ How to Know It's Working

After logging back in, you should see:

### **In Sidebar (Bottom):**
```
🤖 AI Assistant
⚙️ Admin  ←── This should now be visible!
```

### **Click Admin, You Should See:**
```
⚙️ Admin ▼
   👥 Organization
   🎓 Tutorials  ←── This is new!
   🛡️ SSO Settings
   🛡️ Security
   📄 Audit Log
```

### **Navigate to `/admin/tutorials`:**
- Should load the Tutorial Management page
- Should see "Add Tutorial" button
- Should NOT see "Access Denied" message

---

## ⚠️ Common Mistakes

### ❌ **Wrong Email**
```sql
-- Check exact email (case-sensitive)
SELECT email FROM "User";
```

### ❌ **Wrong Role Name**
```sql
-- Must be exactly this (uppercase, with underscores)
UPDATE "User" SET role = 'TENANT_SUPER_ADMIN' WHERE ...;

-- ❌ WRONG:
-- 'tenant_super_admin'
-- 'TenantSuperAdmin'
-- 'SUPER_ADMIN'
```

### ❌ **Wrong Database**
```sql
-- Verify you're in the correct database
SELECT current_database();
```

### ❌ **Multiple Users**
```sql
-- If you have multiple users, make sure you're logged in as the one you updated
SELECT email, role FROM "User" WHERE role = 'TENANT_SUPER_ADMIN';
```

---

## 🔄 Session Refresh Workflow

```
1. Change role in database
   ↓
2. Session still has old role (cached)
   ↓
3. Log out (clears session)
   ↓
4. Log in (creates new session with fresh data)
   ↓
5. New role now active! ✅
```

---

## 🆘 Still Not Working?

### **Try This Debug Query:**
```sql
-- Get complete user info
SELECT 
  id,
  email,
  name,
  role,
  tenantId,
  createdAt,
  updatedAt,
  lastLogin
FROM "User" 
WHERE email = 'your@email.com';
```

### **Check Browser Console:**
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors
4. Share any errors you see

### **Check Network Tab:**
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Log out and back in
5. Look for auth-related requests
6. Check response data

---

## 💡 Pro Tips

### **For Development:**
- Restart dev server after database changes
- Use Prisma Studio to verify changes
- Clear browser cache regularly

### **For Production:**
- Users must log out/in after role changes
- Consider implementing a "refresh session" button
- Document this for your team

### **Best Practice:**
```typescript
// Add this to your user profile dropdown
<DropdownMenuItem onClick={() => {
  signOut({ callbackUrl: '/login' })
}}>
  <LogOut className="mr-2 h-4 w-4" />
  Logout & Refresh Session
</DropdownMenuItem>
```

---

## Quick Checklist

- [ ] Role updated in database (verified with SELECT query)
- [ ] Logged out of application
- [ ] Cleared browser cookies/cache
- [ ] Closed all browser tabs
- [ ] Restarted dev server (if in development)
- [ ] Logged back in
- [ ] Admin menu now visible?

If you've checked all boxes and it still doesn't work, there may be a code issue. Let me know!

---

## TL;DR - Just Do This:

```bash
1. Verify in database:
   SELECT email, role FROM "User" WHERE email = 'your@email.com';
   
2. Log out of the app

3. Close browser completely

4. Reopen browser

5. Log back in

6. Check sidebar for "Admin" menu at bottom

✅ Should work now!
```

---

**Most Common Solution:** Just log out and log back in! 🔄

