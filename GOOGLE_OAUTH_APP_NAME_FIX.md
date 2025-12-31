# 🔧 Fix: Google OAuth Shows "projectmanagement" Instead of "wrkportal.com"

## Problem

When users sign in with Google, they see "Sign in to projectmanagement" instead of "Sign in to wrkportal.com".

## Solution

The app name shown in Google's OAuth consent screen is configured in **Google Cloud Console**, not in your code. You need to update it there.

## Steps to Fix

### 1. Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (the one with your OAuth credentials)

### 2. Navigate to OAuth Consent Screen

1. In the left sidebar, click **"APIs & Services"**
2. Click **"OAuth consent screen"**

### 3. Edit the App Name

1. Click **"Edit App"** button (or if you haven't created it yet, click **"Create"**)
2. Find the **"App name"** field
3. Change it from "projectmanagement" to:
   - `wrkportal.com` (recommended)
   - OR `wrkportal`
4. Optionally update other fields:
   - **Application home page**: `https://www.wrkportal.com` (or your domain)
   - **Privacy policy link**: Your privacy policy URL
   - **Terms of service link**: Your terms of service URL
   - **App logo**: Upload your logo (optional)
5. Scroll down and click **"Save and Continue"**

### 4. Verify Changes

1. After saving, the changes may take a few minutes to propagate
2. Try signing in with Google again
3. You should now see "Sign in to wrkportal.com" (or whatever you set)

## Important Notes

- **Changes take effect immediately** but may take a few minutes to show up
- If you're in **Testing mode**, only test users will see the updated name
- If you want all users to see it, you need to **publish your app** (requires verification for external apps)
- The app name in Google Cloud Console is **completely separate** from your code - it's purely a Google Cloud Console setting

## Current Status

✅ **Code is correct** - No changes needed in your codebase
⚠️ **Google Cloud Console needs update** - You need to change the app name there

---

## Quick Reference

**Where to update:** Google Cloud Console → APIs & Services → OAuth consent screen → Edit App → App name

**What to set:** `wrkportal.com` or `wrkportal`

**Time to take effect:** Usually immediate, but can take a few minutes

