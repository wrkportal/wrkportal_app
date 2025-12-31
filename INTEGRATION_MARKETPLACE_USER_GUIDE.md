# Integration Marketplace - User Access Guide

## 🎯 How to Access the Marketplace

### **Step 1: Navigate to Integrations Page**

**Path:** Admin → Integrations

1. Log in to your account
2. Click on **"Admin"** in the sidebar (left navigation)
3. Click on **"Integrations"** under the Admin section

**Direct URL:** `/admin/integrations`

**Required Role:**
- `ORG_ADMIN` (Organization Admin)
- `TENANT_SUPER_ADMIN` (Tenant Super Admin)
- `PLATFORM_OWNER` (Platform Owner)

---

### **Step 2: Switch to Marketplace Tab**

Once on the Integrations page, you'll see **two tabs**:

1. **"My Integrations"** - View and manage your connected integrations
2. **"Marketplace"** - Browse and install integration templates

**Click on the "Marketplace" tab** to access the integration templates.

---

## 📋 Complete User Journey

### **Accessing the Marketplace:**

```
Login → Sidebar → Admin → Integrations → Marketplace Tab
```

### **Visual Navigation Path:**

```
┌─────────────────────────────────────────┐
│  Sidebar                                 │
│  ├── Home                                │
│  ├── Projects                            │
│  ├── ...                                 │
│  └── Admin ▼                             │
│      ├── Organization                    │
│      ├── Permissions                     │
│      ├── Data Governance                 │
│      ├── Integrations  ← Click here      │
│      └── Audit Log                       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Integrations Page                      │
│                                         │
│  [My Integrations] [Marketplace] ← Tab  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Integration Marketplace        │   │
│  │                                 │   │
│  │  [Search...] [Category ▼]      │   │
│  │                                 │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐    │   │
│  │  │Temp 1│ │Temp 2│ │Temp 3│    │   │
│  │  └──────┘ └──────┘ └──────┘    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 🔍 Marketplace Features

### **1. Browse Templates**

Once in the Marketplace tab, you'll see:

- **Grid View** of integration templates
- Each template card shows:
  - Integration type icon (Salesforce, HubSpot, etc.)
  - Template name
  - Description
  - Rating (stars)
  - Install count
  - Category badge
  - Featured badge (if applicable)

### **2. Search Templates**

**Search Bar:**
- Located at the top of the marketplace
- Search by:
  - Template name
  - Description keywords
  - Integration type
  - Tags

**Example searches:**
- "Salesforce" - Find all Salesforce templates
- "CRM" - Find CRM-related templates
- "contacts" - Find templates that sync contacts

### **3. Filter by Category**

**Category Dropdown:**
- **All Categories** - Show all templates
- **CRM** - Customer relationship management
- **Marketing** - Marketing automation
- **Finance** - Financial integrations
- **Analytics** - Data analytics
- **Support** - Customer support
- **Project Management** - Project tools

### **4. View Template Details**

**Click "Details" button** on any template card to see:
- Full description
- Configuration details
- Field mappings
- Sync schedule
- User reviews and ratings
- Installation count

---

## 🚀 Installing a Template

### **Step-by-Step Installation:**

1. **Browse Marketplace**
   - Go to Admin → Integrations → Marketplace tab
   - Find the template you want (use search/filters if needed)

2. **Click "Install" Button**
   - Click the **"Install"** button on the template card
   - A new integration will be created automatically

3. **Configure OAuth**
   - Switch to **"My Integrations"** tab
   - Find your newly installed integration
   - Click **"Connect"** button
   - Enter OAuth credentials:
     - Client ID
     - Client Secret
     - Redirect URI (optional)

4. **Complete OAuth Flow**
   - Click **"Connect"** button
   - You'll be redirected to the external service
   - Authorize the integration
   - You'll be redirected back
   - Integration status changes to "Active"

5. **Start Syncing**
   - Once connected, click **"Sync"** button
   - Data will start syncing based on template configuration

---

## 📊 Marketplace UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  Integration Marketplace                                 │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  [🔍 Search templates...] [Category ▼] [Refresh]│  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ [S]       │  │ [H]       │  │ [Q]       │          │
│  │ Salesforce│  │ HubSpot   │  │ QuickBooks│          │
│  │ Contacts  │  │ Marketing │  │ Financial │          │
│  │           │  │           │  │           │          │
│  │ ⭐ 4.5    │  │ ⭐ 4.8    │  │ ⭐ 4.2    │          │
│  │ 120 installs│ │ 89 installs│ │ 45 installs│          │
│  │ [CRM]     │  │ [Marketing]│ │ [Finance] │          │
│  │           │  │           │  │           │          │
│  │ [Install] │  │ [Install] │  │ [Install] │          │
│  │ [Details] │  │ [Details] │  │ [Details] │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ [G]       │  │ [Z]       │  │ [J]       │          │
│  │ Google    │  │ Zendesk   │  │ Jira      │          │
│  │ Analytics │  │ Support   │  │ Issues    │          │
│  │ ...       │  │ ...       │  │ ...       │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Access Summary

| Action | Location | Steps |
|--------|----------|-------|
| **Access Marketplace** | Sidebar → Admin → Integrations → Marketplace tab | 3 clicks |
| **Search Templates** | Marketplace tab → Search bar | Type and search |
| **Filter by Category** | Marketplace tab → Category dropdown | Select category |
| **Install Template** | Marketplace tab → Template card → Install button | 1 click |
| **Configure Integration** | My Integrations tab → Integration → Connect | Enter OAuth details |
| **View Details** | Marketplace tab → Template card → Details button | See full info |

---

## 🔐 Permission Requirements

**Who can access:**
- ✅ Organization Admins (`ORG_ADMIN`)
- ✅ Tenant Super Admins (`TENANT_SUPER_ADMIN`)
- ✅ Platform Owners (`PLATFORM_OWNER`)

**Who cannot access:**
- ❌ Regular users (`USER`, `PROJECT_MANAGER`, etc.)
- ❌ View-only roles

**Note:** If you don't see the "Integrations" option in the Admin menu, you don't have the required permissions. Contact your organization administrator.

---

## 💡 Tips for Using the Marketplace

1. **Start with Featured Templates**
   - Featured templates are highlighted with a star badge
   - These are popular and well-tested

2. **Check Ratings**
   - Templates with higher ratings (4+ stars) are more reliable
   - Read reviews for user experiences

3. **Check Install Count**
   - Higher install counts indicate proven templates
   - Popular templates are usually well-maintained

4. **Use Search Effectively**
   - Search by integration name (e.g., "Salesforce")
   - Search by use case (e.g., "contacts", "invoices")
   - Search by category keywords

5. **Read Template Details**
   - Click "Details" to see full configuration
   - Understand what data will be synced
   - Check sync schedule

---

## 🆘 Troubleshooting

### **"I don't see the Integrations option"**
- **Solution:** You need admin permissions. Contact your organization admin.

### **"Marketplace tab is empty"**
- **Solution:** Templates need to be initialized. Contact your platform admin to run:
  ```
  GET /api/integrations/marketplace?init=true
  ```

### **"Install button doesn't work"**
- **Solution:** Check browser console for errors. Ensure you have proper permissions.

### **"Template installed but not showing"**
- **Solution:** Switch to "My Integrations" tab to see installed integrations.

---

## 📞 Support

If you need help accessing or using the marketplace:
1. Check your user role and permissions
2. Contact your organization administrator
3. Review the integration documentation
4. Check the template details for specific requirements

---

**Quick Access:** `/admin/integrations` → Click "Marketplace" tab

