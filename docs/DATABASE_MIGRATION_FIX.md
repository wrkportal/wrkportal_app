# Database Migration Fix - "Table does not exist" Error

## Error Message
```
Invalid `prisma.user.findUnique()` invocation:
The table `public.User` does not exist in the current database.
```

## Root Cause
The database migrations haven't been run on your production database. Prisma migrations need to be executed to create all the required tables.

## Solution: Run Migrations on Vercel

### Option 1: Add Migration to Build Script (Recommended)

Update your `package.json` build script to run migrations before building:

```json
{
  "scripts": {
    "build": "prisma migrate deploy && prisma generate && next build",
    "postinstall": "prisma generate --schema=prisma/schema.prisma"
  }
}
```

**Note**: `prisma migrate deploy` is safe for production - it only runs pending migrations and won't reset your database.

### Option 2: Run Migrations Manually via Vercel CLI

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
   vercel link
   ```

4. **Pull environment variables** (to ensure DATABASE_URL is set):
   ```bash
   vercel env pull .env.local
   ```

5. **Run migrations**:
   ```bash
   npx prisma migrate deploy
   ```

   Or if you want to run it in Vercel's environment:
   ```bash
   vercel env pull .env.local
   npx prisma migrate deploy
   ```

### Option 3: Use Vercel's Build Command

In your Vercel project settings:

1. Go to **Settings** → **General**
2. Under **Build & Development Settings**, update **Build Command** to:
   ```
   prisma migrate deploy && prisma generate && next build
   ```

3. Save and redeploy

### Option 4: Run Migrations via Database Directly

If you have direct access to your PostgreSQL database:

1. **Connect to your database** (using psql, pgAdmin, or your database provider's console)

2. **Check if migrations table exists**:
   ```sql
   SELECT * FROM "_prisma_migrations";
   ```

3. **If the migrations table doesn't exist**, run:
   ```bash
   npx prisma migrate deploy
   ```

4. **If you need to reset** (⚠️ **WARNING**: This will delete all data):
   ```bash
   npx prisma migrate reset
   ```

## Verify Migrations Are Applied

After running migrations, verify by:

1. **Check migration status**:
   ```bash
   npx prisma migrate status
   ```

2. **Check if User table exists**:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'User';
   ```

3. **Test the signup endpoint** - it should work now

## Quick Fix for Immediate Deployment

If you need to deploy immediately and can't run migrations right now:

1. **Update `package.json`**:
   ```json
   {
     "scripts": {
       "build": "prisma migrate deploy && prisma generate && next build"
     }
   }
   ```

2. **Commit and push**:
   ```bash
   git add package.json
   git commit -m "Add database migrations to build process"
   git push
   ```

3. **Vercel will automatically run migrations during the next build**

## Environment Variables Required

Make sure these are set in Vercel:

- `DATABASE_URL` - Your PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database?sslmode=require`
  - For production, always use SSL: `?sslmode=require`

## Common Issues

### Issue 1: "Migration already applied"
**Solution**: This is normal if migrations were already run. The command will skip already-applied migrations.

### Issue 2: "Can't reach database server"
**Solution**: 
- Check `DATABASE_URL` is correct in Vercel
- Verify database allows connections from Vercel's IPs
- Check if database requires SSL (add `?sslmode=require`)

### Issue 3: "Migration failed"
**Solution**:
- Check Vercel build logs for specific error
- Verify database has enough permissions
- Ensure database is not locked or in maintenance mode

## Recommended Setup for Production

1. **Always run migrations in build process** (Option 1 or 3)
2. **Use `prisma migrate deploy`** (not `prisma migrate dev`) for production
3. **Test migrations locally first**:
   ```bash
   npx prisma migrate deploy
   ```
4. **Monitor migration status** regularly:
   ```bash
   npx prisma migrate status
   ```

## Next Steps After Fixing

1. ✅ Run migrations (choose one of the options above)
2. ✅ Verify User table exists
3. ✅ Test signup functionality
4. ✅ Monitor for any other missing tables

---

**The error occurs because Prisma is trying to query a table that doesn't exist yet. Running migrations will create all required tables based on your `schema.prisma` file.**
