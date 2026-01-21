# Next Steps After Email Setup ✅

## ✅ Completed: Email Configuration

Great! Your email is now configured. Users can now:
- Verify their email addresses
- Reset passwords
- Receive notifications

---

## 🔴 Priority 1: Update NEXTAUTH_URL (Critical - Do This Now)

Your `NEXTAUTH_URL` is currently set to `http://localhost:3000`, which won't work in production.

### Steps:

1. **Find Your Vercel URL:**
   - Go to Vercel Dashboard → Your Project
   - Look at the top - you'll see your deployment URL
   - Example: `https://wrkportal.vercel.app` or `https://wrkportal-app.vercel.app`

2. **Update in Vercel:**
   - Go to Settings → Environment Variables
   - Find `NEXTAUTH_URL`
   - Update value to: `https://your-actual-vercel-url.vercel.app`
   - Make sure to include `https://` and no trailing slash
   - Save

3. **Redeploy:**
   - Go to Deployments tab
   - Click "..." → Redeploy

**Why this is critical:** Without the correct URL, authentication callbacks won't work, and users won't be able to log in properly.

---

## 🟡 Priority 2: Test Email Functionality

Before moving on, verify emails are working:

1. **Test Signup:**
   - Create a test account
   - Check if verification email arrives
   - Verify the email link works

2. **Test Password Reset:**
   - Try "Forgot Password"
   - Check if reset email arrives
   - Verify reset link works

3. **Check Spam Folder:**
   - Initial emails might go to spam
   - Mark as "Not Spam" if needed

---

## 🟢 Priority 3: Google OAuth (Optional but Recommended)

Allows users to sign in with Google (better UX).

### Quick Setup:

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com
   - Create/Select project

2. **Enable Google+ API:**
   - APIs & Services → Library
   - Search "Google+ API"
   - Enable it

3. **Create OAuth Credentials:**
   - APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URI: `https://your-app.vercel.app/api/auth/callback/google`
   - Copy Client ID and Client Secret

4. **Add to Vercel:**
   - `GOOGLE_CLIENT_ID` = your-client-id
   - `GOOGLE_CLIENT_SECRET` = your-client-secret
   - Redeploy

**Full guide:** See `docs/GOOGLE_OAUTH_SETUP.md` (if it exists)

---

## 🟢 Priority 4: Google Search Console (For SEO)

Make your app discoverable on Google.

### Quick Setup:

1. **Go to Google Search Console:**
   - https://search.google.com/search-console

2. **Add Property:**
   - Enter your Vercel URL
   - Verify ownership (HTML file method is easiest)

3. **Submit Sitemap:**
   - Once verified, submit: `https://your-app.vercel.app/sitemap.xml`

**Full guide:** See `docs/SEO_GOOGLE_SEARCH_SETUP.md`

---

## 🟢 Priority 5: Stripe Payments (When Ready)

If you want users to subscribe to paid plans.

### Quick Setup:

1. **Sign up for Stripe:**
   - https://stripe.com
   - Get test API keys

2. **Add to Vercel:**
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`

3. **Run Database Migration:**
   ```bash
   npx prisma migrate dev --name add_subscription_fields
   ```

**Full guide:** See `docs/STRIPE_SETUP_INSTRUCTIONS.md`

---

## 📋 Current Status Checklist

- [x] Email configuration
- [ ] Update NEXTAUTH_URL with actual Vercel URL
- [ ] Test email functionality
- [ ] Google OAuth (optional)
- [ ] Google Search Console (optional)
- [ ] Stripe payments (when ready)

---

## 🎯 Recommended Order

1. **Now:** Update NEXTAUTH_URL (5 minutes)
2. **Now:** Test email (5 minutes)
3. **This week:** Google OAuth (30 minutes)
4. **This week:** Google Search Console (1 hour)
5. **When ready:** Stripe payments (4-6 hours)

---

## Need Help?

- Check Vercel deployment logs for errors
- Verify environment variables are set correctly
- Test each feature after setup
