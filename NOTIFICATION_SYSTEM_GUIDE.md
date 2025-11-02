# 🔔 Notification System - Complete Implementation Guide

## ✅ What Has Been Implemented

### 1. **Database Schema** ✅
- Added `Notification` model to Prisma schema
- Added `NotificationType` enum (MENTION, ASSIGNMENT, APPROVAL, DEADLINE, STATUS_CHANGE, COMMENT, MESSAGE, TASK_COMPLETED, PROJECT_UPDATE, OVERDUE_TASK)
- Added `NotificationPriority` enum (LOW, MEDIUM, HIGH, URGENT)
- Added relations to User and Tenant models
- Added database indexes for performance

### 2. **Helper Functions** ✅ (`lib/notifications.ts`)
- `createNotification()` - Create a single notification
- `createManyNotifications()` - Bulk create notifications
- `notifyTaskAssignment()` - Notify when task is assigned
- `notifyMention()` - Notify when user is mentioned
- `notifyApprovalNeeded()` - Notify when approval is needed
- `notifyDeadline()` - Notify when deadline is approaching
- `notifyOverdue()` - Notify when task is overdue
- `notifyStatusChange()` - Notify when status changes
- `notifyComment()` - Notify when someone comments
- `notifyProjectUpdate()` - Notify team about project updates

### 3. **API Routes** ✅
- `GET /api/notifications` - Fetch user's notifications (with filters)
- `GET /api/notifications/count` - Get unread count
- `PATCH /api/notifications/[id]` - Mark as read
- `DELETE /api/notifications/[id]` - Delete notification
- `POST /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/clear-all` - Clear all read notifications

### 4. **UI Integration** ✅
- Updated notifications page to fetch and display real data
- Integrated mark as read, delete, and filter functionality
- Updated header bell icon to show real unread count
- Auto-refreshes count every 30 seconds

---

## 📋 Next Steps - To Make It Fully Functional

### **STEP 1: Run Database Migration** ⚠️ **REQUIRED**

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_notifications
```

### **STEP 2: Add Notification Triggers** 

You need to integrate the notification helper functions throughout your application. Here are the key places:

#### **A. Task Assignment** (`app/api/tasks/route.ts` or wherever tasks are created/assigned)

```typescript
import { notifyTaskAssignment } from '@/lib/notifications'

// After creating/updating a task with an assignee
if (task.assigneeId && task.assigneeId !== previousAssigneeId) {
  await notifyTaskAssignment({
    userId: task.assigneeId,
    tenantId: task.tenantId,
    taskId: task.id,
    taskTitle: task.title,
    assignedBy: session.user.id,
  })
}
```

#### **B. Comments with Mentions** (`app/api/tasks/[id]/comments/route.ts` or similar)

```typescript
import { notifyMention, notifyComment } from '@/lib/notifications'

// After creating a comment
// 1. Notify task owner/assignee
if (task.assigneeId && task.assigneeId !== session.user.id) {
  await notifyComment({
    userId: task.assigneeId,
    tenantId: task.tenantId,
    taskId: task.id,
    taskTitle: task.title,
    commenterName: `${session.user.firstName} ${session.user.lastName}`,
  })
}

// 2. Parse comment for mentions (@username) and notify
const mentions = comment.content.match(/@(\w+)/g)
if (mentions) {
  for (const mention of mentions) {
    const username = mention.substring(1)
    // Find user by username/email
    const mentionedUser = await prisma.user.findFirst({
      where: { email: { contains: username } }
    })
    if (mentionedUser) {
      await notifyMention({
        userId: mentionedUser.id,
        tenantId: task.tenantId,
        mentionedBy: session.user.id,
        mentionedByName: `${session.user.firstName} ${session.user.lastName}`,
        entityType: 'TASK',
        entityId: task.id,
        entityTitle: task.title,
      })
    }
  }
}
```

#### **C. Approvals** (`app/api/approvals/route.ts`)

```typescript
import { notifyApprovalNeeded } from '@/lib/notifications'

// After creating an approval request
for (const approver of approval.approvers) {
  await notifyApprovalNeeded({
    userId: approver.userId,
    tenantId: approval.tenantId,
    approvalType: approval.type,
    approvalTitle: approval.title,
    entityId: approval.id,
  })
}
```

#### **D. Deadline Reminders** (Create a cron job or background task)

```typescript
import { notifyDeadline, notifyOverdue } from '@/lib/notifications'

// Run daily to check for upcoming deadlines
const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)

const tasksDueTomorrow = await prisma.task.findMany({
  where: {
    dueDate: {
      gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
      lt: new Date(tomorrow.setHours(23, 59, 59, 999)),
    },
    status: { not: 'DONE' },
  },
})

for (const task of tasksDueTomorrow) {
  if (task.assigneeId) {
    await notifyDeadline({
      userId: task.assigneeId,
      tenantId: task.tenantId,
      taskId: task.id,
      taskTitle: task.title,
      dueDate: task.dueDate,
    })
  }
}

// Check for overdue tasks
const overdueTasks = await prisma.task.findMany({
  where: {
    dueDate: { lt: new Date() },
    status: { not: 'DONE' },
  },
})

for (const task of overdueTasks) {
  if (task.assigneeId) {
    await notifyOverdue({
      userId: task.assigneeId,
      tenantId: task.tenantId,
      taskId: task.id,
      taskTitle: task.title,
    })
  }
}
```

#### **E. Status Changes** (Whenever task/project status is updated)

```typescript
import { notifyStatusChange } from '@/lib/notifications'

// After updating status
if (task.assigneeId) {
  await notifyStatusChange({
    userId: task.assigneeId,
    tenantId: task.tenantId,
    entityType: 'TASK',
    entityId: task.id,
    entityTitle: task.title,
    oldStatus: oldStatus,
    newStatus: task.status,
  })
}
```

#### **F. Project Updates** (When project details change)

```typescript
import { notifyProjectUpdate } from '@/lib/notifications'

// Get all team members
const teamMembers = await prisma.projectMember.findMany({
  where: { projectId: project.id },
  select: { userId: true },
})

const userIds = teamMembers.map(m => m.userId)

await notifyProjectUpdate({
  userIds,
  tenantId: project.tenantId,
  projectId: project.id,
  projectName: project.name,
  updateType: 'Status changed to In Progress',
})
```

---

## 🎯 Testing the System

### **1. Create Test Notifications**

You can create test notifications manually via API or directly in the database:

```typescript
// In any API route or component
import { createNotification } from '@/lib/notifications'

await createNotification({
  userId: 'user-id-here',
  tenantId: 'tenant-id-here',
  type: 'MESSAGE',
  title: 'Test Notification',
  message: 'This is a test notification',
  priority: 'HIGH',
})
```

### **2. Check the UI**

1. Visit `/notifications` page
2. Check the bell icon in the header - it should show the unread count
3. Click notifications to mark as read
4. Delete notifications
5. Filter by type (All, Unread, Mentions, Approvals)

---

## 🚀 Advanced Features (Optional)

### **1. Real-Time Updates with WebSockets**

For instant notifications without refreshing, you could integrate:
- Socket.io
- Server-Sent Events (SSE)
- WebSocket

### **2. Email Notifications**

Integrate with email service (SendGrid, Mailgun, etc.) to send emails for high-priority notifications.

### **3. Push Notifications**

Use Web Push API for browser notifications.

### **4. Notification Preferences**

Allow users to customize which notifications they want to receive.

---

## 📝 Summary

✅ **Completed:**
- Database schema
- API routes
- Helper functions
- UI integration
- Real-time count updates

⚠️ **Next Steps:**
1. Run database migration
2. Add notification triggers throughout your app
3. (Optional) Add cron job for deadline reminders
4. Test the system

**The notification system is ready to use!** Just run the migration and start adding triggers where needed. 🎉

