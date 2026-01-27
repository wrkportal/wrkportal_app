# Email Troubleshooting Guide

## Issue: Invitation emails not being sent

### Current Status
- ✅ Invitation is being created successfully (POST 201 to `/api/invitations`)
- ❌ No email logs appearing in Vercel
- ❌ Recipient not receiving emails

## Step 1: Verify Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and ensure ALL of these are set:

### Required Variables:
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_SECURE=false
```

**OR** (alternative names):
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

### Important Notes:
1. **EMAIL_PASSWORD must be a Gmail App Password**, not your regular Gmail password
   - Go to: https://myaccount.google.com/apppasswords
   - Generate an app password for "Mail"
   - Use that 16-character password

2. **EMAIL_SECURE**:
   - `false` for port 587 (TLS)
   - `true` for port 465 (SSL)

3. **After adding/changing variables**, you MUST:
   - Redeploy your application OR
   - Restart the deployment

## Step 2: Check Vercel Logs After Sending Invitation

After sending an invitation, look for these log messages in Vercel:

### Success Logs (should appear):
```
[Invitation] Starting email send process: { email: '...', ... }
📧 Preparing invitation email: { to: '...', ... }
📧 Email Configuration Check: { hasHost: true, hasUser: true, ... }
✅ Invitation email sent in Xms to: [email]
[Invitation] ✅ Email sent successfully to [email]
```

### Error Logs (if email fails):
```
[Invitation] ❌ Failed to send invitation email: { error: '...', ... }
❌ Error sending email: { error: '...', code: '...', ... }
```

### If you see NO logs at all:
- The email code might not be executing
- Check if there's an error before the email code runs
- Verify the code was deployed correctly

## Step 3: Test Email Configuration

### Option A: Check Logs for Email Config
Look for this log message after sending an invitation:
```
📧 Email Configuration Check: {
  hasHost: true/false,
  hasUser: true/false,
  hasPass: true/false,
  host: 'smtp.gmail.com',
  port: '587',
  user: 'your-email@gmail.com',
  to: 'recipient@example.com'
}
```

If any of `hasHost`, `hasUser`, or `hasPass` is `false`, the corresponding environment variable is missing.

### Option B: Test with a Simple Script
Create a test API route to verify email config (temporary):

```typescript
// app/api/test-email/route.ts
import { sendInvitationEmail } from '@/lib/email'

export async function GET() {
  try {
    await sendInvitationEmail(
      'test@example.com',
      'https://www.wrkportal.com/signup?token=test',
      'Test Tenant',
      'Test User',
      'Team Member'
    )
    return Response.json({ success: true, message: 'Email sent' })
  } catch (error: any) {
    return Response.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
```

Then visit: `https://www.wrkportal.com/api/test-email` and check logs.

## Step 4: Common Issues and Solutions

### Issue 1: "Email configuration missing"
**Solution**: Add missing environment variables in Vercel

### Issue 2: "Authentication failed" or "Invalid login"
**Solution**: 
- Use Gmail App Password, not regular password
- Ensure 2-Step Verification is enabled on Gmail account

### Issue 3: "Connection timeout"
**Solution**:
- Check if port 587 is blocked by firewall
- Try port 465 with `EMAIL_SECURE=true`

### Issue 4: "Email sent" but recipient doesn't receive
**Solution**:
- Check spam/junk folder
- Verify recipient email address is correct
- Check Gmail sending limits (500 emails/day for free accounts)

## Step 5: Verify Email Was Actually Sent

Even if logs show success, verify:
1. Check recipient's spam folder
2. Check Gmail "Sent" folder (if using Gmail)
3. Check Vercel logs for actual SMTP response

## Next Steps

1. ✅ Verify all environment variables are set in Vercel
2. ✅ Redeploy application after setting variables
3. ✅ Send a test invitation
4. ✅ Check Vercel logs for email-related messages
5. ✅ Check recipient's spam folder
6. ✅ If still not working, check for error logs with details

## Debugging Commands

To see more detailed logs, the code now includes:
- `[Invitation] Starting email send process` - When email process starts
- `📧 Preparing invitation email` - When email template is being prepared
- `📧 Email Configuration Check` - Shows which env vars are set
- `✅ Invitation email sent` - Success message
- `❌ Failed to send invitation email` - Error with details

Look for these in Vercel logs after sending an invitation.
