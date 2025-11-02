# ⚠️ DATABASE MIGRATION REQUIRED

## Data Retention Feature - Migration Steps

Before you can use the new Data Retention feature, you **MUST** run a database migration.

### 🚨 IMPORTANT: Run These Commands

```bash
# 1. Stop your development server
# Press Ctrl+C in the terminal where npm run dev is running

# 2. Generate the updated Prisma Client
npx prisma generate

# 3. Create and apply the migration
npx prisma migrate dev --name add_data_retention

# 4. Restart your development server
npm run dev
```

### What This Migration Does

Adds 4 new fields to the `Tenant` table:
- `auditLogRetentionDays` (default: 2555 = 7 years)
- `taskRetentionDays` (default: 1825 = 5 years)
- `notificationRetentionDays` (default: 90 days)
- `projectRetentionDays` (default: 1825 = 5 years)

### After Migration

1. Go to **Admin → Audit Log**
2. Scroll to "Data Retention Settings"
3. Click "Configure" to customize retention periods
4. Click "Save Settings"
5. Use "Run Cleanup Now" to manually clean old data

### Troubleshooting

**If migration fails:**
```bash
# Check Prisma status
npx prisma migrate status

# If needed, reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Then run migration again
npx prisma migrate dev --name add_data_retention
```

**If you see "Unknown field" errors:**
- Make sure you ran `npx prisma generate`
- Restart your development server
- Clear Next.js cache: `rm -rf .next`

### Need Help?

Check `DATA_RETENTION_IMPLEMENTATION.md` for complete documentation.

