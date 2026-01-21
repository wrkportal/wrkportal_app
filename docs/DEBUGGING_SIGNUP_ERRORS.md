# How to Debug Signup Errors

When you encounter signup errors, here's where to check and what to look for:

## 1. Browser Console (Most Important) 🔍

**How to access:**
- Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
- Press `Cmd+Option+I` (Mac)
- Right-click → Inspect → Console tab

**What to look for:**
- Red error messages
- Error messages starting with "Error:" or "Failed:"
- Network request failures

**Example errors you might see:**
```
Error: Failed to create account
Error: User with this email already exists
Error: Password must be at least 8 characters
Network error: Failed to fetch
```

## 2. Browser Network Tab 🌐

**How to access:**
- Open Developer Tools (F12)
- Click "Network" tab
- Try to sign up again
- Look for the request to `/api/auth/signup`

**What to check:**
1. Find the request to `/api/auth/signup`
2. Click on it to see details
3. Check the "Response" tab to see what the server returned
4. Check the "Preview" tab for formatted JSON response

**Example response you might see:**
```json
{
  "error": "User with this email already exists"
}
```

**Status codes:**
- `200` or `201` = Success
- `400` = Bad request (validation error)
- `500` = Server error
- `403` = Forbidden (e.g., domain not allowed)

## 3. Vercel Logs (For Production) 📊

**How to access:**
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Click "Deployments"
4. Click on the latest deployment
5. Click "Functions" tab
6. Look for errors in the logs

**What to look for:**
- Error messages from your API routes
- Database connection errors
- Missing environment variables

## 4. Common Signup Errors & Solutions

### Error: "User with this email already exists"
**Solution:** The email is already registered. Try logging in instead or use a different email.

### Error: "Password must be at least 8 characters"
**Solution:** Your password is too short. Use at least 8 characters.

### Error: "An error occurred during signup"
**Solution:** This is a generic error. Check:
1. Browser console for details
2. Network tab for API response
3. Vercel logs for server-side errors
4. Database connection (if you can access it)

### Error: "Failed to create or find tenant"
**Solution:** Database issue. Check:
1. Database connection string is correct
2. Database is accessible
3. Prisma schema is synced

### Error: "Missing credentials"
**Solution:** Required fields are missing. Make sure all fields are filled.

### Error: "Email service is not configured"
**Solution:** Missing SMTP environment variables. Check Vercel environment variables:
- `SMTP_USER`
- `SMTP_PASS`

## 5. Quick Debugging Steps 🚀

1. **Check Browser Console First** (Easiest)
   - F12 → Console tab
   - Look for red errors

2. **Check Network Tab** (Most Detailed)
   - F12 → Network tab
   - Find `/api/auth/signup` request
   - Check Response/Preview tabs

3. **Check Error Message on Page**
   - The signup page shows errors in red
   - Read the exact error message shown

4. **Check Vercel Logs** (For Production)
   - Vercel Dashboard → Deployments → Functions → Logs

5. **Test with Different Email**
   - Try a different email to rule out duplicate email issues

## 6. What to Share When Reporting Errors

If you need help fixing an error, share:

1. **The exact error message** (from browser console or page)
2. **Network response** (from Network tab → Response)
3. **Status code** (from Network tab → Status column)
4. **Steps to reproduce** (what you did before the error)
5. **Environment** (local development or production/Vercel)

## 7. Testing Locally

If errors occur in production, test locally:

```bash
# Make sure environment variables are set in .env.local
# Check that database is accessible
npm run dev
```

Then check:
- Browser console (localhost:3000)
- Terminal output (for server-side errors)

## 8. Common Fixes

### Fix: Database Connection Error
- Check `DATABASE_URL` in environment variables
- Verify database is running
- Check Prisma schema is synced

### Fix: Missing Environment Variables
- Check all required env vars are set in Vercel
- Restart deployment after adding env vars

### Fix: Email Service Error
- Check `SMTP_USER` and `SMTP_PASS` are set
- Verify email service credentials are correct
- Note: Signup will still work, but verification email won't send

---

**TL;DR:** Press F12 → Check Console tab first, then Network tab → Find `/api/auth/signup` → Check Response tab for details.
