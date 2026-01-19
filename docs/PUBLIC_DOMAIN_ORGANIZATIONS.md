# Public Domain Organizations - Guide for Small Teams

## Overview

This guide explains how the app handles organizations that use **public email domains** (Gmail, Yahoo, Outlook, etc.) instead of company-specific domains.

---

## 🎯 How It Works for Public Domains

### Current Behavior

**When someone signs up with a public email** (e.g., `john@gmail.com`):

1. ✅ **Creates a new organization** with that user as `TENANT_SUPER_ADMIN`
2. ✅ **No domain verification** (public domains can't be verified)
3. ✅ **Domain field is null** (not set)
4. ✅ **Auto-join doesn't apply** (no shared domain to match)

### Why This Design?

**Security**: Prevents Gmail users from accidentally joining someone else's organization just because they use the same email provider.

**Example Scenario:**
```
❌ BAD: All Gmail users automatically join same org
✅ GOOD: Each person gets their own org, invite explicitly
```

---

## 👥 How Small Teams Work Together

### For Public Domain Organizations:

**Use the Invitation System** - The only way to add team members.

#### Step-by-Step Process:

1. **First Person Signs Up**
   - Uses `alice@gmail.com`
   - Creates organization: "Alice's Team"
   - Becomes `TENANT_SUPER_ADMIN`

2. **Invite Team Members**
   - Alice goes to: **Admin → Organization → Users**
   - Clicks **"Invite User"**
   - Enters: `bob@gmail.com`, `carol@yahoo.com`, etc.
   - Selects role for each person
   - Sends invitations

3. **Team Members Join**
   - Bob/Carol receive invitation email
   - Click link to accept
   - Set password
   - Join Alice's organization

4. **Result**: All team members are in the same organization, regardless of email provider

---

## 🔒 Security Features for Public Domains

### Invite-Only Access

✅ **No auto-join possible** (no domain to match)  
✅ **Only invited users can join**  
✅ **Admins control who gets access**  
✅ **Each invitation is explicit**

### Access Control

- **Admin controls**: Who can invite (`TENANT_SUPER_ADMIN`, `ORG_ADMIN`)
- **Role-based access**: Assign different roles per team member
- **Manual management**: Full control over organization membership

---

## 📋 UI Differences

### For Public Domain Users:

When visiting **Admin → Domain Verification**:

**Shows:**
- ❌ "Public Email Domain" card
- ✅ Message: "Invite-Only Access"
- ✅ Instructions: How to invite team members
- ✅ Link to Organization Settings

**Does NOT show:**
- ❌ Domain verification option (not applicable)
- ❌ Auto-join toggle (not applicable - no domain)
- ❌ DNS verification steps

### For Custom Domain Users:

When visiting **Admin → Domain Verification**:

**Shows:**
- ✅ Domain verification status
- ✅ DNS setup instructions (if not verified)
- ✅ Auto-join toggle (if verified)
- ✅ Domain management options

---

## 💡 Best Practices for Small Teams

### Using Public Emails:

1. **Appoint an Admin**
   - Choose one person to be `TENANT_SUPER_ADMIN`
   - They'll manage invitations

2. **Standardize Email Providers** (Optional)
   - While not required, using same provider (all Gmail) can help with organization
   - But mixing Gmail/Yahoo/Outlook works perfectly fine

3. **Use Invitations**
   - Always use the invitation system
   - Assign appropriate roles per person

4. **Regular Review**
   - Periodically review organization members
   - Remove inactive members

---

## 🔄 Comparison: Public vs Custom Domain

| Feature | Public Domain (Gmail) | Custom Domain (company.com) |
|---------|----------------------|----------------------------|
| **Domain Verification** | ❌ Not available | ✅ Available via DNS |
| **Auto-Join** | ❌ Not applicable | ✅ Can enable/disable |
| **Team Invitations** | ✅ Required | ✅ Optional (if auto-join disabled) |
| **Security** | ✅ Invite-only (always) | ✅ Configurable (invite-only or auto-join) |
| **Use Case** | Small teams, freelancers | Enterprise, large orgs |

---

## ❓ FAQ

### Q: Can multiple people with Gmail join the same organization?

**A:** Yes! Use the **invitation system**. First person creates org, then invites others.

### Q: Do team members need to use the same email provider?

**A:** No! You can mix Gmail, Yahoo, Outlook, etc. All that matters is invitations.

### Q: Why can't I verify Gmail domain?

**A:** You can't verify public domains because you don't own them. Domain verification is only for custom domains you control.

### Q: Can I enable auto-join for Gmail users?

**A:** No, auto-join requires a verified custom domain. For public domains, use invitations.

### Q: Is invite-only secure?

**A:** Yes! Invite-only is actually more secure than auto-join because you explicitly control who joins.

---

## 🎯 Summary

### For Small Teams Using Public Emails:

✅ **Use invitation system** to add team members  
✅ **No domain verification needed** (not applicable)  
✅ **No auto-join** (always invite-only for public domains)  
✅ **Mix email providers** freely (Gmail, Yahoo, etc.)  
✅ **Full admin control** over organization membership

### The Process:

1. **Sign up** → Create organization
2. **Invite members** → Send invitations via Admin panel
3. **Team joins** → Via invitation links
4. **Work together** → Same organization, different email providers

---

## 🔧 Code Implementation

### How Public Domains are Detected:

**File**: `lib/domain-utils.ts`

```typescript
export const PUBLIC_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  // ... more public domains
]

export function isPublicDomain(email: string): boolean {
  const domain = extractDomain(email)
  return PUBLIC_EMAIL_DOMAINS.includes(domain.toLowerCase())
}
```

### How Signup Handles Public Domains:

**File**: `app/api/auth/signup/route.ts`

```typescript
// CASE 2: Public domain - Always create new tenant
if (isPublic) {
  tenant = await prisma.tenant.create({
    data: {
      name: organizationName,
      domain: null, // ⚠️ No domain for public emails
      domainVerified: false,
    },
  })
  userRole = 'TENANT_SUPER_ADMIN'
}
```

### UI Handling:

**File**: `app/admin/domain-verification/page.tsx`

- Checks `!tenantInfo.domain` to detect public domain
- Shows different UI with invitation instructions
- Hides domain verification and auto-join options
