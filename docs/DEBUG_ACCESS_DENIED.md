# Debugging AccessDenied Error for Google OAuth

## Error
When signing in with Google, users see: `https://www.wrkportal.com/login?error=AccessDenied`

## What This Means
The `AccessDenied` error occurs when NextAuth's `signIn` callback returns `false`. This happens in `auth.ts` in the `signIn` callback function.

## How to Debug

### Step 1: Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project
2. Click on **Functions** tab
3. Look for recent function invocations (especially `/api/auth/callback/google`)
4. Check the logs for errors starting with `[OAuth]`

### Step 2: Look for These Log Messages

**Success messages:**
- `[OAuth] ✅ Existing user found: [email], allowing sign in`
- `[OAuth] ✅ Created new user: [email] with role: [role]`

**Error messages:**
- `[OAuth] Error in signIn callback:` - Main error
- `[OAuth] Attempting fallback user check for:` - Fallback attempt
- `[OAuth] ❌ Denying sign-in due to error` - Final denial

### Step 3: Common Issues

#### Issue 1: Database Connection Error
**Error Code:** `P1001` or `P1017`
**Solution:** 
- Check `DATABASE_URL` in Vercel environment variables
- Verify database is accessible
- Check database connection limits

#### Issue 2: User Not Found (But Should Exist)
**Error:** User lookup fails even though user was created
**Possible Causes:**
- Email case mismatch (fixed by using `.toLowerCase()`)
- Database transaction not committed
- Timing issue (user created but not yet queryable)

**Solution:** The code now includes fallback checks

#### Issue 3: Prisma Query Error
**Error:** Any Prisma error code (P2002, P2003, etc.)
**Solution:** Check the specific Prisma error code and fix accordingly

### Step 4: Check Database Directly

If you have database access, verify:

```sql
-- Check if user exists
SELECT * FROM "User" WHERE email = 'user@example.com';

-- Check if tenant exists
SELECT * FROM "Tenant" WHERE domain = 'gmail.com';
```

### Step 5: Test the Sign-In Flow

1. **First-time signup:**
   - User doesn't exist → Should create user and tenant
   - Should return `true` from `signIn` callback

2. **Subsequent sign-in:**
   - User exists → Should find user and return `true`
   - Should NOT try to create user again

## Current Error Handling

The code now:
1. ✅ Uses optimized queries (only selects needed fields)
2. ✅ Has fallback user check if main query fails
3. ✅ Allows sign-in for database connection errors (since Google authenticated)
4. ✅ Logs detailed error information
5. ✅ Only denies sign-in if absolutely certain user doesn't exist AND it's not a connection error

## If Still Getting AccessDenied

1. **Check Vercel logs** for the exact error message
2. **Verify database connection** is working
3. **Check if user exists** in database
4. **Look for Prisma error codes** in logs
5. **Share the error logs** from Vercel for further debugging

## Quick Fixes

### If Database Connection Issue:
- Verify `DATABASE_URL` in Vercel
- Check database provider status
- Verify connection pool limits

### If User Exists But Not Found:
- Check email case (should be lowercase)
- Verify database transaction committed
- Check for database replication lag

### If Prisma Error:
- Check specific error code
- Verify schema matches database
- Check for migration issues

---

**The improved error handling should now allow sign-in in most cases, even if there are minor database issues, since Google has already authenticated the user.**
