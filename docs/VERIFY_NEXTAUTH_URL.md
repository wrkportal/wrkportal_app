# How to Verify NEXTAUTH_URL is Set Correctly

## Quick Check in Vercel

1. Go to your Vercel project dashboard
2. Click on **Settings** → **Environment Variables**
3. Look for `NEXTAUTH_URL`
4. It should be set to: `https://www.wrkportal.com`

## If NEXTAUTH_URL is Missing or Wrong

### Step 1: Add/Update NEXTAUTH_URL

1. In Vercel, go to **Settings** → **Environment Variables**
2. If `NEXTAUTH_URL` exists, click **Edit**
3. If it doesn't exist, click **Add New**
4. Set:
   - **Key**: `NEXTAUTH_URL`
   - **Value**: `https://www.wrkportal.com`
   - **Environment**: Select **Production**, **Preview**, and **Development** (all three)
5. Click **Save**

### Step 2: Redeploy

After updating environment variables, you need to redeploy:

1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

## Verify It's Working

After redeploying, the redirect URI that NextAuth sends to Google will be:
```
https://www.wrkportal.com/api/auth/callback/google
```

Make sure this EXACT value is in Google Console under **Authorized redirect URIs**.

## Test the Redirect URI

To see what redirect URI is actually being sent:

1. Open your app in browser
2. Open DevTools (F12)
3. Go to **Network** tab
4. Try to sign in with Google
5. Look for request to `accounts.google.com`
6. Check the `redirect_uri` parameter in the URL
7. It should match what's in Google Console

---

**Important**: Environment variable changes require a redeploy to take effect!
