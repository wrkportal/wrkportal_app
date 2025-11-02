# Program Owner Field - INVITED Users Now Included ✅

## 🎯 Issue Found

**User reported:**
> "all the other users are showing as invited"

**Root Cause:**
The API was only fetching users with `status: 'ACTIVE'`, excluding all INVITED users.

---

## ✅ What I Fixed

### **1. Updated API to Include INVITED Users**

**Before:**
```typescript
where: {
  tenantId: session.user.tenantId,
  status: 'ACTIVE',  // ❌ Only ACTIVE users
}
```

**After:**
```typescript
where: {
  tenantId: session.user.tenantId,
  status: {
    in: ['ACTIVE', 'INVITED']  // ✅ Both ACTIVE and INVITED
  }
}
```

### **2. Updated Sorting**

**Now sorts by:**
1. Status (ACTIVE users first, then INVITED)
2. First name (alphabetically)

**Result:** Active users appear at top, invited users below

### **3. Show User Status in Dropdown**

**Dropdown now shows:**
```
John Doe (john@example.com) - Active
Jane Smith (jane@example.com) - Invited
Sandeep Sharma (sandeep@example.com) - Active
```

**Visual indicator:** "- Invited" label for invited users

---

## 📊 What You'll See Now

### **In Program Owner Dropdown:**

**Active Users (appear first):**
```
✓ John Doe (john@example.com)
✓ Sandeep Sharma (sandeep@example.com)
```

**Invited Users (appear after active):**
```
○ Jane Smith (jane@example.com) - Invited
○ Mike Johnson (mike@example.com) - Invited
```

**User Count:**
```
5 users available
```

---

## 🔍 User Status Explained

### **ACTIVE Status:**
- ✅ User has logged in and is active
- ✅ Can be assigned as program owner
- ✅ Can log in and manage the program

### **INVITED Status:**
- ⚠️ User has been invited but hasn't logged in yet
- ✅ Can still be assigned as program owner
- ⚠️ Won't be able to manage program until they activate account
- 📧 Should receive invitation email to activate

---

## 💡 Best Practices

### **When Assigning Program Owners:**

**Preferred:** Choose ACTIVE users
- They can immediately access and manage the program

**Can Also Choose:** INVITED users
- They'll become owner when they activate
- Useful for pre-planning programs

**Example Workflow:**
1. Create program
2. Assign invited user as owner
3. User receives invitation
4. User activates account
5. User can now manage their program ✅

---

## 🎯 What Changed in Code

### **File 1: API Endpoint**
**Location:** `app/api/users/onboarded/route.ts`

**Changes:**
- ✅ Added `status: { in: ['ACTIVE', 'INVITED'] }`
- ✅ Added `status` field to select
- ✅ Updated orderBy to sort by status first

### **File 2: Program Dialog**
**Location:** `components/dialogs/program-dialog.tsx`

**Changes:**
- ✅ Added "- Invited" label for invited users
- ✅ Console logging shows all fetched users

---

## 🧪 Testing

### **Step 1: Open Program Dialog**
```
Click "Create Program" button
```

### **Step 2: Check Console**
```
Console should show: [Program Dialog] Fetched users: [...]
```

**Expected:** Array with ALL users (ACTIVE + INVITED)

### **Step 3: Check Dropdown**
```
Click "Program Owner" dropdown
```

**Expected:** All users listed, with "- Invited" label for invited users

### **Step 4: Verify Sorting**
```
Active users at top
Invited users below
Both sorted alphabetically
```

---

## 📋 Complete User Flow

### **Scenario 1: Assign Active User**
```
1. Open "Create Program"
2. Select Program Owner dropdown
3. Choose "John Doe (john@example.com)" (no "- Invited" label)
4. Create program
5. ✅ John can immediately access program
```

### **Scenario 2: Assign Invited User**
```
1. Open "Create Program"
2. Select Program Owner dropdown
3. Choose "Jane Smith (jane@example.com) - Invited"
4. Create program
5. ⚠️ Jane needs to activate account first
6. Jane receives invitation email
7. Jane activates account
8. ✅ Jane can now access program
```

---

## 🎨 Visual Example

### **Dropdown Appearance:**

```
Program Owner *
┌─────────────────────────────────────────────┐
│ Select owner                              ▼ │
└─────────────────────────────────────────────┘

Dropdown opens:
┌─────────────────────────────────────────────┐
│ John Doe (john@example.com)                 │ ← Active
│ Sandeep Sharma (sandeep@example.com)        │ ← Active
│ ────────────────────────────────────────    │
│ Jane Smith (jane@example.com) - Invited    │ ← Invited
│ Mike Johnson (mike@example.com) - Invited  │ ← Invited
└─────────────────────────────────────────────┘

5 users available
```

---

## ✅ Summary

### **Before:**
- ❌ Only showed 1 ACTIVE user (Sandeep Sharma)
- ❌ Excluded all INVITED users
- ❌ No way to assign programs to invited users

### **After:**
- ✅ Shows ALL users (ACTIVE + INVITED)
- ✅ Clear labeling ("- Invited")
- ✅ Sorted by status (ACTIVE first)
- ✅ Can assign to both active and invited users
- ✅ User count shows total available

---

## 🚀 Result

**All your users will now appear in the Program Owner dropdown!**

- ✅ Active users (can manage immediately)
- ✅ Invited users (will manage after activation)
- ✅ Clear visual distinction
- ✅ Sorted for easy selection

**Try creating a program now - you should see all your users!** 🎉

---

## 📝 Additional Notes

### **If you don't want invited users to be assignable:**

Let me know and I can:
1. Keep the filter to ACTIVE only
2. Show invited users as disabled in dropdown
3. Show invited users with warning tooltip

### **If you want to activate invited users:**

Go to **Admin → Organization** and:
1. Find invited users
2. Click "Edit"
3. Change status to "ACTIVE"
4. They can now log in (or resend invitation email)

---

**All users (ACTIVE and INVITED) now appear in the Program Owner dropdown!** ✨

