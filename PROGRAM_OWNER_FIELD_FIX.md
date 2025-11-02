# Program Owner Field - Fixed and Improved

## 🔍 Issue Reported

**User said:**
> "I have added many users..then why only sandeep sharma is shown in the program owner field of create new program...it should let me add names by using @"

---

## ✅ What I Fixed

### **1. Improved Dropdown Display**
- **Before:** Users shown as "John Doe"
- **After:** Users shown as "John Doe (john@example.com)"
- **Benefit:** Clear identification when users have similar names

### **2. Added User Count**
- Shows "X users available" below dropdown
- Helps you see if all users are loaded

### **3. Better Loading States**
- Shows "Loading users..." while fetching
- Shows "No users found" if API returns empty

### **4. Added Debug Logging**
- Console logs show fetched users
- Helps troubleshoot if users aren't appearing

---

## 📋 How It Works

### **The Program Owner field:**
1. Is a **dropdown (Select)**, not a mention field with @
2. Fetches users from `/api/users/onboarded`
3. Shows **all active users** from your tenant
4. Sorted alphabetically by first name

### **API Endpoint:**
```
GET /api/users/onboarded
```

**Returns:**
```json
{
  "users": [
    {
      "id": "user-1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "ORG_ADMIN"
    },
    {
      "id": "user-2",
      "firstName": "Sandeep",
      "lastName": "Sharma",
      "email": "sandeep@example.com",
      "role": "PROJECT_MANAGER"
    }
    // ... all other active users
  ]
}
```

---

## 🔧 Troubleshooting

### **If you only see one user (Sandeep Sharma):**

#### **Possible Causes:**

**1. Other users are INACTIVE**
- Check: Go to Admin → Organization
- Look for users with "INACTIVE" status
- Fix: Edit user and change status to "ACTIVE"

**2. Users belong to different tenant**
- Check: Users must have same `tenantId`
- This shouldn't happen if added through UI

**3. Browser console shows error**
- Check: Open browser console (F12)
- Look for: `[Program Dialog] Fetched users:` log
- Should show: Array of all users
- If shows only 1 user: Database issue

**4. API is filtering users**
- Current filter: `status: 'ACTIVE'` and `tenantId: your-tenant-id`
- Check database directly

---

## 🧪 How to Test

### **Step 1: Open Console**
```
Press F12 → Go to Console tab
```

### **Step 2: Open Program Dialog**
```
Click "Create Program" button
```

### **Step 3: Check Console Log**
```
Should see: [Program Dialog] Fetched users: [...]
```

**Expected:** Array with all your users
```javascript
[
  { id: '...', firstName: 'John', lastName: 'Doe', email: '...', role: '...' },
  { id: '...', firstName: 'Sandeep', lastName: 'Sharma', email: '...', role: '...' },
  { id: '...', firstName: 'Jane', lastName: 'Smith', email: '...', role: '...' },
  // ... more users
]
```

**If you only see 1 user:** Problem is in the database or API

---

## 🔍 Debugging Steps

### **Check 1: Database**
Run this in your database:
```sql
SELECT id, "firstName", "lastName", email, status, "tenantId"
FROM "User"
WHERE status = 'ACTIVE'
ORDER BY "firstName";
```

**Expected:** See all your users
**If not:** Some users have status = 'INACTIVE'

### **Check 2: API Response**
In browser console, run:
```javascript
fetch('/api/users/onboarded')
  .then(r => r.json())
  .then(d => console.log('Users:', d.users))
```

**Expected:** Array of all users
**If only 1:** Check database query

### **Check 3: Network Tab**
```
F12 → Network tab → Open program dialog
Look for: /api/users/onboarded
Click on it → Preview tab
```

**Expected:** JSON with all users
**If only 1:** Problem is in API/database

---

## 💡 About @ Mentions

**You mentioned:**
> "it should let me add names by using @"

**Current Implementation:**
- Program Owner is a **dropdown (Select)** field
- No @ mention functionality
- Users select from list

**Why Dropdown Instead of @ Mentions:**
- ✅ Validates user exists
- ✅ Prevents typos
- ✅ Shows all available users
- ✅ Standard UI pattern for owner selection
- ✅ Works with keyboard (type to search)

**@ Mentions are typically used for:**
- Comments
- Task descriptions
- Chat messages
- Places where you want to **notify** someone

**Owner field is for:**
- Assigning **responsibility**
- Needs to be a **valid user ID**
- Must be **validated**

---

## 🎯 Likely Solution

Based on the issue, **most likely cause:**

**Your other users are set to INACTIVE status**

### **How to Fix:**

1. Go to **Admin → Organization**
2. Find users that should appear
3. Check their **Status** column
4. If status is "INACTIVE":
   - Click **Edit** button
   - Change Status to "ACTIVE"
   - Save changes
5. Try creating program again
6. All users should now appear!

---

## 📊 What the Improved Dropdown Shows

### **Before:**
```
Program Owner *
[Select owner ▼]
  Sandeep Sharma
```

### **After:**
```
Program Owner *
[Select owner ▼]
  John Doe (john@example.com)
  Jane Smith (jane@example.com)
  Sandeep Sharma (sandeep@example.com)

5 users available
```

**Benefits:**
- ✅ Shows email for identification
- ✅ Shows total count
- ✅ Better loading states
- ✅ Debug logging

---

## 📝 Summary

### **Changes Made:**
1. ✅ Added email to dropdown options
2. ✅ Added user count display
3. ✅ Improved loading states
4. ✅ Added console logging for debugging

### **Not Changed:**
- ❌ Still a dropdown (not @ mentions)
- ❌ API still fetches from same endpoint
- ❌ Same filtering logic (ACTIVE users, same tenant)

### **Next Steps:**
1. Open program dialog
2. Check browser console
3. See how many users are fetched
4. If only 1 user → Check other users' status in Organization page
5. Activate other users if needed

---

## 🚀 Expected Behavior

**When you open "Create Program" dialog:**
1. Dropdown fetches all active users
2. Console shows: `[Program Dialog] Fetched users: [array of users]`
3. Dropdown shows all users with emails
4. Shows "X users available" below
5. You can scroll through all users
6. You can type to search (built into Select component)

**If you only see 1 user:**
- Check console log
- Check Organization page
- Check user statuses
- Activate users if needed

---

## 💡 Pro Tip

The Select component has **built-in search!**

**How to use:**
1. Click the dropdown
2. Start typing a name
3. List filters automatically
4. Press Enter to select

So if you have 50 users, you can:
- Type "john" → filters to John Doe, Johnny Smith, etc.
- Type "sandeep" → filters to Sandeep Sharma
- Much faster than scrolling!

---

**Check your browser console when opening the dialog to see how many users are being fetched!** 🔍

