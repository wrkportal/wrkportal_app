# Integration Templates - Complete Explanation

## 🎯 What Are Integration Templates?

**Integration Templates** are **pre-configured blueprints** that make it easy to set up integrations without manually configuring every detail. Think of them as "recipes" for integrations.

---

## 📦 Where Do Templates Come From?

### **1. Default Templates (System-Generated)**

**Source:** Code-based initialization

**Location:** `lib/integrations/templates.ts`

**How they're created:**
- Built into the application code
- Initialized when admin runs: `/api/integrations/marketplace?init=true`
- Stored in database `IntegrationTemplate` table

**Example:**
```typescript
// In lib/integrations/templates.ts
{
  name: 'Salesforce Contacts Sync',
  description: 'Sync Salesforce contacts to your CRM...',
  integrationType: 'SALESFORCE',
  configuration: { ... },
  fieldMappings: { ... },
  syncConfig: { ... }
}
```

**Current Default Templates:**
1. Salesforce Contacts Sync
2. HubSpot Marketing Sync
3. QuickBooks Financial Sync
4. Stripe Payments Sync
5. Google Analytics Traffic Data
6. Zendesk Support Tickets
7. Jira Issues Sync
8. Mailchimp Campaign Sync

---

### **2. Admin-Created Templates**

**Source:** Platform/Organization Admins

**How they're created:**
- Admins can create custom templates via API
- Stored in the same `IntegrationTemplate` table
- Can be shared across organizations (future feature)

**Example API Call:**
```typescript
POST /api/integrations/marketplace
{
  "template": {
    "integrationType": "SALESFORCE",
    "name": "Custom Salesforce Setup",
    "description": "Our company's specific Salesforce sync",
    "category": "CRM",
    "configuration": { ... },
    "fieldMappings": { ... }
  }
}
```

---

### **3. Community Templates (Future)**

**Source:** Other users/organizations

**Potential Features:**
- Users can submit templates
- Template marketplace with user contributions
- Template sharing between organizations
- Template ratings and reviews

---

## 🔍 What's Inside a Template?

A template contains **everything needed** to set up an integration, except OAuth credentials:

### **1. Basic Information**
```typescript
{
  name: "Salesforce Contacts Sync",
  description: "Sync Salesforce contacts and accounts...",
  category: "CRM",
  integrationType: "SALESFORCE",
  tags: ["salesforce", "crm", "contacts"]
}
```

### **2. Configuration Settings**
**What data to sync and how:**
```typescript
configuration: {
  syncResources: ["Contact", "Account"],  // What to sync
  filters: {                              // Optional filters
    status: "Active"
  },
  batchSize: 100                         // How many at a time
}
```

### **3. Field Mappings**
**How to map external fields to your system:**
```typescript
fieldMappings: {
  Contact: {
    // External Field → Your System Field
    "FirstName" → "firstName",
    "LastName" → "lastName",
    "Email" → "email",
    "Phone" → "phone",
    "Account.Name" → "company"
  }
}
```

**Example:**
- Salesforce has: `FirstName`, `LastName`, `Email`
- Your system has: `firstName`, `lastName`, `email`
- Template maps: `FirstName` → `firstName`

### **4. Sync Configuration**
**When and how often to sync:**
```typescript
syncConfig: {
  direction: "pull",           // pull, push, or bidirectional
  schedule: "0 */6 * * *",     // Cron: Every 6 hours
  conflictResolution: "external_wins"  // What to do on conflicts
}
```

### **5. Documentation**
**Instructions and notes:**
```typescript
documentation: `
  This template syncs Salesforce contacts every 6 hours.
  
  Requirements:
  - Salesforce API access
  - OAuth credentials
  
  Setup:
  1. Install template
  2. Add OAuth credentials
  3. Click Connect
  4. Start syncing
`
```

---

## 📋 Real Example: Salesforce Template

Here's what a complete template looks like:

```typescript
{
  // Basic Info
  name: "Salesforce Contacts Sync",
  description: "Sync Salesforce contacts to your CRM with standard field mappings",
  category: "CRM",
  integrationType: "SALESFORCE",
  tags: ["salesforce", "crm", "contacts"],
  
  // Configuration - What to sync
  configuration: {
    syncResources: ["Contact", "Account"],
    apiVersion: "v58.0",
    batchSize: 200
  },
  
  // Field Mappings - How to map fields
  fieldMappings: {
    Contact: {
      firstName: "FirstName",      // Your field → Salesforce field
      lastName: "LastName",
      email: "Email",
      phone: "Phone",
      company: "Account.Name",    // Nested field access
      title: "Title",
      address: "MailingAddress"
    },
    Account: {
      name: "Name",
      industry: "Industry",
      website: "Website"
    }
  },
  
  // Sync Settings - When to sync
  syncConfig: {
    direction: "pull",              // Import from Salesforce
    schedule: "0 */6 * * *",        // Every 6 hours
    incremental: true,              // Only sync changes
    lastSyncField: "LastModifiedDate"
  }
}
```

---

## 🎯 What Templates Do vs. Manual Setup

### **Without Template (Manual Setup):**
1. Create integration
2. Manually configure what to sync
3. Manually map every field
4. Manually set up sync schedule
5. Test and debug
6. **Time: 30-60 minutes**

### **With Template:**
1. Browse marketplace
2. Click "Install"
3. Add OAuth credentials
4. Click "Connect"
5. **Time: 2-5 minutes**

**Templates save 90% of setup time!**

---

## 🔄 Template Lifecycle

### **1. Template Creation**
```
Code/Admin → Database (IntegrationTemplate table)
```

### **2. Template Discovery**
```
User → Marketplace Tab → Browse/Search Templates
```

### **3. Template Installation**
```
User clicks "Install" → Creates Integration from Template
```

**What happens:**
- New `Integration` record created
- Configuration copied from template
- Field mappings created
- Sync settings applied
- User still needs to add OAuth credentials

### **4. Integration Setup**
```
User → My Integrations → Add OAuth → Connect
```

### **5. Template Usage Tracking**
```
Installation tracked → Usage count updated → Rating calculated
```

---

## 📊 Template Types by Category

### **CRM Templates**
- **Salesforce Contacts Sync** - Sync contacts and accounts
- **HubSpot Marketing Sync** - Sync contacts, deals, companies
- **Custom CRM Setup** - Your specific CRM configuration

### **Finance Templates**
- **QuickBooks Financial Sync** - Invoices, customers, payments
- **Stripe Payments Sync** - Payments, customers, subscriptions
- **Accounting Data Import** - General accounting data

### **Marketing Templates**
- **HubSpot Marketing** - Marketing campaigns and contacts
- **Mailchimp Campaign Sync** - Email campaigns and subscribers
- **Marketing Automation** - Marketing platform integration

### **Analytics Templates**
- **Google Analytics Traffic** - Website traffic data
- **Analytics Dashboard** - Analytics platform sync

### **Support Templates**
- **Zendesk Support Tickets** - Support tickets and metrics
- **Customer Support Sync** - Support platform integration

### **Project Management Templates**
- **Jira Issues Sync** - Issues, projects, work items
- **Project Tracking** - Project management platform sync

---

## 🛠️ What Makes a Good Template?

### **1. Clear Purpose**
- Specific use case
- Clear description
- Appropriate category

### **2. Complete Configuration**
- All necessary settings included
- Field mappings defined
- Sync schedule recommended

### **3. Well Documented**
- Setup instructions
- Requirements listed
- Troubleshooting tips

### **4. Tested**
- Used by multiple organizations
- High ratings
- Few errors reported

---

## 💡 Example Use Cases

### **Use Case 1: Salesforce Contact Sync**
**Template provides:**
- Pre-configured to sync Contacts and Accounts
- Field mappings: FirstName → firstName, Email → email
- Syncs every 6 hours automatically
- Handles incremental updates

**User just needs to:**
- Install template
- Add Salesforce OAuth credentials
- Connect and start syncing

### **Use Case 2: QuickBooks Invoice Import**
**Template provides:**
- Pre-configured to sync Invoices, Customers, Payments
- Field mappings: DocNumber → invoiceNumber, TotalAmt → amount
- Syncs daily at 2 AM
- Handles currency conversion

**User just needs to:**
- Install template
- Add QuickBooks OAuth credentials
- Connect and invoices start importing

---

## 🔐 Template Security

**Templates contain:**
- ✅ Configuration structure
- ✅ Field mappings
- ✅ Sync schedules
- ✅ Documentation

**Templates do NOT contain:**
- ❌ OAuth credentials (user must add)
- ❌ API keys
- ❌ Secrets
- ❌ Personal data

**Security:** Templates are safe to share because they only contain structure, not credentials.

---

## 📝 Summary

**Templates are:**
- Pre-configured integration blueprints
- Stored in database (`IntegrationTemplate` table)
- Created from code (default) or by admins (custom)
- Contain configuration, mappings, and sync settings
- Make integration setup 10x faster

**Templates come from:**
1. **System defaults** - Built into code, initialized once
2. **Admin-created** - Custom templates by admins
3. **Future: Community** - User-submitted templates

**Templates contain:**
- What to sync (resources)
- How to map fields (field mappings)
- When to sync (schedule)
- Configuration settings
- Documentation

**Result:** Users can set up complex integrations in minutes instead of hours!

