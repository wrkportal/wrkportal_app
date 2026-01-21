# Google OAuth Redirect URI Mismatch - Debugging Guide

## Error Message
```
Error 400: redirect_uri_mismatch
Access blocked: This app's request is invalid
```

## How NextAuth Constructs the Redirect URI

NextAuth automatically constructs the redirect URI using this formula:
```
{NEXTAUTH_URL}/api/auth/callback/google
```

**Example:**
- If `NEXTAUTH_URL=https://www.wrkportal.com`
- Then redirect URI = `https://www.wrkportal.com/api/auth/callback/google`

## Step-by-Step Fix

### Step 1: Verify NEXTAUTH_URL in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Find `NEXTAUTH_URL` and verify it's set to:
   ```
   https://www.wrkportal.com
   ```
   **OR** (if you're using non-www):
   ```
   https://wrkportal.com
   ```

4. **Important**: 
   - Must start with `https://` (not `http://`)
   - Must NOT have a trailing slash
   - Must match your actual domain

### Step 2: Verify Google Console Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, you MUST have EXACTLY:

   ```
   https://www.wrkportal.com/api/auth/callback/google
   https://wrkportal.com/api/auth/callback/google
   ```

   **Important**:
   - Include BOTH `www` and non-`www` versions
   - Use `https://` (not `http://`)
   - Include the full path: `/api/auth/callback/google`
   - NO trailing slashes
   - Case-sensitive - must match exactly

### Step 3: Verify JavaScript Origins

Under **Authorized JavaScript origins**, you MUST have:

```
https://www.wrkportal.com
https://wrkportal.com
```

**Important**:
- Base domain only (NO paths)
- Include BOTH `www` and non-`www` versions
- Use `https://` (not `http://`)
- NO trailing slashes

### Step 4: Check What Redirect URI is Actually Being Sent

To see what redirect URI NextAuth is sending, check the browser's Network tab:

1. Open Browser DevTools (F12)
2. Go to **Network** tab
3. Try to sign in with Google
4. Look for a request to `accounts.google.com/o/oauth2/v2/auth`
5. In the **Request URL**, find the `redirect_uri` parameter
6. It should show something like:
   ```
   redirect_uri=https%3A%2F%2Fwww.wrkportal.com%2Fapi%2Fauth%2Fcallback%2Fgoogle
   ```
   (URL-encoded version of `https://www.wrkportal.com/api/auth/callback/google`)

7. **Compare this EXACT value** with what's in Google Console

### Step 5: Common Mismatches

#### Mismatch 1: Missing `www`
- **Sent**: `https://wrkportal.com/api/auth/callback/google`
- **In Console**: `https://www.wrkportal.com/api/auth/callback/google`
- **Fix**: Add BOTH versions to Google Console

#### Mismatch 2: Wrong Protocol
- **Sent**: `https://www.wrkportal.com/api/auth/callback/google`
- **In Console**: `http://www.wrkportal.com/api/auth/callback/google`
- **Fix**: Use `https://` in Google Console

#### Mismatch 3: Trailing Slash
- **Sent**: `https://www.wrkportal.com/api/auth/callback/google`
- **In Console**: `https://www.wrkportal.com/api/auth/callback/google/`
- **Fix**: Remove trailing slash from Google Console

#### Mismatch 4: Wrong Path
- **Sent**: `https://www.wrkportal.com/api/auth/callback/google`
- **In Console**: `https://www.wrkportal.com/auth/callback/google`
- **Fix**: Must be `/api/auth/callback/google`

#### Mismatch 5: NEXTAUTH_URL Not Set
- **Sent**: `http://localhost:3000/api/auth/callback/google` (default)
- **In Console**: `https://www.wrkportal.com/api/auth/callback/google`
- **Fix**: Set `NEXTAUTH_URL` in Vercel

## Quick Verification Checklist

- [ ] `NEXTAUTH_URL` is set in Vercel to `https://www.wrkportal.com`
- [ ] Google Console has `https://www.wrkportal.com/api/auth/callback/google`
- [ ] Google Console has `https://wrkportal.com/api/auth/callback/google` (if using both)
- [ ] Google Console has `https://www.wrkportal.com` in JavaScript Origins
- [ ] Google Console has `https://wrkportal.com` in JavaScript Origins (if using both)
- [ ] No trailing slashes anywhere
- [ ] All URLs use `https://` (not `http://`)
- [ ] Saved changes in Google Console
- [ ] Waited 1-2 minutes after saving

## After Making Changes

1. **Save changes in Google Console**
2. **Wait 1-2 minutes** for changes to propagate
3. **Clear browser cache** or use incognito/private window
4. **Try again**

## Still Not Working?

### Option 1: Check Vercel Build Logs

1. Go to Vercel dashboard
2. Check recent deployments
3. Look for any errors related to `NEXTAUTH_URL`

### Option 2: Test with Different Browser

Sometimes browser cache can cause issues. Try:
- Incognito/Private window
- Different browser
- Clear cookies for `www.wrkportal.com`

### Option 3: Verify Environment Variables

In Vercel, make sure these are set:
- `NEXTAUTH_URL` = `https://www.wrkportal.com`
- `GOOGLE_CLIENT_ID` = Your actual Client ID
- `GOOGLE_CLIENT_SECRET` = Your actual Client Secret (not masked)

### Option 4: Check OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Make sure:
   - App is **Published** OR test users are added
   - App name matches
   - Authorized domains include `wrkportal.com`

## Debugging Script

To see what NextAuth is actually using, you can temporarily add this to your signup page:

```typescript
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
console.log('Window location:', window.location.origin)
```

**Note**: This only works in development. In production, check Vercel environment variables.

---

**The redirect URI MUST match EXACTLY between what NextAuth sends and what's in Google Console. Even a small difference (like `www` vs non-`www`) will cause this error.**
