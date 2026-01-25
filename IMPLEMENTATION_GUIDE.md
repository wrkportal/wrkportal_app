# Section-Based Access Control Implementation Guide

## Overview
This implementation adds fine-grained section access control for users:
- **First-time signups** (no invite): Full access to all sections
- **Invited users**: Access only to sections specified in the invitation
- **Cross-tenant invitations**: Users from Tenant A can be invited to Tenant B with limited section access

## Changes Made

### 1. Database Schema
- Added `allowedSections` field to `User` table (TEXT, stores JSON array)
- Added `allowedSections` field to `TenantInvitation` table (TEXT, stores JSON array)
- Migration script: `scripts/add-allowed-sections-migration.sql`

**Field Values:**
- `null` = Full access (all sections visible)
- `[]` = No access (only wrkboard and collaborate visible)
- `["Finance", "Sales"]` = Access only to specified sections

### 2. Signup Flow (`app/api/auth/signup/route.ts`)
- **First-time signup**: Sets `allowedSections = null` (full access)
- **Invited signup**: Gets `allowedSections` from invitation
- **Cross-tenant invitation**: Handles existing users being invited to new tenants

### 3. Invitation System
- **API** (`app/api/invitations/route.ts`): Accepts `allowedSections` array in invitation creation
- **Modal** (`components/invite-user-modal.tsx`): Allows selecting specific sections to grant access
- **Cross-tenant support**: Users from different tenants can be invited

### 4. Sidebar Filtering (`components/layout/sidebar.tsx`)
- Filters navigation items based on `allowedSections`
- Always shows "wrkboard" and "Collaborate" regardless of permissions
- Falls back to role-based access if `allowedSections` is null

### 5. User Data (`app/api/user/me/route.ts`)
- Includes `allowedSections` in user profile response

### 6. Role Selection Removed
- Removed redirect to `/onboarding/role-selection` from `app/page.tsx`
- Users go directly to `/wrkboard` after signup

## Available Sections
- Finance (`/finance-dashboard`)
- Sales (`/sales-dashboard`)
- Operations (`/operations-dashboard`)
- Developer (`/developer-dashboard`)
- IT Services (`/it-dashboard`)
- Customer Service (`/customer-service-dashboard`)
- Projects (`/product-management`)
- Recruitment (`/recruitment-dashboard`)

## Usage Examples

### Example 1: First-Time Signup
1. User signs up without invitation
2. `allowedSections = null` (full access)
3. User sees all sections in sidebar

### Example 2: Invited User with Limited Access
1. Admin invites user with only "Finance" and "Sales" sections
2. User signs up with invitation token
3. `allowedSections = ["Finance", "Sales"]`
4. User only sees Finance, Sales, wrkboard, and Collaborate in sidebar

### Example 3: Cross-Tenant Invitation
1. User A (from Tenant A) signs up independently
2. User B (from Tenant B) invites User A to Tenant B with "Finance" access
3. User A accepts invitation
4. User A now has access to Tenant B's Finance section
5. User A's `allowedSections` is set to `["Finance"]` for Tenant B

## Migration Steps

1. **Run Database Migration:**
   ```sql
   -- Execute scripts/add-allowed-sections-migration.sql
   ```

2. **Update Prisma Schema (if needed):**
   ```prisma
   model User {
     // ... existing fields
     allowedSections String? // JSON array of section names
   }
   
   model TenantInvitation {
     // ... existing fields
     allowedSections String? // JSON array of section names
   }
   ```

3. **Regenerate Prisma Client:**
   ```bash
   npx prisma generate
   ```

## Testing Checklist

- [ ] First-time signup shows all sections
- [ ] Invited user with no sections selected sees only wrkboard
- [ ] Invited user with specific sections sees only those sections
- [ ] Cross-tenant invitation works correctly
- [ ] Sidebar filters correctly based on `allowedSections`
- [ ] User profile includes `allowedSections` field
- [ ] Role selection screen is no longer shown

## Notes

- The `allowedSections` field is stored as JSON string in the database
- `null` means full access (backward compatible with existing users)
- Empty array `[]` means no access (only wrkboard and collaborate)
- Section names must match exactly: "Finance", "Sales", etc. (case-sensitive)
