# Google OAuth Setup Guide

This guide will help you set up Google Sign-In for your Project Management application.

## 📋 Prerequisites

- A Google account
- Access to Google Cloud Console

---

## 🚀 Step-by-Step Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "Project Management App")
5. Click **"Create"**
6. Wait for the project to be created and select it

### Step 2: Configure OAuth Consent Screen

1. In the left sidebar, go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (unless you have a Google Workspace account)
3. Click **"Create"**
4. Fill in the required fields:
   - **App name**: Your app name (e.g., "Project Management")
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **"Save and Continue"**
6. On the **Scopes** page, click **"Add or Remove Scopes"**
7. Add these scopes:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
8. Click **"Update"** then **"Save and Continue"**
9. On **Test users** page (if in testing mode), add your email
10. Click **"Save and Continue"**
11. Review and click **"Back to Dashboard"**

### Step 3: Create OAuth 2.0 Credentials

1. In the left sidebar, go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** at the top
3. Select **"OAuth client ID"**
4. Choose **"Web application"** as the application type
5. Give it a name (e.g., "Web Client")
6. Under **"Authorized JavaScript origins"**, add:
   ```
   http://localhost:3000
   ```
   (Add your production URL later, e.g., `https://yourdomain.com`)

7. Under **"Authorized redirect URIs"**, add:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
   (Add your production callback URL later, e.g., `https://yourdomain.com/api/auth/callback/google`)

8. Click **"Create"**
9. A dialog will appear with your credentials:
   - **Client ID**: Copy this (looks like: `xxxxx.apps.googleusercontent.com`)
   - **Client Secret**: Copy this (looks like: `GOCSPX-xxxxx`)
10. Click **"OK"**

### Step 4: Add Credentials to Your Project

1. Open your `.env` file in the project root
2. Add the following lines with your credentials:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

**Example:**
```bash
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx
```

3. Save the file

### Step 5: Restart Your Development Server

**Important:** Environment variables are only loaded when the server starts.

1. Stop your development server (press `Ctrl+C` in the terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

---

## ✅ Testing

1. Go to your login page: `http://localhost:3000/login`
2. Click **"Continue with Google"**
3. You should be redirected to Google's sign-in page
4. Sign in with your Google account
5. Grant permissions
6. You should be redirected back to your app and logged in!

---

## 🔒 Security Notes

- **Never commit your `.env` file** to version control
- Keep your `GOOGLE_CLIENT_SECRET` private
- For production, update the authorized origins and redirect URIs with your production domain

---

## 🌐 Production Setup

When deploying to production:

1. Go back to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add your production URLs:
   - **Authorized JavaScript origins**: `https://yourdomain.com`
   - **Authorized redirect URIs**: `https://yourdomain.com/api/auth/callback/google`
4. Update your production environment variables with the same credentials

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Cloud Console exactly matches: `http://localhost:3000/api/auth/callback/google`
- No trailing slashes
- Check for typos

### Error: "Access blocked: This app's request is invalid"
- Complete the OAuth consent screen configuration
- Add your email as a test user (if in testing mode)

### Google Sign-In button not working
- Check that environment variables are set correctly
- Restart your development server
- Check browser console for errors

### User created but no tenant/role assigned
- The `signIn` event in `auth.config.ts` handles this automatically
- Check server logs for any errors during sign-in

---

## 📚 How It Works

When a user signs in with Google:

1. They're redirected to Google's OAuth page
2. After authentication, Google redirects back to your app
3. NextAuth creates or finds the user in your database
4. The `signIn` event in `auth.config.ts`:
   - Checks if the user has a tenant
   - If not, creates a new organization (or joins existing one based on email domain)
   - Assigns role: `ORG_ADMIN` (if new org) or `TEAM_MEMBER` (if joining existing)
5. User is logged in and redirected to `/my-work`

---

## 🎉 You're Done!

Your Google Sign-In should now be fully functional. Users can sign up and log in using their Google accounts!

