# Access Control & Authentication Analysis

## Overview
This document provides a comprehensive analysis of how access control and authentication work at all levels in the wrkportal application.

---

## 1. Authentication Layer

### 1.1 Authentication Methods

The application supports two authentication methods:

#### A. Credentials Authentication (Email/Password)
- **Location**: `auth.ts` - Credentials provider
- **Process**:
  1. User submits email/password
  2. System validates credentials using bcryptjs
  3. **Email verification check**: Users MUST have verified email (`emailVerified` must not be null)
  4. On success, creates JWT session
  5. Updates `lastLogin` timestamp

#### B. Google OAuth Authentication
- **Location**: `auth.ts` - Google provider
- **Process**:
  1. User clicks "Sign in with Google"
  2. OAuth flow redirects to Google
  3. On return, system checks if user exists
  4. **Auto-creates user if new**: Creates user + tenant based on email domain
  5. First user from domain becomes `ORG_ADMIN`, subsequent users become `TEAM_MEMBER`
  6. Email is automatically verified for OAuth users

### 1.2 Session Management

#### JWT-Based Sessions
- **Strategy**: JWT (JSON Web Tokens)
- **Duration**: 30 days (`maxAge: 30 * 24 * 60 * 60`)
- **Storage**: Server-side JWT tokens (not stored in cookies, managed by NextAuth)
- **Session Data**:
  ```typescript
  {
    id: string          // User ID
    email: string       // User email
    role: string        // User role (e.g., ORG_ADMIN, TEAM_MEMBER)
    tenantId: string    // Organization/Tenant ID
    emailVerified: Date // Email verification status
  }
  ```

---

## 2. Middleware Layer

### 2.1 Route Protection (Middleware)

**File**: `middleware.ts`

#### Public Paths (No Authentication Required)
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/landing`
- `/privacy`, `/terms`, `/security`
- `/api/auth/*`
- `/onboarding`

#### Protected Paths
- All other paths require authentication
- Middleware applies:
  - **Rate limiting** on API routes
  - **Security headers** (CSP, HSTS, etc.)
  - Routes to NextAuth's `authorized` callback for authentication check

### 2.2 NextAuth Authorization Callback

**File**: `auth.config.ts` - `authorized` callback

#### Flow:
1. **Check if logged in**: `!!auth?.user`
2. **Public pages**: Allow access to `/`, `/landing`, auth pages
3. **Auth pages**: If logged in and trying to access auth pages → redirect to `/`
4. **Protected pages**: If not logged in → redirect to `/login`
5. **Email verification check**:
   - If user not verified AND not on verification-related pages → redirect to `/settings?verify=required`
   - Exceptions: `/settings`, `/api/auth/resend-verification`

---

## 3. API Route Protection

### 3.1 Standard Protection Pattern

**Pattern**: Most API routes follow this structure:

```typescript
export async function GET(request: NextRequest) {
  const session = await auth()
  
  // 1. Authentication Check
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // 2. Role-Based Authorization (if needed)
  const allowedRoles = ['ORG_ADMIN', 'TENANT_SUPER_ADMIN']
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // 3. Tenant Isolation (CRITICAL)
  // Always filter by tenantId to prevent cross-tenant data access
  const data = await prisma.project.findMany({
    where: {
      tenantId: session.user.tenantId  // ⚠️ ESSENTIAL
    }
  })
  
  return NextResponse.json({ data })
}
```

### 3.2 Tenant Isolation

**CRITICAL SECURITY FEATURE**: All database queries MUST filter by `tenantId`

#### Examples:

**✅ CORRECT** (Tenant-isolated):
```typescript
const project = await prisma.project.findUnique({
  where: { 
    id: projectId,
    tenantId: session.user.tenantId  // Filter by tenant
  }
})
```

**❌ INCORRECT** (Security vulnerability):
```typescript
const project = await prisma.project.findUnique({
  where: { id: projectId }  // ⚠️ Missing tenantId filter!
})
```

#### Tenant Isolation Checks:
1. **Read operations**: Always include `tenantId` in WHERE clause
2. **Write operations**: Always set `tenantId` from session
3. **Cross-tenant queries**: Verify `project.tenantId === session.user.tenantId` before returning data

### 3.3 Role-Based API Access

Different roles have different API access:

- **PLATFORM_OWNER**: Platform-level admin, can access `/api/platform/*` routes
- **TENANT_SUPER_ADMIN**: Tenant-level super admin, full access within tenant
- **ORG_ADMIN**: Organization admin, can manage users, teams within tenant
- **Other roles**: Limited access based on resource permissions

---

## 4. Client-Side Access Control

### 4.1 Auth Store (Zustand)

**File**: `stores/authStore.ts`

#### Features:
- **Persisted state**: Stored in localStorage (`auth-storage`)
- **Hydration check**: `isHydrated` flag prevents race conditions
- **Permission checking**: `hasPermission(resource, action)`
- **Role checking**: `hasRole(role)`

#### Usage in Components:
```typescript
const { user, hasPermission, hasRole } = useAuthStore()

// Check permission
if (hasPermission('projects', 'CREATE')) {
  // Show create button
}

// Check role
if (hasRole(['ORG_ADMIN', 'TENANT_SUPER_ADMIN'])) {
  // Show admin features
}
```

### 4.2 Role-Based Screen Access

**File**: `stores/authStore.ts` - `roleScreenAccess`

Different roles can access different screens (by screen ID):

| Role | Accessible Screens |
|------|-------------------|
| TENANT_SUPER_ADMIN | 1, 15, 18, 19, 20, 21, 22 |
| ORG_ADMIN | 1, 3, 5, 6, 7, 8, 9, 12, 15, 18, 19 |
| PROJECT_MANAGER | 1, 2, 3, 4, 7, 8, 9, 11, 12, 13, 14, 15, 17 |
| TEAM_MEMBER | 1, 2, 3, 4, 8, 11, 12 |
| ... | ... |

### 4.3 Permission Matrix

**File**: `stores/authStore.ts` - `rolePermissions`

Each role has specific permissions per resource:

```typescript
{
  TENANT_SUPER_ADMIN: {
    '*': ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT', 'CONFIGURE']
  },
  ORG_ADMIN: {
    users: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
    teams: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
    projects: ['READ', 'CREATE', 'UPDATE'],
    settings: ['READ', 'CONFIGURE']
  },
  PROJECT_MANAGER: {
    projects: ['READ', 'CREATE', 'UPDATE'],
    tasks: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
    risks: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
    // ...
  }
  // ... more roles
}
```

### 4.4 Page-Level Access Control

#### Example: Admin Pages

**File**: `app/admin/organization/page.tsx`

```typescript
const currentUser = useAuthStore((state) => state.user)
const isAdmin = currentUser?.role === 'ORG_ADMIN' || 
                currentUser?.role === 'TENANT_SUPER_ADMIN'

// Conditionally render admin features
{isAdmin && <AdminPanel />}
```

#### Client-Side Route Protection

**File**: `app/page.tsx` (Home page)

1. **Check authentication**: Fetch user from `/api/user/me`
2. **Check onboarding**: If `primaryWorkflowType` not set → redirect to `/onboarding/role-selection`
3. **Redirect to landing**: If authenticated and onboarded → redirect to `user.landingPage` or `/my-work`

---

## 5. User Roles Hierarchy

### 5.1 Available Roles

From `types/index.ts` - `UserRole` enum:

1. **PLATFORM_OWNER**: Platform-level super admin (multi-tenant management)
2. **TENANT_SUPER_ADMIN**: Tenant/organization super admin
3. **ORG_ADMIN**: Organization administrator
4. **PMO_LEAD**: Program Management Office Lead
5. **PROJECT_MANAGER**: Project manager
6. **TEAM_MEMBER**: Team member (default role)
7. **EXECUTIVE**: Executive/leadership role
8. **RESOURCE_MANAGER**: Resource management
9. **FINANCE_CONTROLLER**: Finance management
10. **CLIENT_STAKEHOLDER**: External client access
11. **COMPLIANCE_AUDITOR**: Compliance/audit access
12. **INTEGRATION_ADMIN**: Integration management

### 5.2 Role Assignment

#### Automatic Assignment:
- **Google OAuth**: First user from domain = `ORG_ADMIN`, others = `TEAM_MEMBER`
- **Credentials signup**: Default = `TEAM_MEMBER`
- Can be changed by existing admins

#### Manual Assignment:
- Only `ORG_ADMIN` and `TENANT_SUPER_ADMIN` can assign roles
- Via `/admin/organization` or API routes

---

## 6. Security Features

### 6.1 Email Verification

**Requirement**: All users must verify email before accessing protected resources

**Enforcement**:
- Login blocked if `emailVerified === null`
- Protected pages redirect to `/settings?verify=required` if not verified
- Exception: Settings page and verification endpoints

### 6.2 Rate Limiting

**Location**: `middleware.ts` + `lib/security/rate-limit.ts`

- Applied to all API routes (except `/api/auth/session`)
- Presets: `'auth'` (stricter), `'api'` (standard)
- Identifier: IP address + optional user ID

### 6.3 Security Headers

**Location**: `lib/security/security-headers.ts`

Applied to all responses via middleware:
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security (HSTS)
- Referrer-Policy

### 6.4 IP Whitelisting (Optional)

**Location**: `lib/security/ip-whitelist.ts`

- Can be enabled per tenant
- Only `TENANT_SUPER_ADMIN` and `ORG_ADMIN` can configure
- Stored in tenant settings

---

## 7. Access Flow Diagrams

### 7.1 Login Flow

```
User → Login Page
  ↓
[Submit Credentials] OR [Click Google OAuth]
  ↓
auth.ts → Validate Credentials/OAuth
  ↓
Check emailVerified
  ↓
If NOT verified → Block login / Show error
If verified → Create JWT Session
  ↓
Redirect to Home Page (/)
  ↓
Home Page → Check primaryWorkflowType
  ↓
If NOT set → Redirect to /onboarding/role-selection
If set → Redirect to landingPage or /my-work
```

### 7.2 Protected Page Access Flow

```
User Request → middleware.ts
  ↓
Check if public path?
  ↓
If YES → Allow access
If NO → NextAuth authorized() callback
  ↓
Check if authenticated?
  ↓
If NO → Redirect to /login
If YES → Check emailVerified?
  ↓
If NOT verified → Redirect to /settings?verify=required
If verified → Allow access
  ↓
Page Component → Check role/permissions (client-side)
  ↓
Render content based on permissions
```

### 7.3 API Request Flow

```
Client Request → middleware.ts (rate limiting)
  ↓
API Route Handler
  ↓
const session = await auth()
  ↓
Check session?.user?
  ↓
If NO → Return 401 Unauthorized
If YES → Check role (if needed)?
  ↓
If role insufficient → Return 403 Forbidden
If role OK → Process request
  ↓
Database Query → ALWAYS filter by tenantId
  ↓
Return response with tenant-isolated data
```

---

## 8. Common Patterns

### 8.1 Checking Authentication in Components

```typescript
'use client'
import { useAuthStore } from '@/stores/authStore'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MyPage() {
  const { user, isHydrated } = useAuthStore()
  const router = useRouter()
  
  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/login')
    }
  }, [user, isHydrated, router])
  
  if (!user) return <div>Loading...</div>
  
  return <div>Protected Content</div>
}
```

### 8.2 Checking Permissions in Components

```typescript
const { hasPermission, hasRole } = useAuthStore()

// Permission-based UI
{hasPermission('projects', 'CREATE') && (
  <Button onClick={handleCreate}>Create Project</Button>
)}

// Role-based UI
{hasRole(['ORG_ADMIN', 'TENANT_SUPER_ADMIN']) && (
  <AdminPanel />
)}
```

### 8.3 Tenant-Isolated API Route

```typescript
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Always filter by tenantId
  const projects = await prisma.project.findMany({
    where: {
      tenantId: session.user.tenantId  // ⚠️ CRITICAL
    }
  })
  
  return NextResponse.json({ projects })
}
```

### 8.4 Cross-Tenant Access Prevention

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Fetch resource
  const project = await prisma.project.findUnique({
    where: { id: params.id }
  })
  
  // Verify tenant access
  if (!project || project.tenantId !== session.user.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  return NextResponse.json({ project })
}
```

---

## 9. Security Best Practices

### ✅ DO:

1. **Always check authentication** in API routes: `if (!session?.user) return 401`
2. **Always filter by tenantId** in database queries
3. **Verify tenantId matches** when accessing resources by ID
4. **Check role permissions** for sensitive operations
5. **Use email verification** to prevent unauthorized access
6. **Apply rate limiting** to prevent abuse
7. **Use security headers** for protection against XSS, clickjacking, etc.

### ❌ DON'T:

1. **Don't trust client-side checks alone** - always verify on server
2. **Don't skip tenantId filtering** - this is a critical security vulnerability
3. **Don't expose sensitive data** without permission checks
4. **Don't allow unverified users** to access protected resources
5. **Don't bypass role checks** for admin operations

---

## 10. Testing Access Control

### Key Test Cases:

1. **Unauthenticated Access**: Should redirect to `/login`
2. **Unverified Email**: Should block login or redirect to verification
3. **Cross-Tenant Access**: Should return 403 Forbidden
4. **Insufficient Role**: Should return 403 Forbidden
5. **Onboarding Check**: Should redirect if `primaryWorkflowType` not set
6. **Tenant Isolation**: Verify data from one tenant not accessible to another

---

## 11. Troubleshooting

### Common Issues:

1. **User can't access page after login**:
   - Check `emailVerified` status
   - Check `primaryWorkflowType` is set
   - Check role has screen access

2. **API returns 401/403**:
   - Verify session exists: `console.log(session)`
   - Check role permissions in `authStore.ts`
   - Verify tenantId matches in database query

3. **Cross-tenant data leak**:
   - Ensure all queries filter by `tenantId`
   - Verify tenantId check when accessing by ID

---

## 12. Summary

The access control system operates at **multiple layers**:

1. **Middleware** - Route-level protection, public/private path enforcement
2. **NextAuth** - Authentication, session management, email verification
3. **API Routes** - Server-side authentication, role checks, tenant isolation
4. **Client Components** - UI-level permission checks, role-based rendering
5. **Database Queries** - Tenant isolation at data layer

**Key Security Principles**:
- ✅ Always authenticate
- ✅ Always verify tenant access
- ✅ Always check permissions
- ✅ Never trust client-side only
- ✅ Enforce email verification
- ✅ Apply rate limiting