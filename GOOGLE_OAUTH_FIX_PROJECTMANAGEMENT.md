# 🔧 Fix: Google OAuth Shows "projectmanagement" Instead of "wrkportal.com"

## Problem
When users sign in with Google, they see **"Sign in to projectmanagement"** or **"Continue to projectmanagement"** instead of **"wrkportal.com"**.

## Solution
This is **NOT** a code issue. The app name is configured in **Google Cloud Console**.

## Steps to Fix

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Navigate to OAuth Consent Screen**
   - Left sidebar → **"APIs & Services"** → **"OAuth consent screen"**

3. **Edit the App Name**
   - Click **"Edit App"** (or **"Edit"** button)
   - Find the **"App name"** field
   - Change it from **"projectmanagement"** to:
     - **"wrkportal.com"** (recommended)
     - OR **"wrkportal"**

4. **Save Changes**
   - Click **"Save and Continue"**
   - Go through all the steps (or just click through if nothing else changed)
   - Click **"Back to Dashboard"**

5. **Wait a Few Minutes**
   - Changes usually take effect within 2-5 minutes
   - Clear your browser cache if needed

## Result
After updating, users will see:
- ✅ **"Sign in to wrkportal.com"** (or "wrkportal")
- ❌ No longer "Sign in to projectmanagement"

## Important Notes

- **Testing Mode**: If your app is in "Testing" mode, only test users will see the updated name
- **Production Mode**: For all users to see it, you may need to:
  - Complete the OAuth verification process
  - Publish your app (if it's external)
- **No Code Changes Needed**: This is purely a Google Cloud Console setting

## Verification

1. Sign out of your app
2. Try signing in with Google
3. You should now see "Sign in to wrkportal.com" instead of "projectmanagement"

---

**Note**: This change only affects what users see on Google's OAuth screen. It does not affect your application code or functionality.

