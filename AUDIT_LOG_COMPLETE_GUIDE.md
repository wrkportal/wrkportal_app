# Audit Log - Complete Guide

## Overview
The Audit Log tracks all significant actions and events in your Project Management System for security, compliance, and auditing purposes.

---

## 🔍 What You Can See in the Audit Log

### 1. **Basic Information (Every Entry)**
- **Timestamp**: When the action occurred
- **User**: Who performed the action (name and email)
- **Action Type**: What kind of action was performed
- **Entity Type**: What kind of object was affected
- **Entity Name**: Specific name/identifier of the affected object
- **IP Address**: Where the action came from
- **Browser/Client**: User agent information

---

## 📋 Actions Currently Being Tracked

### ✅ **User Management**
| Action | Description | What's Logged |
|--------|-------------|---------------|
| **User Created** | New user added to organization | User's name, email, role |
| **User Updated** | User details modified | Changes made (before/after values) |
| **User Deleted** | User removed from system | User's name and email |

**Example:**
```
Action: CREATE
Entity: USER
User: John Admin (john@company.com)
Details: Created new user "Sarah Smith (sarah@company.com)"
IP: 192.168.1.100
```

---

### ✅ **Task Management**
| Action | Description | What's Logged |
|--------|-------------|---------------|
| **Task Created** | New task created in WBS | Task title, project context |

**Example:**
```
Action: CREATE
Entity: TASK
User: Project Manager (pm@company.com)
Details: Created task "Phase 1 - Development - API Integration"
IP: 192.168.1.100
```

---

### ✅ **Authentication & Security**
| Action | Description | What's Logged |
|--------|-------------|---------------|
| **Login** | Successful user login | User ID, timestamp |
| **Login Failed** | Failed login attempt | Email attempted, IP address |
| **Logout** | User logout | User ID, timestamp |

**Example:**
```
Action: LOGIN_FAILED
Entity: USER
Details: Failed login attempt for "hacker@example.com"
IP: 203.0.113.45
Time: 2025-11-02 10:30:15
```

---

### ✅ **Configuration Changes**
| Action | Description | What's Logged |
|--------|-------------|---------------|
| **SSO Config Change** | SSO settings modified | Before/after configuration values |
| **Retention Config Change** | Data retention policies updated | New retention periods for each entity type |
| **Data Cleanup** | Manual data cleanup executed | Number of records deleted per entity type |

**Example:**
```
Action: RETENTION_CONFIG_CHANGE
Entity: RETENTION_SETTINGS
User: Admin User (admin@company.com)
Changes:
  - auditLogRetentionDays: 90 → 180
  - taskRetentionDays: 365 → 730
IP: 192.168.1.50
```

---

## 📊 Audit Log Schema

Each audit log entry contains:

```typescript
{
  id: string              // Unique log entry ID
  tenantId: string        // Organization ID
  userId: string          // Who performed the action
  action: AuditAction     // What was done
  entity: AuditEntity     // What type of object
  entityId?: string       // Specific object ID
  entityName?: string     // Human-readable name
  changes?: JSON          // Before/after values
  ipAddress?: string      // Request IP
  userAgent?: string      // Browser/client info
  metadata?: JSON         // Additional context
  createdAt: DateTime     // When it happened
}
```

---

## 🎯 Available Actions

```
✅ CREATE              - Creating new records
✅ UPDATE              - Modifying existing records
✅ DELETE              - Removing records
✅ LOGIN               - Successful authentication
✅ LOGOUT              - User logout
✅ LOGIN_FAILED        - Failed authentication attempts
✅ PERMISSION_CHANGE   - Role/permission modifications
✅ SSO_CONFIG_CHANGE   - SSO settings updates
✅ RETENTION_CONFIG_CHANGE - Data retention policy changes
✅ DATA_CLEANUP        - Manual data cleanup operations
📝 EXPORT              - Data exports (planned)
📝 IMPORT              - Data imports (planned)
```

---

## 🗂️ Trackable Entities

```
✅ USER                - User accounts
✅ PROJECT             - Projects (planned for logging)
✅ TASK                - Tasks and subtasks
📝 PROGRAM             - Programs (planned)
📝 INITIATIVE          - Strategic initiatives (planned)
📝 GOAL                - Goals and objectives (planned)
📝 OKR                 - OKRs (planned)
📝 RISK                - Risk entries (planned)
📝 ISSUE               - Issue tracking (planned)
📝 APPROVAL            - Approval workflows (planned)
📝 REPORT              - Report generation (planned)
📝 NOTIFICATION        - Notifications (planned)
📝 ORG_UNIT            - Organizational units (planned)
✅ TENANT              - Organization-level settings
✅ SSO_SETTINGS        - SSO configuration
✅ RETENTION_SETTINGS  - Data retention policies
```

Legend:
- ✅ = Currently implemented and logging
- 📝 = Schema defined, not yet logging

---

## 🔐 Security Features

1. **IP Address Tracking**: Every action records the source IP
2. **User Agent Tracking**: Browser/client information captured
3. **Immutable Records**: Audit logs cannot be edited or deleted (except via automatic retention cleanup)
4. **Tenant Isolation**: Each organization only sees their own logs
5. **Failed Login Detection**: Security team can identify suspicious activity
6. **SUPER_ADMIN Invisibility**: Super admins are hidden from regular users

---

## 🚀 How to Use the Audit Log

### Viewing Audit Logs
1. Navigate to **Admin → Audit Log**
2. View recent activities in the "Recent Activities" section
3. Export logs as CSV for compliance/reporting

### Filtering (Future Enhancement)
- Filter by user
- Filter by action type
- Filter by entity type
- Filter by date range
- Search by entity name

### Exporting
1. Click **"Export"** button
2. Downloads CSV file with all audit logs
3. Includes all fields for compliance reporting

---

## 📈 What's NOT Yet Logged (Future Enhancements)

| Area | Status |
|------|--------|
| Task Updates | 🔜 Planned |
| Task Deletions | 🔜 Planned |
| Task Assignment Changes | 🔜 Planned |
| Task Status Changes | 🔜 Planned |
| Project Creation | 🔜 Planned |
| Project Updates | 🔜 Planned |
| Project Deletions | 🔜 Planned |
| Risk Creation/Updates | 🔜 Planned |
| Issue Creation/Updates | 🔜 Planned |
| Document Uploads | 🔜 Planned |
| Report Generation | 🔜 Planned |
| Approval Requests | 🔜 Planned |
| Approval Decisions | 🔜 Planned |
| Program Creation | 🔜 Planned |
| Budget Changes | 🔜 Planned |
| Resource Allocations | 🔜 Planned |

---

## 💡 Use Cases

### 1. **Security Monitoring**
- Track failed login attempts
- Identify unauthorized access attempts
- Monitor admin actions

### 2. **Compliance & Auditing**
- Provide audit trail for regulators
- Track who changed what and when
- Export logs for compliance reports

### 3. **Troubleshooting**
- See who made changes before an issue
- Track configuration changes
- Debug user-reported problems

### 4. **User Activity Monitoring**
- See what tasks users are creating
- Monitor admin configuration changes
- Track user onboarding actions

---

## 🔧 Configuration

### Data Retention
Configure how long audit logs are kept:
- Navigate to **Admin → Audit Log → Data Retention**
- Set retention period (default: 90 days)
- Older logs are automatically cleaned up

### Manual Cleanup
- Click **"Run Cleanup Now"** to immediately delete old logs
- View statistics on what will be cleaned
- Requires admin permissions

---

## 📝 Best Practices

1. **Regular Reviews**: Check audit logs weekly for suspicious activity
2. **Export Regularly**: Download logs for long-term compliance storage
3. **Appropriate Retention**: Set retention based on regulatory requirements
4. **Monitor Failed Logins**: Set up alerts for multiple failed attempts (future)
5. **Document Changes**: Review configuration change logs during incident response

---

## 🎓 Understanding the Data

### IP Address
- Shows where the action originated
- Can identify remote vs. office access
- Useful for detecting unauthorized access

### User Agent
- Shows browser/device type
- Can identify automated scripts
- Helps debug client-side issues

### Changes JSON
- Shows before/after values
- Helps understand what actually changed
- Useful for rollback decisions

### Metadata JSON
- Additional context for specific actions
- Cleanup statistics
- Error messages (if applicable)

---

## 🛠️ Technical Details

### Performance
- Audit logging is **non-blocking**
- Failures don't break main functionality
- Logs are indexed for fast retrieval

### Storage
- PostgreSQL database
- JSON fields for flexible data
- Automatic cleanup via retention policies

### API Endpoints
```
GET  /api/admin/audit-logs        - Fetch audit logs
GET  /api/admin/audit-logs/export - Export as CSV
POST /api/admin/retention-cleanup - Trigger cleanup
GET  /api/admin/retention-settings - Get retention config
POST /api/admin/retention-settings - Update retention config
```

---

## 🎯 Current Implementation Status

✅ **Fully Implemented:**
- User creation logging
- User update logging
- Task creation logging (WBS tasks)
- SSO configuration change logging
- Retention policy change logging
- Data cleanup logging
- CSV export
- Recent activities display

📝 **Planned:**
- More granular task tracking (updates, deletions, status changes)
- Project lifecycle tracking
- Risk and issue tracking
- Approval workflow tracking
- Report generation tracking
- Document access tracking
- Real-time alerts for suspicious activity
- Advanced filtering and search

---

## 📞 Support

For questions about audit logs:
1. Check this guide first
2. Review the system documentation
3. Contact your system administrator
4. Escalate to super admin if needed

---

**Last Updated**: November 2, 2025
**Version**: 1.0
**Status**: Production

