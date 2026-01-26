# How to Run the allowedSections Migration

## Option 1: Using Browser Console (Easiest)

1. Go to https://www.wrkportal.com and **log in as an admin user** (ORG_ADMIN or PLATFORM_OWNER role)
2. Open browser Developer Tools (F12)
3. Go to the Console tab
4. Paste and run this code:

```javascript
fetch('/api/migrate/allowed-sections', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include' // Important: includes cookies/session
})
  .then(res => res.json())
  .then(data => {
    console.log('Migration result:', data);
    if (data.success) {
      alert('✅ Migration completed successfully!');
    } else {
      alert('❌ Migration failed: ' + (data.error || data.message));
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('❌ Error running migration: ' + error.message);
  });
```

## Option 2: Using curl (Command Line)

```bash
# First, get your session cookie from browser:
# 1. Log in to www.wrkportal.com
# 2. Open DevTools > Application > Cookies
# 3. Copy the value of the 'authjs.session-token' cookie

curl -X POST https://www.wrkportal.com/api/migrate/allowed-sections \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN_HERE" \
  -v
```

## Option 3: Using Postman or Thunder Client (VS Code Extension)

1. **URL:** `POST https://www.wrkportal.com/api/migrate/allowed-sections`
2. **Headers:**
   - `Content-Type: application/json`
3. **Authentication:**
   - Get your session cookie from browser (see Option 2)
   - Add as Cookie header: `authjs.session-token=YOUR_SESSION_TOKEN_HERE`

## Option 4: Direct SQL (If you have database access)

If you have direct access to your PostgreSQL database, you can run:

```sql
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "allowedSections" TEXT;

ALTER TABLE "TenantInvitation" 
ADD COLUMN IF NOT EXISTS "allowedSections" TEXT;
```

## Verification

After running the migration, verify it worked:

1. Check the API response - it should return `{"success": true}`
2. Or query the database:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'User' AND column_name = 'allowedSections';
   ```

## Troubleshooting

- **401 Unauthorized:** Make sure you're logged in
- **403 Forbidden:** Your user must have ORG_ADMIN or PLATFORM_OWNER role
- **500 Error:** Check server logs for details
