# Team Setup & Access Control Guide

## 🎯 Your Questions Answered

This guide explains how the app handles:
1. ✅ New user setup and team invitation
2. ✅ Different access levels for team members
3. ✅ Preventing unauthorized users from joining your organization
4. ✅ Works for small teams (not just big companies)

---

## 1. First-Time Setup: Creating Your Organization

### Scenario: You're a new user signing up

When you sign up for the first time:

#### Option A: Sign Up with Email/Password

**File**: `app/api/auth/signup/route.ts`

```
1. You fill signup form:
   - First Name, Last Name
   - Email (e.g., john@mycompany.com)
   - Password
   - Organization Name (e.g., "My Company")

2. System checks your email domain:
   ├─ Public domain (Gmail, Yahoo, etc.)?
   │  └─ → Creates NEW separate organization for you
   │     └─ → You become TENANT_SUPER_ADMIN
   │
   └─ Private domain (mycompany.com)?
      ├─ Domain already verified by someone else?
      │  ├─ autoJoinEnabled = true?
      │  │  └─ → Auto-joins existing org as TEAM_MEMBER
      │  └─ autoJoinEnabled = false?
      │     └─ → BLOCKS signup: "Request invitation from admin"
      └─ Domain not registered?
         └─ → Creates NEW organization
            └─ → You become TENANT_SUPER_ADMIN (provisional)
```

#### Option B: Sign Up with Google OAuth

**File**: `auth.ts` - Google OAuth handler

```
1. You click "Sign in with Google"
2. System extracts domain from email
3. Checks if organization exists for that domain:
   ├─ Exists?
   │  └─ → Adds you as TEAM_MEMBER
   └─ Doesn't exist?
      └─ → Creates new organization
         └─ → You become ORG_ADMIN
```

### Result After Signup

- **Your Role**: `TENANT_SUPER_ADMIN` or `ORG_ADMIN` (full admin rights)
- **Your Organization**: Created with you as the owner
- **Next Step**: Invite team members

---

## 2. Inviting Team Members & Setting Access Levels

### How to Invite Team Members

**Location**: `/admin/organization` or via `InviteUserModal` component

#### Step 1: Open Invite Dialog
- Go to Admin → Organization → Users
- Click "Invite User" button

#### Step 2: Fill Invite Form
**File**: `components/invite-user-modal.tsx`

```typescript
Fields:
- Email Address: teammate@mycompany.com
- Role: [Dropdown with all available roles]
```

#### Step 3: Select Role (Access Level)

The system supports **12 different roles** with different access levels:

| Role | Access Level | What They Can Do |
|------|-------------|------------------|
| **TEAM_MEMBER** | ✅ Limited | View projects, create/update tasks, basic collaboration |
| **PROJECT_MANAGER** | ✅ Moderate | Everything in TEAM_MEMBER + create projects, manage tasks, risks, issues |
| **ORG_ADMIN** | ✅ High | Manage users, teams, projects, organization settings |
| **TENANT_SUPER_ADMIN** | ✅ Full | Everything - full control of organization |
| **PMO_LEAD** | ✅ High | Portfolio/program management, approvals |
| **EXECUTIVE** | ✅ View-Only | Read-only access to projects, reports, dashboards |
| **RESOURCE_MANAGER** | ✅ Resource-Focused | Manage resources, bookings, capacity |
| **FINANCE_CONTROLLER** | ✅ Finance-Focused | Budgets, costs, timesheets, invoices |
| **CLIENT_STAKEHOLDER** | ✅ Limited | View projects, approve changes |
| **COMPLIANCE_AUDITOR** | ✅ Audit-Only | Read-only access, audit logs |
| **INTEGRATION_ADMIN** | ✅ Integration-Focused | Manage integrations, API keys, webhooks |

#### Step 4: Send Invitation

**File**: `app/api/invitations/send/route.ts`

```
1. System validates:
   ├─ User has permission to invite? (Only ORG_ADMIN, TENANT_SUPER_ADMIN)
   ├─ Email not already registered?
   └─ No pending invitation exists?

2. Creates invitation:
   ├─ Generates secure token
   ├─ Sets expiration (7 days)
   ├─ Stores in database
   └─ Sends email with invitation link

3. Recipient receives email:
   ├─ Clicks invitation link
   ├─ Sets password
   └─ Joins organization with assigned role
```

### Example: Setting Up Your Team

```
Scenario: You want to invite 3 team members with different access

1. Alice (Senior Developer)
   Role: PROJECT_MANAGER
   Access: Can create projects, manage tasks, handle risks

2. Bob (Junior Developer)
   Role: TEAM_MEMBER
   Access: Can only work on assigned tasks, view projects

3. Carol (Finance Head)
   Role: FINANCE_CONTROLLER
   Access: Budget management, timesheet approval, invoices
```

### Manual Access Control (Per User)

If you need **granular control** per user:

**Location**: `/admin/organization` → Edit User

You can:
1. Change user role anytime
2. Assign to specific departments/org units
3. Set reporting relationships
4. Enable/disable specific permissions

---

## 3. Preventing Unauthorized Access

### 🔒 How the App Protects Your Organization

The app uses **multiple layers** to prevent unauthorized users from joining:

#### Layer 1: Domain Verification (Primary Protection)

**File**: `app/api/tenant/verify/initiate/route.ts` + `app/api/tenant/verify/check/route.ts`

**How it Works**:

```
1. You (as TENANT_SUPER_ADMIN) verify your domain:
   ├─ Go to Settings → Domain Verification
   ├─ System generates verification code
   └─ You add DNS TXT record: managerbook-verify=<code>

2. System checks DNS:
   ├─ Finds TXT record?
   │  └─ → Domain VERIFIED ✅
   │     └─ → Prevents others from claiming your domain
   └─ No TXT record?
      └─ → Domain UNVERIFIED ⚠️
```

**What This Prevents**:

✅ **Prevents domain squatting**: Someone can't claim `mycompany.com` without DNS access  
✅ **Proves ownership**: Only domain owner can add DNS records  
✅ **Auto-join control**: You control if others with same domain can auto-join

#### Layer 2: Auto-Join Control

**File**: `app/api/auth/signup/route.ts` - Lines 172-185

**Two Modes**:

**Mode A: Auto-Join Enabled** (Open)
```typescript
if (existingTenant && existingTenant.autoJoinEnabled) {
  // Anyone with @mycompany.com email can join automatically
  tenant = existingTenant
  userRole = 'TEAM_MEMBER'
}
```

**Mode B: Auto-Join Disabled** (Invite-Only) ⭐ **RECOMMENDED FOR SMALL TEAMS**
```typescript
if (existingTenant && !existingTenant.autoJoinEnabled) {
  // BLOCKS signup if not invited
  return Response.json({
    error: 'This domain is registered. Please request an invitation from your organization admin.',
    requiresInvitation: true
  }, { status: 403 })
}
```

**For Small Teams**: **Disable Auto-Join** → Only invited users can join

#### Layer 3: Public Domain Isolation

**File**: `lib/domain-utils.ts`

```
Public domains (Gmail, Yahoo, Outlook, etc.):
├─ Each user gets their OWN separate organization
├─ Cannot join someone else's organization by domain
└─ Must be explicitly invited
```

**Why**: Prevents Gmail users from joining someone else's org by coincidence

#### Layer 4: Invitation-Only System

**File**: `app/api/invitations/send/route.ts`

```
When someone signs up with your domain email:

1. System checks:
   ├─ Domain verified? → YES
   ├─ Auto-join enabled? → NO
   └─ Has invitation? → NO

2. Result:
   └─ → SIGNUP BLOCKED ❌
      └─ → Shows: "Request invitation from admin"

3. To join:
   └─ → You must send invitation
      └─ → They accept invitation
         └─ → Then they can join
```

#### Layer 5: Email Already Registered Check

**File**: `app/api/auth/signup/route.ts` - Lines 37-46

```typescript
// Check if user already exists
const existingUser = await prisma.user.findUnique({
  where: { email }
})

if (existingUser) {
  return Response.json({
    error: 'User with this email already exists'
  }, { status: 400 })
}
```

**Prevents**: Same email from being used in multiple organizations

---

## 4. Recommended Setup for Small Teams

### ✅ Step-by-Step Security Setup

#### Step 1: Verify Your Domain

1. Go to **Settings** → **Domain Verification**
2. Click **"Verify Domain"**
3. System generates verification code
4. Add DNS TXT record:
   ```
   Type: TXT
   Name: @ (or your domain)
   Value: managerbook-verify=<code>
   ```
5. Wait 5-15 minutes for DNS propagation
6. Click **"Check Verification"**

**Result**: Domain is now verified ✅

#### Step 2: Disable Auto-Join

1. After domain verification, go to **Settings**
2. Find **"Auto-Join"** or **"Domain Auto-Join"** setting
3. **DISABLE** it

**Result**: Only invited users can join ✅

#### Step 3: Invite Team Members

1. Go to **Admin** → **Organization** → **Users**
2. Click **"Invite User"**
3. Enter email and select role
4. Click **"Send Invitation"**

**Result**: Team members receive invitation email ✅

---

## 5. What Happens If Someone Tries to Join Without Invitation?

### Scenario 1: Someone signs up with `@mycompany.com`

**If your domain is NOT verified**:
```
→ They can create NEW organization with same name
→ BUT: It's a separate organization (different tenantId)
→ You're completely isolated from each other
```

**If your domain IS verified**:
```
→ System checks: Domain verified? YES
→ System checks: Auto-join enabled? NO
→ System checks: Has invitation? NO

→ SIGNUP BLOCKED ❌
→ Shows error: "This domain is registered. Please request an invitation..."
```

### Scenario 2: Someone tries to use your organization name

**What happens**:
```
→ They can use same organization NAME
→ BUT: Organization ID (tenantId) is unique
→ BUT: Domain controls access, not name

→ Even if they use "My Company" name
→ They cannot access YOUR "My Company" data
→ Because tenantId isolation prevents cross-access
```

**Key Point**: Organization **name** is just a label. **Domain** + **tenantId** control access.

---

## 6. Access Control Summary

### For Your Use Case:

**"I want to give some team members full access, some limited access, some manual control"**

**Solution**:

1. **Full Access**: Assign `ORG_ADMIN` or `TENANT_SUPER_ADMIN` role
2. **Limited Access**: Assign `TEAM_MEMBER` role
3. **Custom Access**: Choose specific roles (PROJECT_MANAGER, FINANCE_CONTROLLER, etc.)
4. **Manual Control**: Use `/admin/organization` to change roles anytime

### Access Matrix

| What You Want | Role to Assign |
|--------------|----------------|
| Full control of organization | `TENANT_SUPER_ADMIN` |
| Manage users & teams | `ORG_ADMIN` |
| Manage projects & tasks | `PROJECT_MANAGER` |
| Basic task work | `TEAM_MEMBER` |
| View-only access | `EXECUTIVE` or `CLIENT_STAKEHOLDER` |
| Finance management | `FINANCE_CONTROLLER` |
| Resource management | `RESOURCE_MANAGER` |

---

## 7. Code References

### Key Files:

1. **Signup Logic**: `app/api/auth/signup/route.ts`
   - Domain checking
   - Tenant creation
   - Auto-join logic

2. **Invitation System**: `app/api/invitations/send/route.ts`
   - Sending invitations
   - Role assignment

3. **Domain Verification**: 
   - `app/api/tenant/verify/initiate/route.ts`
   - `app/api/tenant/verify/check/route.ts`

4. **Permissions**: `lib/permissions.ts`
   - Role-based permissions
   - Access control logic

5. **Domain Utils**: `lib/domain-utils.ts`
   - Public domain detection
   - Domain validation

---

## 8. Security Checklist for Small Teams

✅ **Verify your domain** (DNS TXT record)  
✅ **Disable auto-join** (invite-only mode)  
✅ **Send explicit invitations** to team members  
✅ **Assign appropriate roles** per team member  
✅ **Regularly review** organization members  
✅ **Enable IP whitelisting** (optional, advanced)  

---

## Summary

### Your Questions → Answers:

1. **"How do I invite my team?"**
   → Use Admin → Organization → Invite User, select role per person

2. **"How do I give different access levels?"**
   → Assign different roles: TEAM_MEMBER (limited), ORG_ADMIN (full), or specific roles

3. **"How does it prevent unauthorized joining?"**
   → Domain verification + Disable auto-join = Only invited users can join

4. **"Does it work for small teams?"**
   → Yes! Perfect for small teams. Disable auto-join, invite manually.

### Key Protection Mechanism:

**Domain Verification + Invitation-Only = Secure Team Access**

The app ensures:
- ✅ Only YOU can verify your domain (via DNS)
- ✅ Only YOU can invite team members
- ✅ Unauthorized users CANNOT join even with same domain email
- ✅ Each role has specific permissions (granular control)