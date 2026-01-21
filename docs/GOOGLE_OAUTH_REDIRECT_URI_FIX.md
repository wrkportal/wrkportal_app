# Google OAuth Redirect URI Mismatch - Fix Guide

## Error Message
```
Error 400: redirect_uri_mismatch
Access blocked: This app's request is invalid
```

## Root Cause
The redirect URI in your Google Cloud Console doesn't match what NextAuth is sending.

## NextAuth Redirect URI Format

NextAuth automatically uses this redirect URI:
```
https://www.wrkportal.com/api/auth/callback/google
```

Or if using root domain:
```
https://wrkportal.com/api/auth/callback/google
```

## Fix Steps

### Step 1: Check Your Current Domain
Your app is live at: `https://www.wrkportal.com`

### Step 2: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID

#### A. Authorized JavaScript Origins

Under **Authorized JavaScript origins**, add these EXACT URLs (base domain only, NO paths):

```
https://www.wrkportal.com
https://wrkportal.com
```

**Important for JavaScript Origins**:
- ✅ Use base domain only (no paths like `/api/auth`)
- ✅ Include `https://` protocol
- ✅ Include BOTH `www` and non-`www` versions if you use both
- ❌ NO trailing slashes
- ❌ NO paths (just the domain)

**If you're still testing locally**, you can also add:
```
http://localhost:3000
```

#### B. Authorized Redirect URIs

Under **Authorized redirect URIs**, add these EXACT URLs:

```
https://www.wrkportal.com/api/auth/callback/google
https://wrkportal.com/api/auth/callback/google
```

**Important**: 
- Include BOTH `www` and non-`www` versions
- Use `https://` (not `http://`)
- Include the full path: `/api/auth/callback/google`
- No trailing slashes

### Step 3: Check NEXTAUTH_URL in Vercel

In Vercel Environment Variables, set:
```
NEXTAUTH_URL=https://www.wrkportal.com
```

Or if you want to support both:
```
NEXTAUTH_URL=https://www.wrkportal.com
```

### Step 4: Verify Environment Variables

Make sure these are set in Vercel:
- `GOOGLE_CLIENT_ID` - Your OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Your OAuth Client Secret
- `NEXTAUTH_URL` - `https://www.wrkportal.com` (or your domain)

### Step 5: Test

1. Save changes in Google Cloud Console
2. Wait 1-2 minutes for changes to propagate
3. Try signing in with Google again

## Common Mistakes

❌ **Wrong**: `https://www.wrkportal.com/landing/api/auth/callback/google`
✅ **Correct**: `https://www.wrkportal.com/api/auth/callback/google`

❌ **Wrong**: `http://www.wrkportal.com/api/auth/callback/google` (missing https)
✅ **Correct**: `https://www.wrkportal.com/api/auth/callback/google`

❌ **Wrong**: `https://www.wrkportal.com/api/auth/callback/google/` (trailing slash)
✅ **Correct**: `https://www.wrkportal.com/api/auth/callback/google`

## If Still Not Working

1. **Check OAuth Consent Screen**:
   - Make sure app is published OR test users are added
   - Verify app name matches

2. **Check Client ID/Secret**:
   - Verify `GOOGLE_CLIENT_ID` matches the Client ID in Google Console
   - Verify `GOOGLE_CLIENT_SECRET` is correct (not masked)

3. **Check Domain**:
   - Make sure you're using the exact domain from Vercel
   - Check if you have both `www` and non-`www` configured

4. **Clear Browser Cache**:
   - Sometimes cached OAuth tokens cause issues
   - Try incognito/private window

## Quick Checklist

- [ ] Added `https://www.wrkportal.com/api/auth/callback/google` to Authorized redirect URIs
- [ ] Added `https://wrkportal.com/api/auth/callback/google` to Authorized redirect URIs (if using both)
- [ ] Set `NEXTAUTH_URL=https://www.wrkportal.com` in Vercel
- [ ] Verified `GOOGLE_CLIENT_ID` is correct in Vercel
- [ ] Verified `GOOGLE_CLIENT_SECRET` is correct in Vercel
- [ ] Waited 1-2 minutes after saving changes
- [ ] Tried signing in again

---

**The redirect URI MUST match exactly what NextAuth sends. NextAuth always uses `/api/auth/callback/google` as the callback path.**
