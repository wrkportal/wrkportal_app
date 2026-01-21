# Email Configuration Setup Guide

## Why Email Configuration is Critical

Without email configuration, users **cannot**:
- ✅ Verify their email addresses after signup
- ✅ Reset forgotten passwords
- ✅ Receive important notifications
- ✅ Get system alerts

## Step-by-Step Setup

### Step 1: Get Gmail App Password

Since you're using `wrkportal26@gmail.com`, follow these steps:

1. **Go to Google Account Settings:**
   - Visit: https://myaccount.google.com
   - Sign in with `wrkportal26@gmail.com`

2. **Enable 2-Step Verification (Required for App Passwords):**
   - Go to: https://myaccount.google.com/security
   - Scroll to "How you sign in to Google"
   - Click "2-Step Verification"
   - Follow the setup process (if not already enabled)
   - You'll need your phone for verification

3. **Generate App Password:**
   - After 2-Step Verification is enabled, go to: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords
   - Select app: "Mail"
   - Select device: "Other (Custom name)"
   - Enter name: "wrkportal Vercel"
   - Click "Generate"

4. **Copy the App Password:**
   - You'll see a 16-character password (no spaces)
   - Example: `abcd efgh ijkl mnop` → Use: `abcdefghijklmnop`
   - **Important:** Copy it immediately - you won't see it again!

### Step 2: Add Environment Variables to Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your `wrkportal` project

2. **Navigate to Environment Variables:**
   - Click "Settings" tab
   - Click "Environment Variables" in left sidebar

3. **Add Each Variable:**

   **Variable 1: EMAIL_HOST**
   - Key: `EMAIL_HOST`
   - Value: `smtp.gmail.com`
   - Environment: Select "Production", "Preview", and "Development" (or "All Environments")

   **Variable 2: EMAIL_PORT**
   - Key: `EMAIL_PORT`
   - Value: `587`
   - Environment: All Environments

   **Variable 3: EMAIL_SECURE**
   - Key: `EMAIL_SECURE`
   - Value: `false`
   - Environment: All Environments

   **Variable 4: EMAIL_USER**
   - Key: `EMAIL_USER`
   - Value: `wrkportal26@gmail.com`
   - Environment: All Environments

   **Variable 5: EMAIL_PASSWORD**
   - Key: `EMAIL_PASSWORD`
   - Value: `your-16-character-app-password` (paste the app password from Step 1)
   - Environment: All Environments
   - **Important:** No spaces, just the 16 characters

   **Variable 6: EMAIL_FROM**
   - Key: `EMAIL_FROM`
   - Value: `noreply@wrkportal.com` (or `wrkportal26@gmail.com`)
   - Environment: All Environments

4. **Save Each Variable:**
   - Click "Save" after adding each one
   - Verify all 6 variables are listed

### Step 3: Verify Configuration

After adding all variables:

1. **Redeploy Your App:**
   - Go to "Deployments" tab
   - Click the "..." menu on latest deployment
   - Click "Redeploy"
   - Or push a new commit to trigger auto-deploy

2. **Test Email Functionality:**
   - Try signing up a new user
   - Check if verification email is received
   - Try password reset flow

### Step 4: Test Locally (Optional)

If you want to test email locally:

1. **Add to `.env.local` file:**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=wrkportal26@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   EMAIL_FROM=noreply@wrkportal.com
   ```

2. **Restart dev server:**
   ```bash
   npm run dev
   ```

## Troubleshooting

### "Invalid login" or "Authentication failed"
- ✅ Verify App Password is correct (no spaces)
- ✅ Ensure 2-Step Verification is enabled
- ✅ Check EMAIL_USER matches your Gmail address exactly

### "Connection timeout"
- ✅ Check EMAIL_HOST is `smtp.gmail.com`
- ✅ Verify EMAIL_PORT is `587`
- ✅ Ensure EMAIL_SECURE is `false` (not `true`)

### Emails not sending
- ✅ Check Vercel function logs for errors
- ✅ Verify all 6 variables are set in Vercel
- ✅ Ensure you redeployed after adding variables
- ✅ Check spam folder

### "Less secure app access" error
- ✅ This shouldn't happen with App Passwords
- ✅ Make sure you're using App Password, not regular password
- ✅ Re-generate App Password if needed

## Alternative Email Providers

If you prefer not to use Gmail, you can use:

### SendGrid (Recommended for Production)
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@wrkportal.com
```

### Mailgun
```
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-username
EMAIL_PASSWORD=your-mailgun-password
EMAIL_FROM=noreply@wrkportal.com
```

### AWS SES
```
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-ses-smtp-username
EMAIL_PASSWORD=your-ses-smtp-password
EMAIL_FROM=noreply@wrkportal.com
```

## Security Notes

⚠️ **Important:**
- Never commit `.env` files to Git
- App Passwords are safer than regular passwords
- Use different App Passwords for dev/staging/production
- Rotate App Passwords periodically

## Quick Checklist

- [ ] 2-Step Verification enabled on Google Account
- [ ] App Password generated
- [ ] EMAIL_HOST added to Vercel
- [ ] EMAIL_PORT added to Vercel
- [ ] EMAIL_SECURE added to Vercel
- [ ] EMAIL_USER added to Vercel
- [ ] EMAIL_PASSWORD added to Vercel (App Password)
- [ ] EMAIL_FROM added to Vercel
- [ ] App redeployed
- [ ] Test email sent successfully

---

**Need Help?** Check Vercel deployment logs if emails aren't working.
