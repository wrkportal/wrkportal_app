# URGENT: Fix Missing User Table

## Problem
The `User` table doesn't exist in production, causing Google OAuth to fail with `AccessDenied`.

## Root Cause
Migrations are marked as "applied" in `_prisma_migrations` table, but the actual tables were never created.

## Solution: Run Migration SQL Manually

### Step 1: Access Your Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Click **SQL Editor**

### Step 2: Run the Init Migration

Copy and paste the SQL from: `prisma/migrations/20251027192501_init/migration.sql`

**OR** run this command to get the SQL:

```bash
cat prisma/migrations/20251027192501_init/migration.sql
```

Then copy the entire SQL and run it in Neon's SQL Editor.

### Step 3: Verify Tables Were Created

After running the SQL, verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('User', 'Tenant', 'Account', 'Session');
```

You should see all 4 tables listed.

### Step 4: Test Google OAuth

After tables are created, try signing in with Google again. It should work now.

## Alternative: Reset Migration State

If you prefer to use Prisma migrations:

1. **Connect to your database** (via Neon Console SQL Editor)

2. **Delete migration records:**
   ```sql
   DELETE FROM "_prisma_migrations";
   ```

3. **Run migrations again:**
   ```bash
   npx prisma migrate deploy
   ```

⚠️ **Warning**: This will mark all migrations as needing to run again, but since tables don't exist, they should create them.

---

**The fastest fix is to manually run the init migration SQL in Neon's SQL Editor. This will create all the tables immediately.**
