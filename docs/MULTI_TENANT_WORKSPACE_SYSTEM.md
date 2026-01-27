# Multi-Tenant Workspace System

## Overview

The system now supports users belonging to multiple tenants (workspaces) and switching between them. This allows users like Bob (bob@gmail.com) who has his own tenant to also accept invitations from Alice and access her tenant's data.

## How It Works

### 1. User-Tenant Relationship

- **Primary Tenant**: Each user has one primary tenant (stored in `User.tenantId`)
- **Additional Tenants**: Users can have access to multiple tenants via `UserTenantAccess` table
- **Data Isolation**: All data queries are filtered by the active `tenantId` from the session

### 2. Workspace Switcher

- **Location**: Header component (next to logo)
- **Visibility**: Only shows if user has access to multiple tenants
- **Functionality**: 
  - Lists all tenants user has access to
  - Shows active tenant with checkmark
  - Allows switching between tenants
  - Updates session and refreshes page

### 3. Invitation Flow

When a user accepts an invitation:

1. **New User**: Joins the invited tenant as their primary tenant
2. **Existing User**: 
   - Creates `UserTenantAccess` record
   - Keeps their original tenant as primary
   - Can switch to invited tenant via workspace switcher

### 4. Data Isolation

**CRITICAL**: All API routes must filter by `session.user.tenantId`:

```typescript
// ✅ CORRECT - Filters by active tenant
const projects = await prisma.project.findMany({
  where: {
    tenantId: session.user.tenantId, // Uses active tenant from session
    // ... other filters
  }
})

// ❌ WRONG - Would show data from all tenants
const projects = await prisma.project.findMany({
  // Missing tenantId filter!
})
```

### 5. Security Rules

- **No Data Transfer**: Users cannot move data between tenants
- **Tenant Isolation**: Each tenant's data is completely separate
- **Access Control**: Users can only access tenants they're explicitly granted access to
- **Role Per Tenant**: Users can have different roles in different tenants

## Database Schema

### UserTenantAccess Table

```sql
CREATE TABLE "UserTenantAccess" (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    tenantId TEXT NOT NULL,
    role UserRole NOT NULL,
    groupRole GroupRole,
    allowedSections TEXT, -- JSON array
    isActive BOOLEAN DEFAULT false,
    joinedAt TIMESTAMP DEFAULT NOW(),
    invitedById TEXT,
    invitationId TEXT,
    FOREIGN KEY (userId) REFERENCES User(id),
    FOREIGN KEY (tenantId) REFERENCES Tenant(id)
)
```

## API Endpoints

### GET /api/user/tenants
Returns all tenants the user has access to.

### POST /api/user/tenants/switch
Switches the active tenant in the session.

## UI Components

### WorkspaceSwitcher
- Location: `components/layout/workspace-switcher.tsx`
- Shows dropdown with all accessible tenants
- Updates session on switch
- Refreshes page to load new tenant's data

## Migration Steps

1. **Run Migration**: 
   ```bash
   npx prisma migrate deploy
   ```

2. **Update Prisma Schema**: Add `UserTenantAccess` model to `schema.prisma`

3. **Deploy**: The workspace switcher will automatically appear for users with multiple tenants

## Example Scenario

1. **Bob** (bob@gmail.com) signs up → Gets "Bob's Organization" (primary tenant)
2. **Alice** invites Bob to "Alice's Company" → Creates `UserTenantAccess` record
3. **Bob** logs in → Sees workspace switcher in header
4. **Bob** switches to "Alice's Company" → Session updates, sees Alice's data
5. **Bob** switches back to "Bob's Organization" → Sees his own data
6. **Data Isolation**: Bob cannot move projects/tasks between the two tenants

## Important Notes

- Users always have ONE primary tenant (their own)
- Additional tenants are accessed via `UserTenantAccess`
- Session `tenantId` determines which tenant's data is shown
- All queries MUST filter by `session.user.tenantId`
- No data can be moved between tenants (enforced by application logic)
