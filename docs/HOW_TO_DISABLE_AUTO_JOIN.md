# How to Disable Auto-Join

## Overview

Auto-join is **enabled by default** after you verify your domain. This allows anyone with your domain email to automatically join your organization.

**To disable auto-join** (recommended for small teams), you have two options:

---

## Option 1: Using API Call (Recommended)

### Step 1: Make API Call

Use your browser's Developer Console or a tool like Postman:

```bash
PATCH /api/tenant
Content-Type: application/json

{
  "autoJoinEnabled": false
}
```

### Step 2: Check Status

```bash
GET /api/tenant
```

Look for `"autoJoinEnabled": false` in the response.

---

## Option 2: Direct Database Update (Advanced)

**⚠️ Warning**: Only use if you have database access

### Using Prisma Studio or SQL:

```sql
UPDATE "Tenant" 
SET "autoJoinEnabled" = false 
WHERE "domain" = 'yourdomain.com';
```

Or via Prisma Client:

```typescript
await prisma.tenant.update({
  where: { domain: 'yourdomain.com' },
  data: { autoJoinEnabled: false }
})
```

---

## Option 3: Update Code (After Adding API Endpoint)

I've added a PATCH endpoint to `/api/tenant` that allows updating `autoJoinEnabled`.

Once that's deployed, you can:

1. Use the API call from Option 1 above
2. Or add a UI toggle in the domain verification page

---

## How to Check Current Status

**Via API:**
```bash
GET /api/tenant
```

**In Response:**
```json
{
  "tenant": {
    "autoJoinEnabled": true,  // <-- Current status
    "domain": "mycompany.com",
    "domainVerified": true
  }
}
```

---

## What Happens When Auto-Join is Disabled?

When `autoJoinEnabled = false`:

✅ **Only invited users can join** your organization  
✅ **Prevents unauthorized joining** even with same domain email  
✅ **Users get message**: "This domain is registered. Please request an invitation from your organization admin."

### Example Flow:

```
1. Someone tries to sign up with: john@mycompany.com

2. System checks:
   - Domain verified? YES
   - Auto-join enabled? NO ❌
   - Has invitation? NO ❌

3. Result:
   → SIGNUP BLOCKED
   → Error: "This domain is registered. Please request an invitation..."
```

---

## Recommended Setup for Small Teams

1. ✅ **Verify your domain** (DNS TXT record)
2. ✅ **Disable auto-join** (set `autoJoinEnabled: false`)
3. ✅ **Invite team members manually** via Admin → Organization

This ensures only people you explicitly invite can join.

---

## Current Code Behavior

**File**: `app/api/tenant/verify/check/route.ts` (Line 79)

```typescript
// When domain verification succeeds:
autoJoinEnabled: true, // ⚠️ Enabled by default
```

**To change this**, modify line 79:

```typescript
autoJoinEnabled: false, // Disable by default
```

Or manually disable it after verification using one of the methods above.

---

## Quick Reference

| Setting | Effect |
|---------|--------|
| `autoJoinEnabled: true` | Anyone with your domain email can join automatically |
| `autoJoinEnabled: false` | Only invited users can join (RECOMMENDED) |
