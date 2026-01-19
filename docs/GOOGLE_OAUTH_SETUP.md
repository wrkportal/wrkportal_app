# Google OAuth Setup for Vercel

## Authorized JavaScript Origins

When setting up Google OAuth in Google Cloud Console, add these URLs:

### For Production (Vercel):

```
https://your-app.vercel.app
```

**Example:**
```
https://wrkportal-xxxxx.vercel.app
```

### For Development (Local):

```
http://localhost:3000
```

---

## Authorized Redirect URIs

Add these redirect URIs:

### For Production (Vercel):

```
https://your-app.vercel.app/api/auth/callback/google
```

**Example:**
```
https://wrkportal-xxxxx.vercel.app/api/auth/callback/google
```

### For Development (Local):

```
http://localhost:3000/api/auth/callback/google
```

---

## Complete Setup Steps

### Step 1: Create OAuth Credentials in Google Cloud Console

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com
   - Sign in with your Google account

2. **Create or Select Project:**
   - Create new project: "WorkPortal" (or select existing)

3. **Enable Google+ API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Configure OAuth Consent Screen:**
   - Go to "APIs & Services" → "OAuth consent screen"
   - User Type: **External** (unless you have Google Workspace)
   - App name: **WorkPortal** (or your app name)
   - User support email: `wrkportal26@gmail.com`
   - Developer contact: `wrkportal26@gmail.com`
   - Click "Save and Continue"
   - Scopes: Click "Add or Remove Scopes"
     - Select: `email`, `profile`, `openid`
   - Click "Save and Continue"
   - Test users: Add your email if in testing mode
   - Click "Save and Continue"

5. **Create OAuth 2.0 Client ID:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: **Web application**
   - Name: **WorkPortal Web Client**

6. **Add Authorized JavaScript Origins:**
   ```
   http://localhost:3000
   https://your-app.vercel.app
   ```
   **Replace `your-app.vercel.app` with your actual Vercel URL after deployment**

7. **Add Authorized Redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-app.vercel.app/api/auth/callback/google
   ```
   **Replace `your-app.vercel.app` with your actual Vercel URL after deployment**

8. **Click "Create"**
   - Copy the **Client ID**
   - Copy the **Client Secret**

---

### Step 2: Add to Vercel Environment Variables

Add these in Vercel → Settings → Environment Variables:

```
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

---

## Important Notes

1. **Update After Deployment:**
   - After first Vercel deployment, get your actual URL
   - Go back to Google Cloud Console
   - Add your production URL to "Authorized JavaScript Origins"
   - Add your production callback URL to "Authorized Redirect URIs"

2. **For Testing:**
   - You can add `http://localhost:3000` for local development
   - Keep both local and production URLs

3. **Multiple Environments:**
   - If you have Preview deployments, add those URLs too:
   ```
   https://wrkportal-git-main-wrkportal.vercel.app
   https://wrkportal-xxxxx.vercel.app
   ```

---

## Quick Reference

### Authorized JavaScript Origins:
```
http://localhost:3000
https://your-app.vercel.app
```

### Authorized Redirect URIs:
```
http://localhost:3000/api/auth/callback/google
https://your-app.vercel.app/api/auth/callback/google
```

---

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- **Problem**: Redirect URI doesn't match
- **Solution**: 
  - Check the exact URL in Vercel (including `https://`)
  - Make sure it ends with `/api/auth/callback/google`
  - Add it to Google Cloud Console → Credentials → OAuth 2.0 Client ID

### "Error 403: access_denied"
- **Problem**: OAuth consent screen not configured
- **Solution**: Complete OAuth consent screen setup in Google Cloud Console

---

**Add both localhost and your Vercel URL (after deployment) to Authorized JavaScript Origins!** 🔐
