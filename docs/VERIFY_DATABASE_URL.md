# Verify DATABASE_URL Matches

## Problem
User table exists in Neon, but Prisma still says it doesn't exist.

## Possible Causes

### 1. DATABASE_URL Mismatch
Vercel might be using a different DATABASE_URL than your local environment.

**Check:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Find `DATABASE_URL`
3. Compare it with your local `.env` file
4. **They must match exactly** (same database, same connection string)

### 2. Table Name Case Sensitivity
PostgreSQL is case-sensitive when table names are quoted. Prisma might be looking for `"User"` but the table is `user` or vice versa.

**Check in Neon SQL Editor:**
```sql
-- Check exact table name
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%user%';
```

### 3. Different Database
You might have created the table in a different database than the one Vercel is connecting to.

**Solution:**
- Verify the database name in your DATABASE_URL matches where you created the tables
- Check if you have multiple databases in Neon

## Quick Fix

### Step 1: Verify DATABASE_URL in Vercel
1. Go to Vercel → Settings → Environment Variables
2. Copy the `DATABASE_URL` value
3. Compare with your local `.env` `DATABASE_URL`
4. **They must be identical**

### Step 2: Check Table Name in Neon
1. Go to Neon Console → SQL Editor
2. Run:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'User';
   ```
3. If it returns nothing, try:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND LOWER(table_name) = 'user';
   ```

### Step 3: Verify Connection
In Neon SQL Editor, run:
```sql
SELECT COUNT(*) FROM "User";
```

If this works, the table exists. If Prisma still can't see it, it's a connection/DATABASE_URL issue.

---

**Most likely issue: Vercel's DATABASE_URL points to a different database than where you created the tables.**
