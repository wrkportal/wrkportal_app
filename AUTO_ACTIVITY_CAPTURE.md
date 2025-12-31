# Automatic Activity Capture

This document explains how activities are automatically captured in the sales system to reduce manual logging by sales reps.

## Overview

The system automatically creates activities for common sales actions, eliminating the need for sales reps to manually log every interaction. This saves time and ensures complete activity tracking.

## How It Works

Activities are automatically captured through the `AutoActivityCapture` class (`lib/sales/auto-activity-capture.ts`) which hooks into key sales events.

## Automatic Activity Types

### 1. **Opportunity Stage Changes**
- **When**: An opportunity's stage is updated
- **Activity Type**: NOTE
- **Details**: Records the old and new stage with a descriptive message
- **Example**: "Opportunity moved from Prospecting to Qualification"

### 2. **Order Creation**
- **When**: A new sales order is created
- **Activity Type**: NOTE
- **Details**: Records order number, name, and total amount
- **Example**: "Order ORD-123456 created - $50K order"

### 3. **Account Creation**
- **When**: A new account is added to the system
- **Activity Type**: NOTE
- **Details**: Records the account name
- **Example**: "New account created: Acme Corporation"

### 4. **Contact Creation**
- **When**: A new contact is added to the system
- **Activity Type**: NOTE
- **Details**: Records the contact's name and account
- **Example**: "New contact created: John Doe"

### 5. **Quote Sent** (via Automation Rules)
- **When**: A quote status changes to "SENT"
- **Activity Type**: EMAIL
- **Details**: Records quote number and details
- **Example**: "Quote QTE-123456 sent to customer"

### 6. **Quote Accepted** (via Automation Rules)
- **When**: A quote status changes to "ACCEPTED"
- **Activity Type**: NOTE
- **Details**: Records quote acceptance
- **Example**: "Quote QTE-123456 accepted by customer"

### 7. **Lead Conversion**
- **When**: A lead is converted to an opportunity
- **Activity Type**: NOTE
- **Details**: Records lead and opportunity details
- **Example**: "Lead converted to opportunity: New Deal"

## Additional Automatic Capture Methods

### Calendar Integration
- **Meetings**: Synced from Google Calendar or Outlook
- **Details**: Automatically creates MEETING activities from calendar events
- **Location**: `/api/sales/integrations/calendar`

### Email Integration
- **Emails**: Captured from email-to-lead integration
- **Details**: Creates EMAIL activities when emails are processed
- **Location**: `/api/sales/integrations/email-to-lead`

### Event Integration
- **Event Registrations**: Captured from external event systems
- **Details**: Creates EVENT activities for registrations
- **Location**: `/api/sales/integrations/events`

## Manual Activity Logging

While many activities are captured automatically, sales reps can still manually log activities for:
- **Calls**: Phone conversations that need detailed notes
- **Custom Notes**: Important details not captured automatically
- **Tasks**: Follow-up items and reminders
- **Custom Events**: Special interactions not covered by automation

## Benefits

1. **Time Savings**: Reduces manual data entry by ~70-80%
2. **Complete Tracking**: Ensures all key events are recorded
3. **Accurate Timestamps**: Activities are timestamped automatically
4. **Better Reporting**: More complete activity data for analytics
5. **Compliance**: Automatic audit trail of all sales activities

## Configuration

Automatic activity capture is enabled by default. No configuration is required. All captured activities:
- Are linked to the appropriate records (opportunity, account, contact, etc.)
- Are assigned to the relevant sales rep
- Include timestamps and context
- Can be viewed in the Activities page

## Future Enhancements

Potential future automatic capture methods:
- **Email Tracking**: Automatic capture when emails are sent via CRM
- **Call Logging**: Integration with phone systems for automatic call logging
- **Document Views**: Track when quotes/contracts are viewed
- **Website Activity**: Track prospect website visits
- **Social Media**: Capture LinkedIn interactions

