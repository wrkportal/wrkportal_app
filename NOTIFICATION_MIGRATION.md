# Database Migration Instructions

## Notification System - Schema Update

A new `Notification` model has been added to the Prisma schema with the following features:

### New Models:
- **Notification**: Stores all user notifications with type, priority, read status, and entity references

### New Enums:
- **NotificationType**: MENTION, ASSIGNMENT, APPROVAL, DEADLINE, STATUS_CHANGE, COMMENT, MESSAGE, TASK_COMPLETED, PROJECT_UPDATE, OVERDUE_TASK
- **NotificationPriority**: LOW, MEDIUM, HIGH, URGENT

### To Apply This Migration:

```bash
# Generate Prisma Client with new models
npx prisma generate

# Create and apply the migration
npx prisma migrate dev --name add_notifications

# Or if you prefer to create migration without applying:
npx prisma migrate dev --create-only --name add_notifications

# Then apply it:
npx prisma migrate deploy
```

### What's Included:
✅ Notification model with full relations to User and Tenant
✅ Indexes for performance (userId + read, tenantId, createdAt)
✅ Entity tracking (entityType, entityId) for linking to tasks, projects, etc.
✅ Priority and read status tracking
✅ Cascading deletes when user or tenant is deleted

### Next Steps After Migration:
1. ✅ Create API routes for notifications
2. ✅ Update notifications page to fetch real data
3. ✅ Add notification triggers throughout the app
4. ✅ Update header notification count

