# Authentication & Signup/Signin Diagnostic Checklist

## 🔴 CRITICAL: Access Denied Issues - Complete Diagnostic Guide

This checklist covers **every possible issue** that could cause "Access Denied" errors during signup and signin.

---

## 📋 **SECTION 1: Environment Variables (CRITICAL)**

### 1.1 NextAuth Configuration
- [ ] **AUTH_SECRET** is set in Vercel environment variables
  - Must be a random string (32+ characters)
  - Check: `echo $AUTH_SECRET` or verify in Vercel dashboard
  - **Fix if missing**: Generate with `openssl rand -base64 32`
  
- [ ] **NEXTAUTH_URL** is set correctly
  - Production: `https://www.wrkportal.com`
  - Must match your domain exactly (no trailing slash)
  - Check in Vercel: Settings → Environment Variables

- [ ] **NEXTAUTH_URL_INTERNAL** (optional but recommended)
  - For server-to-server calls
  - Should match NEXTAUTH_URL

### 1.2 Google OAuth Credentials
- [ ] **GOOGLE_CLIENT_ID** is set
  - Format: `xxxxx.apps.googleusercontent.com`
  - Verify in Google Cloud Console → APIs & Services → Credentials

- [ ] **GOOGLE_CLIENT_SECRET** is set
  - Must match the Client ID
  - Check for typos or extra spaces

- [ ] **Google OAuth Consent Screen is configured**
  - App name: "wrkportal.com" (or your app name)
  - User support email is set
  - Developer contact information is set
  - **Scopes**: `email`, `profile`, `openid` are added
  - **Authorized redirect URIs**: 
    - `https://www.wrkportal.com/api/auth/callback/google`
    - Must match exactly (case-sensitive, no trailing slash)

### 1.3 Database Configuration
- [ ] **DATABASE_URL** is set and valid
  - Format: `postgresql://user:password@host:port/database?sslmode=require`
  - Test connection: `psql $DATABASE_URL` or use Prisma Studio
  - **Check SSL mode**: Production databases usually require SSL

- [ ] **Database is accessible from Vercel**
  - Check firewall rules allow Vercel IPs
  - For Supabase: Add Vercel IP ranges to allowed IPs
  - For AWS RDS: Check security group rules

### 1.4 Email Configuration (for verification)
- [ ] **SMTP/Email service credentials are set**
  - Check if using SendGrid, Resend, AWS SES, etc.
  - Verify API keys are valid and not expired

---

## 📋 **SECTION 2: Database Schema & Migrations**

### 2.1 Prisma Schema Verification
- [ ] **All required tables exist**
  ```sql
  -- Run these queries to verify:
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('User', 'Tenant', 'Account', 'Session', 'VerificationToken');
  ```

- [ ] **User table has required fields**
  - `id`, `email`, `emailVerified`, `password`, `tenantId`, `role`
  - Check: `\d "User"` in psql

- [ ] **Tenant table exists and has required fields**
  - `id`, `name`, `domain`, `domainVerified`
  - Check: `\d "Tenant"` in psql

- [ ] **Account table exists** (for OAuth)
  - `id`, `userId`, `provider`, `providerAccountId`, `access_token`, `refresh_token`
  - Check: `\d "Account"` in psql

- [ ] **Session table exists** (for NextAuth)
  - `id`, `sessionToken`, `userId`, `expires`
  - Check: `\d "Session"` in psql

- [ ] **VerificationToken table exists**
  - `identifier`, `token`, `expires`
  - Check: `\d "VerificationToken"` in psql

### 2.2 Database Migrations
- [ ] **All migrations are applied**
  ```bash
  npx prisma migrate status
  ```
  - Should show: "Database is up to date"
  - If not: `npx prisma migrate deploy`

- [ ] **Prisma Client is generated**
  ```bash
  npx prisma generate
  ```

- [ ] **Database indexes exist**
  - `User.email` should be unique
  - `Tenant.domain` should have index
  - Check: `\d+ "User"` to see indexes

---

## 📋 **SECTION 3: Google OAuth Configuration**

### 3.1 Google Cloud Console Setup
- [ ] **OAuth 2.0 Client ID is created**
  - Type: "Web application"
  - Name: "wrkportal.com Production"

- [ ] **Authorized JavaScript origins**
  - `https://www.wrkportal.com`
  - No trailing slashes

- [ ] **Authorized redirect URIs** (CRITICAL)
  - `https://www.wrkportal.com/api/auth/callback/google`
  - Must match exactly (case-sensitive)
  - No trailing slash
  - Check for typos: `callback` not `callbacks`

- [ ] **OAuth consent screen is published**
  - Status: "In production" (not "Testing")
  - For production, must be verified by Google (if using sensitive scopes)

- [ ] **Scopes are configured**
  - `email`
  - `profile`
  - `openid`

### 3.2 OAuth Flow Verification
- [ ] **Test OAuth URL manually**
  ```
  https://accounts.google.com/o/oauth2/v2/auth?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=https://www.wrkportal.com/api/auth/callback/google&
  response_type=code&
  scope=email profile openid&
  access_type=offline&
  prompt=select_account
  ```
  - Should redirect to Google login
  - After login, should redirect back to your callback URL

---

## 📋 **SECTION 4: Code-Level Checks**

### 4.1 Auth Configuration (`auth.ts`)
- [ ] **Google provider is correctly configured**
  ```typescript
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  })
  ```

- [ ] **signIn callback returns `true` on success**
  - Check `auth.ts` line 260: `return true`
  - If any error occurs, it returns `false` → causes "AccessDenied"

- [ ] **Database connection retry logic works**
  - Check retry mechanism in `signIn` callback
  - Verify error handling doesn't silently fail

### 4.2 Signup Route (`app/api/auth/signup/route.ts`)
- [ ] **User creation succeeds**
  - Check for Prisma errors (P2002 = duplicate, P1001 = connection)
  - Verify tenant creation logic

- [ ] **Email verification token is created**
  - Check `VerificationToken` table after signup
  - Verify token expiration is set correctly

### 4.3 Auth Config (`auth.config.ts`)
- [ ] **authorized callback allows auth pages**
  - `/login`, `/signup`, `/forgot-password` should return `true`
  - Check lines 42-63 in `auth.config.ts`

- [ ] **Email verification check is correct**
  - Line 78: Should allow `/verify-email` page
  - Should redirect to settings if email not verified

### 4.4 NextAuth Route Handler
- [ ] **Route handler exists**: `app/api/auth/[...nextauth]/route.ts`
- [ ] **Exports GET and POST**: `export const { GET, POST } = handlers`

---

## 📋 **SECTION 5: Vercel Deployment Checks**

### 5.1 Build Configuration
- [ ] **Environment variables are set in Vercel**
  - Go to: Project → Settings → Environment Variables
  - Verify all variables are set for "Production"
  - Check for typos in variable names

- [ ] **Build command includes Prisma generate**
  ```json
  {
    "scripts": {
      "build": "prisma generate && next build"
    }
  }
  ```

- [ ] **Postinstall script runs migrations** (optional but recommended)
  ```json
  {
    "scripts": {
      "postinstall": "prisma generate"
    }
  }
  ```

### 5.2 Vercel Function Logs
- [ ] **Check function logs for errors**
  - Go to: Vercel Dashboard → Your Project → Functions → View Logs
  - Look for:
    - Database connection errors
    - OAuth callback errors
    - Prisma errors (P1001, P2002, etc.)

- [ ] **Check for timeout errors**
  - Vercel Hobby plan: 10s timeout
  - Pro plan: 60s timeout
  - If database queries take too long, may timeout

### 5.3 Domain Configuration
- [ ] **Custom domain is configured**
  - `www.wrkportal.com` is added in Vercel
  - DNS records are correct
  - SSL certificate is active (should show green lock)

- [ ] **Redirects are configured**
  - `wrkportal.com` → `www.wrkportal.com` (if needed)

---

## 📋 **SECTION 6: Database Connection Issues**

### 6.1 Connection Pooling
- [ ] **Connection pool is configured**
  - For Supabase: Use connection pooling URL (port 6543)
  - For other providers: Check max connections
  - Prisma: `connection_limit` in DATABASE_URL

- [ ] **Connection string format is correct**
  ```
  postgresql://user:password@host:port/database?sslmode=require&connection_limit=10
  ```

### 6.2 Database Availability
- [ ] **Database is running and accessible**
  - Test: `psql $DATABASE_URL -c "SELECT 1"`
  - Should return: `?column? | 1`

- [ ] **Firewall allows Vercel IPs**
  - Vercel IP ranges: https://vercel.com/docs/security/deployment-protection#ip-allowlist
  - Add to database firewall rules

- [ ] **SSL is enabled** (for production)
  - `sslmode=require` in DATABASE_URL
  - Database must support SSL

### 6.3 Prisma Client Issues
- [ ] **Prisma Client is generated in build**
  - Check build logs for: "Generated Prisma Client"
  - If missing, add `prisma generate` to build script

- [ ] **Prisma schema is synced**
  ```bash
  npx prisma db pull  # Pull schema from database
  npx prisma generate # Generate client
  ```

---

## 📋 **SECTION 7: OAuth Callback Flow**

### 7.1 Callback URL Verification
- [ ] **Callback URL matches exactly**
  - Google Console: `https://www.wrkportal.com/api/auth/callback/google`
  - Code: `app/api/auth/[...nextauth]/route.ts` handles `/api/auth/*`
  - Must match character-for-character

- [ ] **State parameter is handled**
  - NextAuth handles this automatically
  - Check for CSRF token errors in logs

### 7.2 SignIn Callback Flow
- [ ] **Step 1: Database connection test passes**
  - Check logs for: `[OAuth] STEP 1: Testing database connection...`
  - Should see: `✅ Success`

- [ ] **Step 2: Tenant creation/finding succeeds**
  - Check logs for: `[OAuth] STEP 2: Getting or creating tenant...`
  - Should see tenant ID

- [ ] **Step 3: User upsert succeeds**
  - Check logs for: `[OAuth] STEP 3: Creating/updating user...`
  - Should see user ID

- [ ] **Step 4: User verification passes**
  - Check logs for: `[OAuth] STEP 4: Verifying user exists...`
  - Should see: `✅ Verification passed`

- [ ] **Final: signIn callback returns `true`**
  - Check logs for: `[OAuth] ========== SUCCESS`
  - If returns `false`, check error logs above

### 7.3 JWT Token Creation
- [ ] **JWT callback finds user in database**
  - Check logs for: `[JWT]` messages
  - Should not see: `❌ User not found in DB`

- [ ] **Token contains required fields**
  - `id`, `email`, `role`, `tenantId`
  - Check in browser: Application → Cookies → `next-auth.session-token`

---

## 📋 **SECTION 8: Common Error Patterns**

### 8.1 "AccessDenied" Error
**Causes:**
- [ ] signIn callback returned `false`
- [ ] Database connection failed
- [ ] User creation failed
- [ ] Tenant creation failed
- [ ] Email is missing from OAuth profile

**Debug:**
1. Check Vercel function logs for `[OAuth]` messages
2. Look for error codes: P1001, P1017, P2002, P2025
3. Verify database is accessible
4. Check if user/tenant already exists

### 8.2 Database Connection Errors (P1001, P1017)
**Causes:**
- [ ] DATABASE_URL is incorrect
- [ ] Database is down
- [ ] Firewall blocks Vercel IPs
- [ ] SSL mode is incorrect
- [ ] Connection pool is exhausted

**Fix:**
1. Verify DATABASE_URL in Vercel
2. Test connection: `psql $DATABASE_URL`
3. Check database status page
4. Add Vercel IPs to firewall
5. Use connection pooling

### 8.3 Duplicate Entry Errors (P2002)
**Causes:**
- [ ] User already exists with same email
- [ ] Tenant already exists with same domain
- [ ] Race condition during signup

**Fix:**
1. Check if user exists: `SELECT * FROM "User" WHERE email = 'test@example.com'`
2. Use `upsert` instead of `create`
3. Add unique constraints in Prisma schema

### 8.4 OAuth Redirect Mismatch
**Causes:**
- [ ] Redirect URI in Google Console doesn't match
- [ ] Domain mismatch (www vs non-www)
- [ ] HTTP vs HTTPS mismatch
- Trailing slash

**Fix:**
1. Verify redirect URI exactly matches
2. Use same domain format everywhere
3. Always use HTTPS in production
4. No trailing slashes

---

## 📋 **SECTION 9: Testing Checklist**

### 9.1 Manual Testing Steps
1. [ ] **Test email/password signup**
   - Go to `/signup`
   - Fill form and submit
   - Check for success message
   - Verify email is sent (check inbox)
   - Verify user exists in database

2. [ ] **Test email/password login**
   - Go to `/login`
   - Enter credentials
   - Should redirect to `/`
   - Check session cookie exists

3. [ ] **Test Google OAuth signup**
   - Click "Continue with Google"
   - Complete Google login
   - Should redirect back to `/`
   - Check session cookie exists
   - Verify user/tenant created in database

4. [ ] **Test Google OAuth login (existing user)**
   - User already exists from previous signup
   - Click "Continue with Google"
   - Should redirect to `/` immediately
   - Should not create duplicate user

### 9.2 Database Verification
```sql
-- Check if user was created
SELECT id, email, "emailVerified", "tenantId", role 
FROM "User" 
WHERE email = 'your-test-email@gmail.com';

-- Check if tenant was created
SELECT id, name, domain, "domainVerified" 
FROM "Tenant" 
WHERE id = (SELECT "tenantId" FROM "User" WHERE email = 'your-test-email@gmail.com');

-- Check OAuth account
SELECT * FROM "Account" 
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'your-test-email@gmail.com');
```

### 9.3 Log Verification
- [ ] **Check Vercel function logs**
  - Look for `[OAuth]` prefixed messages
  - Verify all steps complete successfully
  - Check for error messages

- [ ] **Check browser console**
  - Open DevTools → Console
  - Look for authentication errors
  - Check Network tab for failed requests

---

## 📋 **SECTION 10: Quick Fixes**

### 10.1 Immediate Actions
1. **Verify all environment variables in Vercel**
   ```bash
   # In Vercel dashboard, check:
   - AUTH_SECRET
   - NEXTAUTH_URL
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - DATABASE_URL
   ```

2. **Redeploy after env var changes**
   - Environment variables require redeploy
   - Go to: Deployments → Redeploy

3. **Check database connection**
   ```bash
   # Test locally
   DATABASE_URL="your-url" npx prisma db pull
   ```

4. **Verify Google OAuth redirect URI**
   - Google Console → Credentials → OAuth 2.0 Client
   - Authorized redirect URIs must match exactly

### 10.2 Code Fixes
1. **Add better error logging**
   ```typescript
   // In auth.ts signIn callback
   console.error('[OAuth] Full error:', JSON.stringify(error, null, 2))
   ```

2. **Add database connection test endpoint**
   ```typescript
   // app/api/health/db/route.ts
   export async function GET() {
     try {
       await prisma.$queryRaw`SELECT 1`
       return NextResponse.json({ status: 'ok' })
     } catch (error) {
       return NextResponse.json({ error: error.message }, { status: 500 })
     }
   }
   ```

3. **Add OAuth debug endpoint**
   ```typescript
   // app/api/auth/debug/route.ts
   export async function GET() {
     return NextResponse.json({
       hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
       hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
       hasAuthSecret: !!process.env.AUTH_SECRET,
       nextAuthUrl: process.env.NEXTAUTH_URL,
     })
   }
   ```

---

## 📋 **SECTION 11: Production-Specific Issues**

### 11.1 SSL/TLS
- [ ] **HTTPS is enforced**
  - Vercel automatically provides SSL
  - Check: Browser shows green lock icon

- [ ] **Database SSL is enabled**
  - `sslmode=require` in DATABASE_URL
  - Database must support SSL

### 11.2 CORS
- [ ] **CORS is configured correctly**
  - NextAuth handles this automatically
  - Check for CORS errors in browser console

### 11.3 Rate Limiting
- [ ] **No rate limiting on auth endpoints**
  - Check Vercel settings
  - Check if using external rate limiting service

### 11.4 CDN/Caching
- [ ] **Auth pages are not cached**
  - Check Vercel caching settings
  - `/login`, `/signup` should not be cached

---

## 🔧 **TROUBLESHOOTING WORKFLOW**

### Step-by-Step Debugging Process:

1. **Check Vercel Logs First**
   - Go to Vercel Dashboard → Your Project → Functions → Logs
   - Filter by: `/api/auth/callback/google`
   - Look for `[OAuth]` messages
   - Identify which step fails

2. **Verify Environment Variables**
   - Go to Vercel → Settings → Environment Variables
   - Check all required variables are set
   - Verify no typos

3. **Test Database Connection**
   ```bash
   # Use Vercel CLI or test locally
   vercel env pull .env.local
   psql $DATABASE_URL -c "SELECT 1"
   ```

4. **Test Google OAuth Manually**
   - Use the OAuth URL from Section 3.2
   - Replace `YOUR_CLIENT_ID` with actual ID
   - Test in browser
   - Check redirect works

5. **Check Database State**
   - Connect to database
   - Run queries from Section 9.2
   - Verify tables exist and have data

6. **Review Code Logic**
   - Check `auth.ts` signIn callback
   - Verify all error cases return `false`
   - Check retry logic works

7. **Test Locally First**
   - Set up local environment
   - Test signup/signin locally
   - If works locally but not production → env var issue

---

## 📞 **SUPPORT CHECKLIST**

Before asking for help, provide:
- [ ] Vercel function logs (last 50 lines)
- [ ] Environment variables status (without values)
- [ ] Database connection test results
- [ ] Google OAuth Console screenshot (redirect URIs)
- [ ] Error message from browser console
- [ ] Steps to reproduce

---

## ✅ **FINAL VERIFICATION**

Once all items are checked:
1. [ ] Test signup with new email
2. [ ] Test login with existing user
3. [ ] Test Google OAuth signup
4. [ ] Test Google OAuth login
5. [ ] Verify session persists after page refresh
6. [ ] Check database has correct records
7. [ ] Verify no errors in Vercel logs

---

**Last Updated:** 2025-01-25
**Version:** 1.0
