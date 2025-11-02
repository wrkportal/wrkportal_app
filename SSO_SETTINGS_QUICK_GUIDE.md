# SSO Settings - Quick Start Guide

## What is it?
A **no-code admin panel** where IT teams can configure Single Sign-On (SSO) without developer help.

## Who can use it?
- `TENANT_SUPER_ADMIN` - Platform administrators
- `ORG_ADMIN` - Organization administrators

## Where is it?
**Admin → SSO Settings** (in the sidebar)

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Enable SSO
Toggle the "Enable SSO" switch to ON

### Step 2: Enter Your Domain
Enter your company domain (e.g., `acme.com`)

### Step 3: Choose Provider
Select your identity provider:
- **Azure AD** - For Microsoft 365 customers
- **SAML** - For Okta, OneLogin, Auth0, etc.
- **OIDC** - For modern OAuth providers
- **Google Workspace** - For Google customers

### Step 4: Fill Configuration
Enter the required details from your IdP:

**For Azure AD:**
- Tenant ID
- Client ID
- Client Secret

**For SAML:**
- SSO URL
- Issuer
- Certificate

**For OIDC:**
- Issuer URL
- Auth URL
- Token URL
- Client ID
- Client Secret

### Step 5: Save & Test
1. Click "Save Configuration"
2. Switch to "Integration Info" tab
3. Copy the Callback URL
4. Add it to your IdP's allowed redirect URIs
5. Click "Test Connection"
6. If successful ✅, SSO is ready!

---

## 📊 Visual Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SSO Settings Page                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Status: SSO Enabled ✅                            │    │
│  │  Provider: Azure AD                                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Configuration                                      │    │
│  │  ─────────────────────────────────────────────────│    │
│  │  [x] Enable SSO                                    │    │
│  │                                                     │    │
│  │  Organization Domain: acme.com                     │    │
│  │                                                     │    │
│  │  SSO Provider: [Azure AD ▼]                        │    │
│  │                                                     │    │
│  │  ┌─ Azure AD Config ─────────────────────┐        │    │
│  │  │ Tenant ID: xxx-xxx-xxx                │        │    │
│  │  │ Client ID: xxx-xxx-xxx                │        │    │
│  │  │ Client Secret: ••••••••••             │        │    │
│  │  └───────────────────────────────────────┘        │    │
│  │                                                     │    │
│  │  [Save Configuration]  [Test Connection]          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Integration Info                                   │    │
│  │  ─────────────────────────────────────────────────│    │
│  │  Callback URL:                                      │    │
│  │  https://yourapp.com/api/auth/callback/sso  [Copy]│    │
│  │                                                     │    │
│  │  Login URL:                                         │    │
│  │  https://yourapp.com/login                   [Copy]│    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 How Users Log In

```
User Journey:
────────────

1. User → https://yourapp.com/login
2. Clicks "Log in with organization SSO"
3. Enters domain: "acme.com"
4. System looks up SSO config
5. Redirects to Azure AD / Okta / etc.
6. User logs in with corporate credentials
7. IdP sends user back to your app
8. User is logged in! ✅
```

---

## 🎯 What Gets Saved

All configuration is stored in your database:

```
Tenant Table:
─────────────
- ssoEnabled: true
- ssoProvider: "AZURE_AD"
- domain: "acme.com"
- ssoConfig: {
    "tenantId": "xxx",
    "clientId": "xxx",
    "clientSecret": "xxx"
  }
```

---

## ✅ Benefits

### For Organizations:
- Employees use existing work credentials
- No new passwords to remember
- Centralized user management
- Enhanced security (MFA, policies)

### For You (Platform):
- Attract enterprise customers
- Charge premium pricing
- Reduce support tickets
- Better security

### For IT Teams:
- No coding required
- Self-service setup
- Test before going live
- Easy to update

---

## 🛠️ Common Providers Setup

### Azure AD
1. Go to portal.azure.com
2. Azure Active Directory → App registrations
3. Create new registration
4. Copy Tenant ID, Client ID
5. Create Client Secret
6. Add redirect URI: `https://yourapp.com/api/auth/callback/sso`

### Okta (SAML)
1. Go to Okta Admin Console
2. Applications → Create App Integration
3. Choose SAML 2.0
4. Copy SSO URL and Certificate
5. Add ACS URL: `https://yourapp.com/api/auth/callback/sso`

### Google Workspace (OIDC)
1. Go to console.cloud.google.com
2. Create OAuth 2.0 Client
3. Copy Client ID and Secret
4. Add redirect URI: `https://yourapp.com/api/auth/callback/sso`

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't save config | Fill all required fields |
| Test connection fails | Check IdP URLs and credentials |
| User can't log in | Verify domain matches email |
| Redirect error | Add callback URL to IdP |

---

## 📞 Need Help?

1. Check the full guide: `SSO_SETTINGS_EXPLANATION.md`
2. Review technical docs: `docs/SSO_IMPLEMENTATION_GUIDE.md`
3. Contact support with:
   - Your provider (Azure AD, SAML, etc.)
   - Error message
   - Screenshot of configuration

---

## 🎓 Key Concepts

**SSO (Single Sign-On)**: Log in once, access multiple apps

**IdP (Identity Provider)**: Your company's authentication system (Azure AD, Okta, etc.)

**SAML**: XML-based SSO protocol (older, widely used)

**OIDC**: Modern OAuth 2.0 based SSO (newer, simpler)

**Callback URL**: Where users return after IdP authentication

**Domain**: Company domain used to identify organization (e.g., `acme.com`)

---

## 💡 Pro Tips

1. **Test with a test user first** before rolling out to everyone
2. **Keep a backup** of your configuration
3. **Document your setup** for your team
4. **Use test connection** before enabling for users
5. **Communicate with users** before switching to SSO
6. **Have a backup login method** in case SSO fails

---

## 📈 Typical Timeline

- **Setup Time**: 15-30 minutes
- **Testing**: 15 minutes
- **Rollout**: Instant (toggle switch)
- **User Training**: 5 minutes (just share login URL)

---

## 🎉 Success Checklist

- [ ] SSO configured in admin panel
- [ ] Test connection successful
- [ ] Callback URL added to IdP
- [ ] Test user can log in via SSO
- [ ] User created in database with correct role
- [ ] Documentation shared with team
- [ ] Backup login method available
- [ ] Users notified of new login method

**You're ready to go! 🚀**

