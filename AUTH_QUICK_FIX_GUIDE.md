# Quick Fix Guide: Access Denied Issues

## 🚨 Immediate Actions

### 1. Check Debug Endpoint
Visit: `https://www.wrkportal.com/api/auth/debug`

This will show you:
- Which environment variables are missing
- Database connection status
- Which tables exist
- Expected Google OAuth redirect URI

### 2. Most Common Issues & Fixes

#### Issue: Missing AUTH_SECRET
**Symptom:** Sessions don't persist, users get logged out immediately

**Fix:**
```bash
# Generate a secret
openssl rand -base64 32

# Add to Vercel:
# Settings → Environment Variables → Add:
# AUTH_SECRET = <generated-secret>
# Redeploy after adding
```

#### Issue: Wrong NEXTAUTH_URL
**Symptom:** OAuth callbacks fail, redirects go to wrong URL

**Fix:**
```
# In Vercel Environment Variables:
NEXTAUTH_URL = https://www.wrkportal.com
# NO trailing slash!
# Must match your actual domain
```

#### Issue: Google OAuth Redirect URI Mismatch
**Symptom:** "redirect_uri_mismatch" error

**Fix:**
1. Go to: Google Cloud Console → APIs & Services → Credentials
2. Click your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add:
   ```
   https://www.wrkportal.com/api/auth/callback/google
   ```
4. **Must match exactly** (case-sensitive, no trailing slash)
5. Save and wait 5 minutes for propagation

#### Issue: Database Connection Failed
**Symptom:** "AccessDenied" with P1001 or P1017 errors in logs

**Fix:**
1. Check DATABASE_URL in Vercel
2. Test connection:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```
3. If using Supabase:
   - Use connection pooling URL (port 6543)
   - Add Vercel IPs to allowed IPs
4. If using AWS RDS:
   - Check security group allows Vercel IPs
   - Verify SSL is enabled

#### Issue: User Creation Fails (P2002)
**Symptom:** Duplicate entry error

**Fix:**
1. Check if user already exists:
   ```sql
   SELECT * FROM "User" WHERE email = 'test@example.com';
   ```
2. If exists, user should login instead of signup
3. If not exists, check for race condition in code

#### Issue: Tables Don't Exist (P2021)
**Symptom:** "Table does not exist" error

**Fix:**
```bash
# Run migrations
npx prisma migrate deploy

# Or if using Vercel, add to build:
# package.json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma migrate deploy && next build"
  }
}
```

### 3. Step-by-Step Verification

#### Step 1: Environment Variables
```bash
# Check in Vercel Dashboard:
✅ AUTH_SECRET (32+ characters)
✅ NEXTAUTH_URL (https://www.wrkportal.com)
✅ GOOGLE_CLIENT_ID (ends with .apps.googleusercontent.com)
✅ GOOGLE_CLIENT_SECRET (long string)
✅ DATABASE_URL (postgresql://...)
```

#### Step 2: Google OAuth Setup
```
✅ OAuth consent screen is published
✅ Redirect URI: https://www.wrkportal.com/api/auth/callback/google
✅ Scopes: email, profile, openid
✅ Client ID and Secret match in Vercel
```

#### Step 3: Database
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check tables exist
psql $DATABASE_URL -c "\dt"

# Should see: User, Tenant, Account, Session, VerificationToken
```

#### Step 4: Test Flow
1. Go to `/signup`
2. Try email/password signup
3. Check Vercel logs for errors
4. Try Google OAuth
5. Check browser console for errors

### 4. Debugging Commands

#### Check Vercel Logs
```bash
# Install Vercel CLI
npm i -g vercel

# View logs
vercel logs --follow

# Filter for auth errors
vercel logs | grep -i "oauth\|auth\|error"
```

#### Test Database Locally
```bash
# Pull env vars from Vercel
vercel env pull .env.local

# Test connection
npx prisma db pull

# Check schema
npx prisma studio
```

#### Test OAuth Manually
```
https://accounts.google.com/o/oauth2/v2/auth?
client_id=YOUR_CLIENT_ID&
redirect_uri=https://www.wrkportal.com/api/auth/callback/google&
response_type=code&
scope=email profile openid&
access_type=offline&
prompt=select_account
```

### 5. Emergency Rollback

If nothing works, check:
1. **Recent deployments** - Did it work before?
2. **Recent code changes** - What changed?
3. **Environment variable changes** - Were any updated?
4. **Database migrations** - Were any run recently?

### 6. Contact Support Checklist

Before asking for help, provide:
- [ ] Output from `/api/auth/debug`
- [ ] Vercel function logs (last 100 lines)
- [ ] Browser console errors
- [ ] Steps to reproduce
- [ ] When it last worked
- [ ] What changed since then

---

## 🔍 Understanding the Error

### "AccessDenied" means:
The `signIn` callback in `auth.ts` returned `false`

### Why it returns false:
1. Database connection failed
2. User creation failed
3. Tenant creation failed
4. Email missing from OAuth profile
5. Any unhandled error in the callback

### How to find the real error:
1. Check Vercel function logs
2. Look for `[OAuth]` prefixed messages
3. Find the step that failed (STEP 1, 2, 3, or 4)
4. Check the error code (P1001, P2002, etc.)

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ `/api/auth/debug` shows all checks passing
- ✅ Signup creates user in database
- ✅ Login redirects to `/`
- ✅ Session cookie is set
- ✅ Google OAuth redirects back successfully
- ✅ No errors in Vercel logs

---

**Need more help?** See `AUTH_DIAGNOSTIC_CHECKLIST.md` for comprehensive troubleshooting.
