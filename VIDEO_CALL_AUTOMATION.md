# Video Call Activity Automation

## Overview

The system automatically detects video calls (Google Meet and Microsoft Teams) from calendar events and creates **CALL** activities instead of generic MEETING activities. This eliminates the need for sales reps to manually log video call interactions.

## How It Works

### 1. Calendar Sync
When calendars are synced (Google Calendar or Outlook Calendar), the system:
- Analyzes each calendar event
- Detects if the event contains a video call link
- Determines whether it's a Google Meet or Microsoft Teams call
- Creates the appropriate activity type

### 2. Detection Methods

#### Google Meet Detection
The system detects Google Meet calls by looking for:
- `meet.google.com` links in event description
- "Google Meet" text in description or location
- `conferenceData.entryPoints` from Google Calendar API (video entry points)

**Example:**
```
Event Title: Product Demo with Acme Corp
Description: Join Google Meet: https://meet.google.com/abc-defg-hij
Location: Google Meet
```

**Result:** Creates a **CALL** activity with:
- Type: CALL
- Subject: "Product Demo with Acme Corp"
- Location: "Google Meet"
- Description includes the meeting link

#### Microsoft Teams Detection
The system detects Teams calls by looking for:
- `teams.microsoft.com` links in event description
- "Teams Meeting" or "msteams" text
- `onlineMeeting.joinUrl` from Microsoft Graph API

**Example:**
```
Event Title: Q4 Planning Discussion
Description: Teams Meeting: https://teams.microsoft.com/l/meetup-join/...
Location: Teams Meeting
```

**Result:** Creates a **CALL** activity with:
- Type: CALL
- Subject: "Q4 Planning Discussion"
- Location: "Microsoft Teams"
- Description includes the meeting link

### 3. Activity Creation

For **video calls** (Google Meet/Teams):
- Activity Type: **CALL**
- Automatically extracts and stores the meeting link
- Links to related contacts/leads/opportunities based on attendee emails
- Marks as COMPLETED if the call time has passed

For **in-person meetings**:
- Activity Type: **MEETING** (unchanged)
- Stores physical location if available

## Examples

### Example 1: Google Meet Call
**Calendar Event:**
- Title: "Sales Call - Acme Corporation"
- Time: Tomorrow 2:00 PM - 3:00 PM
- Description: "Join: https://meet.google.com/xyz-abc-123"
- Attendees: john@acme.com, salesrep@company.com

**Automatically Creates:**
```
Activity Type: CALL
Subject: Sales Call - Acme Corporation
Status: PLANNED
Due Date: [Tomorrow 2:00 PM]
Duration: 60 minutes
Location: Google Meet
Description: Join: https://meet.google.com/xyz-abc-123
              Video Call Link: https://meet.google.com/xyz-abc-123
Related To: [Automatically linked to Contact: john@acme.com if exists]
```

### Example 2: Teams Call
**Calendar Event:**
- Title: "Product Demo"
- Time: Today 10:00 AM - 10:30 AM (already passed)
- Teams Link: https://teams.microsoft.com/l/meetup-join/...
- Attendees: jane@prospect.com

**Automatically Creates:**
```
Activity Type: CALL
Subject: Product Demo
Status: COMPLETED
Due Date: [Today 10:00 AM]
Completed Date: [Today 10:00 AM]
Duration: 30 minutes
Location: Microsoft Teams
Description: Video Call Link: https://teams.microsoft.com/l/meetup-join/...
Related To: [Automatically linked to Lead: jane@prospect.com if exists]
```

### Example 3: In-Person Meeting
**Calendar Event:**
- Title: "Office Visit"
- Time: Next week
- Location: "123 Main St, Conference Room A"
- No video link

**Automatically Creates:**
```
Activity Type: MEETING
Subject: Office Visit
Status: PLANNED
Location: 123 Main St, Conference Room A
(No video link, treated as in-person meeting)
```

## Benefits

1. **Zero Manual Entry**: Video calls are automatically captured from calendar
2. **Complete Call Log**: All video calls are tracked without manual logging
3. **Meeting Links Preserved**: Easy access to call recordings/links later
4. **Smart Linking**: Automatically connects calls to relevant contacts/leads
5. **Accurate Timestamps**: Calls are timestamped based on actual calendar times

## Setup Requirements

### Google Calendar Integration
1. Connect Google Calendar in settings
2. Grant calendar read permissions
3. Sync calendar regularly (automatic or manual)

### Outlook/Teams Integration
1. Connect Microsoft 365 account
2. Grant calendar read permissions
3. Sync calendar regularly (automatic or manual)

## Automatic Features

✅ **Detects Google Meet links** from calendar events  
✅ **Detects Microsoft Teams links** from calendar events  
✅ **Creates CALL activities** automatically  
✅ **Extracts meeting links** and stores them  
✅ **Links to contacts/leads** based on attendee emails  
✅ **Marks as completed** if call time has passed  
✅ **Preserves duration** from calendar event  

## Manual Override

Sales reps can still:
- Manually log calls that weren't in calendar
- Add notes/details to auto-created call activities
- Edit call details if needed
- Delete incorrect auto-created activities

## Future Enhancements

Potential future features:
- Integration with call recording APIs
- Automatic transcription of calls
- Call duration tracking (actual vs scheduled)
- Post-call summary generation
- Integration with call analytics

