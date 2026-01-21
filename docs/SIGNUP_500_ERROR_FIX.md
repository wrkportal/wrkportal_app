# Signup 500 Error - Diagnosis & Fix Guide

## Current Status
- **Error**: 500 Internal Server Error
- **Endpoint**: `/api/auth/signup`
- **Status Code**: 500

## How to Get the Exact Error Message

### Step 1: Check the Response Body
1. Open Browser DevTools (F12)
2. Go to **Network** tab
3. Find the request to `/api/auth/signup`
4. Click on it
5. Go to **Response** tab or **Preview** tab
6. **Copy the error message** you see there

The response should look like:
```json
{
  "error": "An error occurred during signup",
  "details": "...actual error message...",
  "code": "...Prisma error code..."
}
```

### Step 2: Check Vercel Logs (Production)
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Click **Deployments**
4. Click the latest deployment
5. Click **Functions** tab
6. Find `/api/auth/signup`
7. Click **View Logs**
8. Look for error messages with "❌ Signup error:"

## Common Causes & Fixes

### 1. Database Connection Error
**Error Code**: `P1001`, `P1017`
**Error Message**: "Can't reach database" or "Connection closed"

**Fix**:
- Check `DATABASE_URL` in Vercel Environment Variables
- Verify database is accessible
- Check database connection pooling settings

### 2. Missing Required Field
**Error Code**: `P2002`, `P2025`
**Error Message**: "Required field missing" or "Unique constraint failed"

**Fix**:
- Check Prisma schema matches database
- Run `npx prisma db push` to sync schema
- Verify all required fields are sent from frontend

### 3. Tenant Type Issue
**Error**: Related to `tenant.type` or `groupRole`

**Fix**:
- Verify `Tenant` model has `type` field
- Check `WorkspaceType` enum is defined
- Ensure `GroupRole` enum is defined

### 4. Verification Token Table Missing
**Error**: Related to `verificationToken.create()`

**Fix**:
- Check if `VerificationToken` model exists in Prisma schema
- Run `npx prisma generate` to regenerate Prisma client
- Run `npx prisma db push` to sync schema

### 5. Email Service Error (Non-critical)
**Note**: Email errors don't cause 500, but may show warnings

**Fix**:
- Check `SMTP_USER` and `SMTP_PASS` in Vercel
- Verify email credentials are correct

## Quick Debugging Steps

1. **Get the exact error** (Step 1 above)
2. **Check error code** in response body
3. **Check Vercel logs** for server-side details
4. **Verify environment variables** are set correctly
5. **Check Prisma schema** is synced with database

## Next Steps

**Please share**:
1. The **Response** tab content from Network tab
2. Any errors from **Vercel logs** (Functions → Logs)
3. The **error code** if present (e.g., P1001, P2002)

This will help identify the exact issue and provide a targeted fix.

---

**Updated Error Handling**: The signup route now provides more detailed error messages, including Prisma error codes and specific error types. Check the response body for exact error details.
