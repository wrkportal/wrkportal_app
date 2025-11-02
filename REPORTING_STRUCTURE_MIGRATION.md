# Reporting Structure Implementation - Migration Guide

## ✅ What's Been Completed

### 1. Database Schema Updated
- Added `reportsToId` field to User model
- Added `reportsTo` and `directReports` relations
- Added index on `reportsToId`

### 2. API Endpoints Updated
- ✅ `POST /api/organization/users` - Now accepts `reportsToId`
- ✅ `GET /api/organization/users?leadsOnly=true` - Returns only department leads
- ✅ `PATCH /api/organization/users/[userId]` - Now updates `reportsToId`

### 3. Add User Dialog Updated
- ✅ Added "Reports To (Manager/Lead)" dropdown
- ✅ Fetches department leads on open
- ✅ Allows selecting "None" to make user a department lead

## 🔄 Next Steps Required

### Step 1: Run Database Migration

**IMPORTANT**: You must run this migration to add the new fields to your database:

```bash
npx prisma migrate dev --name add_reporting_structure
```

This will:
- Add `reportsToId` column to User table
- Create the foreign key relationship
- Add the index

### Step 2: Update Edit User Dialog

The Edit User dialog (`components/dialogs/edit-user-dialog.tsx`) needs to be updated to include the "Reports To" field.

**Add to the component:**
1. State for `departmentLeads`
2. Fetch department leads on open
3. Add "Reports To" dropdown in the form (similar to Add User dialog)

### Step 3: Update Org Chart Visual

The Org Chart Visual component needs to be updated to show the hierarchy based on `reportsToId`.

**Changes needed:**
1. Fetch users with their `reportsTo` and `directReports` relations
2. Build a tree structure where:
   - Root nodes = users with `reportsToId === null` (department leads)
   - Child nodes = users who report to them
3. Display hierarchy visually

## 📊 How It Works

### Department Leads (Root Level)
- Users with `reportsToId = null`
- These are the top-level people in each department
- They appear at the root of the org chart

### Team Members (Reports To Someone)
- Users with `reportsToId = <userId>`
- They report to a specific person (their manager/lead)
- They appear under their manager in the org chart

### Example Structure:
```
Engineering Department
├── John Doe (Engineering Lead) [reportsToId = null]
    ├── Jane Smith (Senior Dev) [reportsToId = John's ID]
    ├── Bob Johnson (Dev) [reportsToId = John's ID]
    
Sales Department
├── Alice Williams (Sales Lead) [reportsToId = null]
    ├── Charlie Brown (Sales Rep) [reportsToId = Alice's ID]
```

## 🎯 Benefits

1. **Clear Hierarchy**: Visual representation of who reports to whom
2. **Department Leads**: Easy to identify department leads (no manager)
3. **Org Chart**: Proper organizational structure visualization
4. **Flexible**: Users can be moved between managers easily

## ⚠️ Important Notes

- Users can only report to one person at a time
- Department leads have `reportsToId = null`
- The system prevents circular reporting (A reports to B, B reports to A)
- When a user is deleted, their direct reports' `reportsToId` is set to null (they become leads)


