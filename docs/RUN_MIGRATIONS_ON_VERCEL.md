# How to Run Database Migrations on Vercel

## Problem
Error: `The table public.User does not exist in the current database`

This means migrations haven't been applied to your production database.

## Solution: Run Migrations Manually

### Option 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link your project** (if not already linked):
   ```bash
   cd your-project-directory
   vercel link
   ```

4. **Pull environment variables** to get DATABASE_URL:
   ```bash
   vercel env pull .env.local
   ```

5. **Run migrations**:
   ```bash
   npx prisma migrate deploy
   ```

   This will apply all pending migrations to your production database.

### Option 2: Using Vercel Dashboard

1. Go to Vercel Dashboard → Your Project
2. Go to **Settings** → **Environment Variables**
3. Copy your `DATABASE_URL` value
4. **Temporarily** set it in your local `.env` file:
   ```
   DATABASE_URL="your-production-database-url"
   ```
5. **Run migrations locally** (this will affect production):
   ```bash
   npx prisma migrate deploy
   ```
6. **Remove** the DATABASE_URL from local `.env` after running

### Option 3: Check Build Logs

1. Go to Vercel Dashboard → Your Project
2. Click **Deployments** tab
3. Click on the latest deployment
4. Check the **Build Logs**
5. Look for `prisma migrate deploy` output
6. If you see errors, that's why migrations didn't run

## Verify Migrations Ran

After running migrations, verify:

```bash
npx prisma migrate status
```

You should see:
```
Database schema is up to date!
```

## If Migrations Fail

### Common Issues:

1. **DATABASE_URL not set in Vercel**
   - Go to Settings → Environment Variables
   - Make sure `DATABASE_URL` is set for Production

2. **Database connection timeout**
   - Check if your database allows connections from Vercel's IPs
   - Verify SSL is enabled (add `?sslmode=require` to DATABASE_URL)

3. **Migration file missing**
   - Check that all migration files are in `prisma/migrations/`
   - Verify `.vercelignore` doesn't exclude migration files

4. **Failed migration in database**
   - Check if there's a failed migration:
     ```bash
     npx prisma migrate status
     ```
   - Resolve it using:
     ```bash
     npx prisma migrate resolve --rolled-back <migration-name>
     ```
     or
     ```bash
     npx prisma migrate resolve --applied <migration-name>
     ```

## Quick Fix Command

Run this locally (after pulling env vars):

```bash
vercel env pull .env.local
npx prisma migrate deploy
```

This will apply all migrations to your production database.

---

**After running migrations, try signing in with Google again. The User table should now exist.**
