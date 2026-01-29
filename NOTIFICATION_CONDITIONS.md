# Notification System - When Users Get Notifications

## Overview
The notification icon in the topbar (Bell icon) displays a count of **unread notifications** for the logged-in user. The count is fetched from `/api/notifications/count` every 30 seconds and shows unread notifications where `read: false`.

## Current Implementation Status

### ✅ **ACTIVELY CREATING NOTIFICATIONS:**

1. **Reminders Created** (`/api/reminders` - POST)
   - **Condition**: When a reminder is created
   - **Type**: `DEADLINE`
   - **Title**: `Reminder: {title}`
   - **Message**: Reminder description
   - **Entity Type**: `REMINDER`
   - **Location**: `app/api/reminders/route.ts` (line 156)

2. **Quote Expiry Warnings** (`/api/sales/quotes/expiry-check`)
   - **Condition**: When quotes are expiring within 7 days (via cron job)
   - **Type**: `DEADLINE`
   - **Title**: `Quote {quoteNumber} expiring soon`
   - **Message**: Quote will expire in X days
   - **Priority**: `HIGH` if ≤3 days, `MEDIUM` if >3 days
   - **Entity Type**: `QUOTE`
   - **Location**: `app/api/sales/quotes/expiry-check/route.ts` (line 61)
   - **Note**: Requires cron job to trigger this endpoint

### ⚠️ **NOTIFICATION FUNCTIONS AVAILABLE BUT NOT ACTIVELY CALLED:**

The following notification helper functions exist in `lib/notifications.ts` but are **NOT currently being called** in the codebase:

1. **Task Assignment** (`notifyTaskAssignment`)
   - **Should trigger**: When a user is assigned to a task
   - **Type**: `ASSIGNMENT`
   - **Priority**: `MEDIUM`
   - **Status**: ❌ Not implemented in task creation/update

2. **Mentions** (`notifyMention`)
   - **Should trigger**: When a user is mentioned (@username) in comments
   - **Type**: `MENTION`
   - **Priority**: `HIGH`
   - **Status**: ❌ Not implemented

3. **Approval Needed** (`notifyApprovalNeeded`)
   - **Should trigger**: When user needs to approve something
   - **Type**: `APPROVAL`
   - **Priority**: `HIGH`
   - **Status**: ❌ Not implemented

4. **Deadline Approaching** (`notifyDeadline`)
   - **Should trigger**: When task deadline is approaching (tomorrow or soon)
   - **Type**: `DEADLINE`
   - **Priority**: `MEDIUM`
   - **Status**: ❌ Not implemented (no cron job checking task deadlines)

5. **Overdue Tasks** (`notifyOverdue`)
   - **Should trigger**: When a task becomes overdue
   - **Type**: `OVERDUE_TASK`
   - **Priority**: `HIGH`
   - **Status**: ❌ Not implemented (no cron job checking overdue tasks)

6. **Status Changes** (`notifyStatusChange`)
   - **Should trigger**: When task/project status changes
   - **Type**: `STATUS_CHANGE`
   - **Priority**: `LOW`
   - **Status**: ❌ Not implemented

7. **Comments** (`notifyComment`)
   - **Should trigger**: When someone comments on user's task
   - **Type**: `COMMENT`
   - **Priority**: `LOW`
   - **Status**: ❌ Not implemented

8. **Project Updates** (`notifyProjectUpdate`)
   - **Should trigger**: When project is updated
   - **Type**: `PROJECT_UPDATE`
   - **Priority**: `LOW`
   - **Status**: ❌ Not implemented

## Notification Count Display

- **Location**: Topbar notification bell icon
- **API Endpoint**: `/api/notifications/count`
- **Refresh Rate**: Every 30 seconds
- **Query**: Counts notifications where `userId = currentUser.id` AND `read = false`
- **Display**: Shows red badge with count (or "9+" if count > 9)

## Notification Types Available

Based on `lib/notifications.ts`, the system supports these notification types:
- `MENTION`
- `ASSIGNMENT`
- `APPROVAL`
- `DEADLINE`
- `STATUS_CHANGE`
- `COMMENT`
- `MESSAGE`
- `TASK_COMPLETED`
- `PROJECT_UPDATE`
- `OVERDUE_TASK`

## Priority Levels

- `LOW` - Low priority notifications
- `MEDIUM` - Medium priority (default)
- `HIGH` - High priority notifications
- `URGENT` - Urgent notifications

## Current Issues

1. **Task Assignment Notifications**: Task creation in `/api/tasks/route.ts` does NOT send notifications when tasks are assigned (line 378-409 has a TODO comment)
2. **No Deadline Checking**: No cron job or scheduled task to check for approaching deadlines or overdue tasks
3. **No Mention System**: No implementation to detect @mentions in comments
4. **No Approval Notifications**: Approval system exists but doesn't create notifications
5. **Quote Expiry**: Requires manual cron job setup to trigger `/api/sales/quotes/expiry-check`

## Recommendations

To make the notification system fully functional, you need to:

1. **Add task assignment notification** in `app/api/tasks/route.ts` when `assigneeId` is set
2. **Create a cron job** to check for:
   - Approaching task deadlines
   - Overdue tasks
   - Expiring quotes (already has endpoint)
3. **Implement mention detection** in comment creation endpoints
4. **Add approval notifications** when approvals are requested
5. **Add status change notifications** when tasks/projects change status
