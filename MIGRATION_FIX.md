# Fix: Missing `ssoEnabled` Column Error

## Problem
The database is missing the `ssoEnabled` column that exists in the Prisma schema. This causes tenant creation to fail during OAuth sign-in.

## Error
```
The column `ssoEnabled` does not exist in the current database.
```

## Solution Options

### Option 1: Run Database Migration (RECOMMENDED)

This will add the missing column to your database:

```bash
# Connect to your database and run:
npx prisma migrate deploy

# Or if you're using Prisma Migrate:
npx prisma migrate dev --name add_sso_enabled_column

# Or push schema changes directly (for development):
npx prisma db push
```

### Option 2: Manual SQL Fix

If you can't run migrations, add the column manually:

```sql
-- Connect to your database and run:
ALTER TABLE "Tenant" 
ADD COLUMN IF NOT EXISTS "ssoEnabled" BOOLEAN DEFAULT false;

ALTER TABLE "Tenant" 
ADD COLUMN IF NOT EXISTS "ssoProvider" "SSOProvider";

ALTER TABLE "Tenant" 
ADD COLUMN IF NOT EXISTS "ssoConfig" JSONB;
```

### Option 3: Update Prisma Schema (If column shouldn't exist)

If the `ssoEnabled` column shouldn't be in the schema, remove it:

1. Edit `prisma/schema.prisma`
2. Remove or comment out the `ssoEnabled` line
3. Run `npx prisma generate`
4. Redeploy

## Quick Fix Applied

I've updated `auth.ts` to use `(prisma as any)` as a temporary workaround, but this won't fully solve the issue. You still need to run migrations.

## Verification

After applying the fix, verify:

```sql
-- Check if column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'Tenant' AND column_name = 'ssoEnabled';
```

## Next Steps

1. **Immediate**: The code change I made will help, but you still need to sync your database
2. **Proper Fix**: Run `npx prisma migrate deploy` in your production environment
3. **Verify**: Test OAuth sign-in again after migration

## For Vercel Deployment

If you're using Vercel, you can add a build command to run migrations:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma migrate deploy && next build"
  }
}
```

Or use Vercel's Postgres integration which can run migrations automatically.
