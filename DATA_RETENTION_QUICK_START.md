# Data Retention - Quick Start Guide

## ✅ What Was Built

A complete data retention system that:
- Lets admins configure how long to keep data
- Automatically identifies old data for deletion
- Provides manual cleanup with one click
- Shows statistics before deleting
- Supports compliance requirements (GDPR, SOX, HIPAA)

---

## 🚀 Quick Start (3 Steps)

### Step 1: Run Migration (Required!)
```bash
npx prisma generate
npx prisma migrate dev --name add_data_retention
npm run dev
```

### Step 2: Configure Retention
1. Go to **Admin → Audit Log**
2. Scroll to "Data Retention Settings"
3. Click **"Configure"**
4. Select retention periods:
   - Notifications: 90 days
   - Completed Tasks: 5 years
   - Archived Projects: 5 years
   - Audit Logs: 7 years
5. Click **"Save Settings"**

### Step 3: Run Cleanup (Optional)
1. Review statistics (shows what will be deleted)
2. Click **"Run Cleanup Now"**
3. Confirm action
4. View results

---

## 📊 What Gets Deleted

| Data Type | Criteria | Default Period |
|-----------|----------|----------------|
| Notifications | Read notifications older than period | 90 days |
| Tasks | Completed tasks older than period | 5 years |
| Projects | Archived projects older than period | 5 years |
| Audit Logs | (Not implemented yet) | 7 years |

**Important:** Only specific statuses are deleted. Active data is never touched!

---

## 🎯 Key Features

### **Configurable Periods**
- 30 days to Forever
- Different settings for each data type
- Per-organization settings

### **Safe Deletion**
- Only deletes completed/archived/read items
- Shows preview before deleting
- Confirmation required
- Cannot be undone

### **Statistics**
- See how many items will be deleted
- Breakdown by type
- Updates in real-time

### **Manual Control**
- Trigger cleanup anytime
- View detailed results
- Success/error messages

---

## 🔒 Security

- ✅ Only admins can configure
- ✅ Only admins can trigger cleanup
- ✅ Confirmation required
- ✅ All actions logged
- ✅ Active data protected

---

## 📁 Files Created

1. **Database**
   - `prisma/schema.prisma` - Added retention fields

2. **API Endpoints**
   - `app/api/admin/retention-settings/route.ts` - GET/PUT settings
   - `app/api/admin/retention-cleanup/route.ts` - GET stats, POST cleanup

3. **Utilities**
   - `lib/data-retention/cleanup.ts` - Cleanup logic

4. **UI**
   - `app/admin/audit/page.tsx` - Updated with retention UI

5. **Documentation**
   - `DATA_RETENTION_IMPLEMENTATION.md` - Complete guide
   - `MIGRATION_REQUIRED.md` - Migration steps
   - `DATA_RETENTION_QUICK_START.md` - This file

---

## 🎨 UI Preview

### View Mode:
```
┌─────────────────────────────────────────┐
│ Data Retention Settings    [Configure]  │
├─────────────────────────────────────────┤
│ Notifications      90 Days (3 Months)   │
│ Completed Tasks    5 Years              │
│ Archived Projects  5 Years              │
│ Audit Logs         7 Years              │
│                                          │
│ ⚠️ 152 items eligible for deletion      │
│    120 notifications, 25 tasks, 7 projects│
│                                          │
│ [Run Cleanup Now]                        │
└─────────────────────────────────────────┘
```

### Configure Mode:
```
┌─────────────────────────────────────────┐
│ Data Retention Settings    [Hide]       │
├─────────────────────────────────────────┤
│ Notifications Retention                  │
│ [90 Days (3 Months) ▼]                  │
│                                          │
│ Completed Tasks Retention                │
│ [5 Years ▼]                              │
│                                          │
│ Archived Projects Retention              │
│ [5 Years ▼]                              │
│                                          │
│ Audit Logs Retention                     │
│ [7 Years (Recommended) ▼]                │
│                                          │
│ ⚠️ Warning: Deleted data cannot be      │
│    recovered. Ensure compliance!         │
│                                          │
│ [Save Settings] [Cancel]                 │
└─────────────────────────────────────────┘
```

---

## 💡 Pro Tips

1. **Start Conservative** - Use longer periods initially
2. **Test First** - Run cleanup on test data
3. **Document Policies** - Keep records of retention decisions
4. **Review Regularly** - Adjust periods as needed
5. **Monitor Results** - Check cleanup logs

---

## 🐛 Common Issues

### "Failed to save settings"
→ Run the migration first!

### "Unknown field reportsToId"
→ Run `npx prisma generate` again

### Cleanup deleted nothing
→ Check if you have old data matching criteria

### Can't access page
→ Log in as TENANT_SUPER_ADMIN or ORG_ADMIN

---

## 📞 Need Help?

1. Check `DATA_RETENTION_IMPLEMENTATION.md` for details
2. Review `MIGRATION_REQUIRED.md` for migration help
3. Check browser console for errors
4. Verify database migration ran successfully

---

## 🎉 Success Checklist

- [ ] Migration completed
- [ ] Can access Audit Log page
- [ ] Can see retention settings
- [ ] Can configure retention periods
- [ ] Can save settings successfully
- [ ] Can see statistics
- [ ] Can run cleanup manually
- [ ] Cleanup works and shows results

**All done? Congratulations! Your data retention system is ready!** 🚀

