# Fix Missing User Table Columns in Production

## Problem
The production database only has 20 columns in the `User` table, but the Prisma schema defines 40+ columns. This causes signup/signin failures when the code tries to set or query fields that don't exist.

## Solution
Run the migration script to add all missing columns.

## Steps

### Option 1: Run SQL Script Directly in Neon (Recommended)

1. **Open Neon Console**
   - Go to your Neon project dashboard
   - Click on your database
   - Open the SQL Editor

2. **Run the Migration Script**
   - Copy the contents of `scripts/add-missing-user-columns.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute

3. **Verify Columns Were Added**
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'User' 
   ORDER BY column_name;
   ```
   
   You should now see all columns including:
   - location
   - department
   - reportsToId
   - resetToken
   - resetTokenExpiry
   - stripeCustomerId
   - stripeSubscriptionId
   - subscriptionStatus
   - subscriptionTier
   - subscriptionStartDate
   - subscriptionEndDate
   - groupRole
   - primaryWorkflowType
   - workflowSettings
   - assistantName
   - voiceSampleUrl

### Option 2: Use Prisma Migrate (Alternative)

If you prefer using Prisma migrations:

1. **Create a new migration**
   ```bash
   npx prisma migrate dev --name add_missing_user_columns --create-only
   ```

2. **Edit the generated migration file**
   - Open `prisma/migrations/[timestamp]_add_missing_user_columns/migration.sql`
   - Copy the SQL from `scripts/add-missing-user-columns.sql` into it

3. **Apply the migration**
   ```bash
   npx prisma migrate deploy
   ```

### Option 3: Use Prisma DB Push (Development Only - NOT for Production)

⚠️ **Warning**: `prisma db push` is for development only and can cause data loss. Do NOT use in production.

```bash
# Only for development/testing
npx prisma db push
```

## Verification

After running the migration, test signup/signin:

1. Try signing up with a new account
2. Try signing in with Google OAuth
3. Check that no "column does not exist" errors appear

## Why This Happened

The initial migration (`20251027192501_init`) only created the basic User columns. Subsequent schema changes added more columns, but those migrations were never applied to production. The script adds all missing columns safely with null defaults.

## Rollback (If Needed)

If you need to rollback, you can drop the columns:

```sql
ALTER TABLE "User" DROP COLUMN IF EXISTS "location";
ALTER TABLE "User" DROP COLUMN IF EXISTS "department";
-- ... etc for each column
```

However, this is not recommended if you have data in those columns.
