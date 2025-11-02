# SSO with Custom Email Domains - Explained

## The Question
**"What if an organization uses custom email domains like `s20592@depservice.com`?"**

## The Answer: SSO Works Perfectly! ✅

### Why It Works

SSO **doesn't rely on email domain matching**. Instead, it works through a **trusted authentication relationship** between your app and the organization's Identity Provider (IdP).

---

## 🔄 How It Actually Works

### Traditional Email/Password Login:
```
User enters: s20592@depservice.com + password
Your app checks: Is this email in our database? Is password correct?
```

### SSO Login (The Better Way):
```
1. User clicks "SSO Login"
2. User enters: "depservice.com" OR "Department of Service" OR "tenant-id-123"
3. Your app redirects to → Department's Identity Provider (their Azure AD/Okta)
4. User logs in at THEIR system with their credentials
5. Their IdP says: "Yes, this is John Smith, employee #s20592"
6. Your app trusts their IdP and logs John in ✅
```

**Key Point**: The email address `s20592@depservice.com` comes FROM their Identity Provider. Your app trusts it because the IdP authenticated them.

---

## 🎯 Real-World Examples

### Example 1: Government Agency
**Department of Service** wants to use your app:

**Their Setup:**
- Organization Name: "Department of Service"
- Domain: `depservice.com`
- Email Format: `s20592@depservice.com` (employee IDs, not names)
- Identity Provider: Azure AD Government Cloud

**How They Configure SSO:**
1. Admin goes to your SSO Settings panel
2. Enters:
   - Organization Domain: `depservice.com`
   - SSO Provider: Azure AD
   - Azure Tenant ID: `gov-123-456-789`
   - (Other Azure AD configs)
3. Enables SSO ✅

**User Login Flow:**
1. Employee s20592 visits your login page
2. Clicks "Log in with your organization SSO"
3. Types: `depservice.com` (or they can type "Department of Service")
4. Gets redirected to Azure AD Government login
5. Logs in with: `s20592@depservice.com` + password + government MFA
6. Azure AD confirms: "This is valid employee s20592"
7. Your app creates session for s20592@depservice.com ✅

---

### Example 2: University
**MIT** wants to use your app:

**Their Setup:**
- Organization: "Massachusetts Institute of Technology"
- Domain: `mit.edu`
- Email Format: `kerb123@mit.edu` (Kerberos IDs)
- Identity Provider: MIT Touchstone (SAML)

**User Login:**
1. Student clicks SSO login
2. Types: `mit.edu`
3. Redirects to MIT Touchstone
4. Logs in with Kerberos credentials
5. MIT verifies and sends back user info
6. Logged in as `kerb123@mit.edu` ✅

---

### Example 3: Healthcare Organization
**Regional Hospital** with unique email system:

**Their Setup:**
- Organization: "Regional Hospital Network"
- Domain: `rhn-health.org`
- Email Format: `emp-45123@rhn-health.org` (employee numbers)
- Identity Provider: Okta

**User Login:**
1. Doctor clicks SSO
2. Types: `rhn-health.org` OR "Regional Hospital"
3. Redirects to Okta
4. Logs in with hospital credentials + medical-grade MFA
5. Okta confirms identity
6. Logged in as `emp-45123@rhn-health.org` ✅

---

## 🔧 Technical Details

### What Gets Stored in Your Database

When you set up SSO for "Department of Service":

```json
{
  "tenantId": "tenant-abc-123",
  "name": "Department of Service",
  "domain": "depservice.com",
  "ssoEnabled": true,
  "ssoProvider": "AZURE_AD",
  "ssoConfig": {
    "tenantId": "gov-azure-tenant-id",
    "clientId": "azure-app-client-id",
    "clientSecret": "encrypted-secret",
    "issuer": "https://login.microsoftonline.us/gov-tenant-id",
    "emailDomain": "depservice.com",
    "allowedDomains": ["depservice.com", "depservice.gov"]
  }
}
```

### User Lookup Process

When user enters "depservice.com" or "Department of Service":

```typescript
// Your SSO verify endpoint looks up the tenant:
const tenant = await prisma.tenant.findFirst({
  where: {
    OR: [
      { domain: "depservice.com" },           // ✅ Matches domain
      { name: { contains: "depservice" } },   // ✅ Matches org name
      { id: "tenant-abc-123" }               // ✅ Matches tenant ID
    ],
    ssoEnabled: true
  }
})

// Then redirects to their IdP (Azure AD, Okta, etc.)
```

---

## 🎨 Multiple Ways Users Can Log In

### Option 1: Domain
```
User enters: depservice.com
```

### Option 2: Organization Name
```
User enters: Department of Service
System searches for matching tenant name
```

### Option 3: Tenant ID (For Advanced Users)
```
User enters: tenant-abc-123
Direct tenant lookup
```

### Option 4: Pre-configured Login URL (Best UX)
```
You can give each organization a custom URL:
https://yourapp.com/login/depservice
https://yourapp.com/login/mit
https://yourapp.com/login/regional-hospital

This skips the "enter domain" step!
```

---

## 🛡️ Security: Trust Relationship

### How Trust Works

Your app trusts the organization's Identity Provider because:

1. **Mutual Agreement**: Admin configured SSO with cryptographic certificates
2. **Digital Signatures**: SAML responses are signed with private keys
3. **Token Validation**: JWT tokens are verified with shared secrets
4. **HTTPS Only**: All communication is encrypted

**Example Trust Chain:**
```
Azure AD signs SAML assertion with their private key
    ↓
Your app verifies signature with Azure's public certificate
    ↓
If signature is valid → Trust the user identity
    ↓
Create session for s20592@depservice.com
```

---

## 🎯 Benefits for Custom Email Domains

### Why Organizations with Unusual Emails LOVE SSO:

1. **No Password Sync Issues**
   - User doesn't create a password in your app
   - Everything goes through their IdP

2. **Employee Turnover**
   - When s20592 leaves: IT disables one account
   - Instantly loses access to ALL apps (including yours)

3. **Compliance**
   - Government/healthcare have strict rules
   - SSO helps them stay compliant

4. **User Experience**
   - s20592 doesn't have to remember another password
   - Already logged into their system

---

## 📋 Configuration Examples

### For Organizations with Employee ID Emails

**Admin Panel Configuration:**

```
Organization Settings:
├── Organization Name: Department of Service
├── Primary Domain: depservice.com
├── Alternate Domains: depservice.gov, dos.gov
├── SSO Provider: Azure AD Government
├── Employee Email Format: [ID]@depservice.com
└── Auto-provision users: ✅ Enabled

SSO Configuration:
├── Azure Tenant ID: xxxxx
├── Client ID: xxxxx
├── Authority: https://login.microsoftonline.us/
├── Redirect URI: https://yourapp.com/api/auth/callback/azure-ad
└── SCIM Provisioning: ✅ Enabled (auto-sync users)
```

---

## 🚀 Enhanced User Experience Ideas

### 1. Subdomain per Organization (Enterprise Feature)
```
https://depservice.yourapp.com  → Auto-detects Department of Service
https://mit.yourapp.com         → Auto-detects MIT
https://acme.yourapp.com        → Auto-detects Acme Corp

User just clicks "Login" → Automatically uses SSO!
```

### 2. Email Domain Detection
```
User enters email: s20592@depservice.com
Your app detects: @depservice.com
Auto-suggests: "Login with Department of Service SSO?" ✅
```

### 3. Organization Branding
```
When user logs in via SSO, show:
- Organization logo
- Organization colors
- "Welcome back to Department of Service ProjectHub"
```

---

## ✅ Summary

**Q: Can SSO work with custom emails like s20592@depservice.com?**

**A: YES! Perfectly!**

SSO is actually BETTER for organizations with:
- ✅ Employee ID emails (s20592@depservice.com)
- ✅ Non-standard formats (emp-12345@company.com)
- ✅ Multiple domains (company.com, company.gov, company.org)
- ✅ Government/healthcare/education with strict rules

**Why?** Because SSO authenticates through their Identity Provider, not by matching email patterns. Their IdP vouches for the user's identity, and your app trusts that relationship.

---

**Need to implement this?** See the Admin Panel design in `docs/SSO_ADMIN_PANEL_DESIGN.md`

