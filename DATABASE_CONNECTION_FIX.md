# Database Connection Issue - Fix Guide

## Error Message
```
Can't reach database server at `ep-spring-bonus-a1lj9aq0-pooler.ap-southeast-1.aws.neon.tech:5432`
```

## Common Causes & Solutions

### 1. **Neon Database is Paused** (Most Common)

Neon free-tier databases automatically pause after inactivity. You need to wake them up:

**Solution:**
1. Go to [Neon Console](https://console.neon.tech)
2. Log in to your account
3. Find your database project
4. Click on your database
5. Click **"Resume"** or **"Wake up"** button
6. Wait 10-30 seconds for the database to start
7. Try your application again

### 2. **Check DATABASE_URL in .env**

Make sure your `.env` file has the correct DATABASE_URL:

```env
DATABASE_URL="postgresql://username:password@ep-spring-bonus-a1lj9aq0-pooler.ap-southeast-1.aws.neon.tech:5432/database?sslmode=require"
```

**Important:**
- Use the **pooler** connection string (has `-pooler` in the hostname) for better performance
- Make sure `?sslmode=require` is included
- Check that username, password, and database name are correct

### 3. **Get Fresh Connection String**

If the database URL is old or incorrect:

1. Go to Neon Console
2. Select your project
3. Go to **"Connection Details"**
4. Copy the **"Connection string"**
5. Update your `.env` file with the new URL
6. Restart your dev server (`npm run dev`)

### 4. **Test Database Connection**

Test if you can connect to the database:

```bash
# Using psql (if installed)
psql "your-database-url-here"

# Or test with Node.js
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => console.log('✅ Connected')).catch(e => console.error('❌ Error:', e.message))"
```

### 5. **Check Network/Firewall**

- Make sure your internet connection is working
- Check if any firewall is blocking port 5432
- Try accessing Neon console in browser to verify account access

## Quick Fix Steps

1. **Wake up Neon database:**
   - Go to https://console.neon.tech
   - Resume your database

2. **Verify DATABASE_URL:**
   - Check `.env` file exists
   - Verify DATABASE_URL is correct
   - Make sure it includes `?sslmode=require`

3. **Restart dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart
   npm run dev
   ```

4. **Test connection:**
   - Try signing up again
   - Check if error is resolved

## If Still Not Working

1. **Check Neon Dashboard:**
   - Is database status "Active"?
   - Are there any error messages?
   - Is your account in good standing?

2. **Regenerate Connection String:**
   - In Neon Console → Connection Details
   - Click "Reset password" if needed
   - Get fresh connection string

3. **Check Prisma Connection:**
   ```bash
   npx prisma db pull
   ```
   This will test the connection and show any errors.

4. **Alternative: Use Direct Connection (Not Pooler)**
   - In Neon Console, try the "Direct connection" string instead of pooler
   - Sometimes pooler can have issues

## Prevention

To prevent database from pausing:
- Use Neon Pro plan (databases don't pause)
- Or keep database active by making periodic requests
- Or use a connection pooler that keeps connections alive

