# Force Run Migrations - User Table Missing

## Problem
The `User` table doesn't exist in production, but Prisma thinks migrations are already applied.

## Solution: Force Re-run Migrations

### Option 1: Reset Migration State (Recommended if safe)

If you can safely reset the migration state:

```bash
# Connect to your database and check the _prisma_migrations table
# Then manually mark migrations as not applied, or reset the table

# Or use Prisma migrate reset (⚠️ WARNING: This deletes all data)
npx prisma migrate reset
```

### Option 2: Manually Create Tables

If migrations can't run, you can manually execute the migration SQL:

1. **Check what migrations exist:**
   ```bash
   ls prisma/migrations
   ```

2. **Find the init migration** (usually the first one):
   ```bash
   cat prisma/migrations/20251027192501_init/migration.sql
   ```

3. **Execute it manually** on your production database using:
   - Your database provider's console (Neon, Supabase, etc.)
   - psql command line
   - Database admin tool

### Option 3: Use Prisma db push (Development Only)

⚠️ **Warning**: `db push` is for development. Use with caution in production.

```bash
npx prisma db push
```

This will sync your schema to the database without using migrations.

### Option 4: Check Migration Status in Database

1. **Connect to your database** (using your provider's console or psql)

2. **Check if migrations table exists:**
   ```sql
   SELECT * FROM "_prisma_migrations";
   ```

3. **Check if User table exists:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'User';
   ```

4. **If migrations table exists but User table doesn't:**
   - The migrations were marked as applied but never executed
   - You need to either:
     a. Delete the migration records and re-run
     b. Manually execute the migration SQL

## Quick Fix: Run All Migrations Manually

Since your local DATABASE_URL points to production, you can:

1. **Check your .env file** - make sure DATABASE_URL is correct
2. **Run migrations with force:**
   ```bash
   npx prisma migrate deploy --skip-generate
   ```

3. **If that doesn't work, try:**
   ```bash
   # This will try to apply all migrations regardless of status
   npx prisma migrate resolve --applied 20251027192501_init
   npx prisma migrate deploy
   ```

## For Neon Database (Your Provider)

Since you're using Neon, you can:

1. Go to Neon Console
2. Open SQL Editor
3. Run the migration SQL files manually, starting with the init migration

---

**The core issue is that migrations are marked as "applied" in the `_prisma_migrations` table, but the actual tables were never created. You need to either reset the migration state or manually create the tables.**
