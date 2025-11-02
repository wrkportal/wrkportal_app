# SSO Settings Tab - Complete Explanation

## Overview
The SSO Settings tab is a **no-code admin panel** that allows IT teams and administrators to configure Single Sign-On (SSO) for their organization **without touching any code**. This enables enterprise customers to integrate their existing identity providers (like Azure AD, Okta, Google Workspace, etc.) with your platform.

## 🎯 Purpose
Instead of requiring developers to modify code for each customer's SSO setup, this admin panel allows:
- **ORG_ADMIN** and **TENANT_SUPER_ADMIN** users to configure SSO themselves
- Organizations to use their existing identity provider (IdP)
- Employees to log in using their corporate credentials
- Centralized user management through the organization's IdP

## 🔐 Access Control
**Who can access:** Only users with these roles:
- `TENANT_SUPER_ADMIN` - Full platform administrators
- `ORG_ADMIN` - Organization administrators

**Location:** Admin → SSO Settings (sidebar navigation)

---

## 📋 How It Works - Step by Step

### 1. **Initial Page Load**
When you open the SSO Settings page:
- The page fetches current SSO configuration from `/api/admin/sso-settings` (GET)
- Displays current status: Enabled/Disabled
- Shows which provider is configured (if any)
- Loads all saved configuration values

### 2. **Status Banner**
At the top, you see:
- **Green banner** if SSO is enabled with a checkmark ✅
- **Gray banner** if SSO is disabled
- Current provider badge (Azure AD, SAML, OIDC, Google Workspace)

### 3. **Configuration Form**

#### **Step 1: Enable SSO Toggle**
- Turn on the switch to enable SSO
- This reveals all configuration options

#### **Step 2: Organization Domain**
- Enter your company domain (e.g., `company.com`)
- Users will enter this domain during login to identify your organization
- **Example:** If domain is `acme.com`, users with `user@acme.com` will use SSO

#### **Step 3: Select SSO Provider**
Choose from 4 options:
1. **Microsoft Azure AD** - For Microsoft 365/Azure customers
2. **SAML 2.0** - Generic SAML provider (Okta, OneLogin, etc.)
3. **OpenID Connect (OIDC)** - Modern OAuth 2.0 based SSO
4. **Google Workspace** - For Google Workspace customers

### 4. **Provider-Specific Configuration**

The form adapts based on your provider selection:

#### **🔵 Azure AD Configuration**
You need to provide:
- **Azure AD Tenant ID**: Found in Azure Portal → Azure Active Directory → Overview
- **Application (Client) ID**: From your Azure App Registration
- **Client Secret**: Created in Azure Portal → App registrations → Certificates & secrets

**Where to get these:**
1. Go to Azure Portal (portal.azure.com)
2. Navigate to Azure Active Directory
3. Create an App Registration
4. Copy the Tenant ID, Client ID, and create a Client Secret

#### **🟣 SAML 2.0 Configuration**
You need to provide:
- **IdP SSO URL (Entry Point)**: The URL where users are redirected to authenticate
  - Example: `https://idp.company.com/saml/sso`
- **Issuer (Entity ID)**: Unique identifier for your application
  - Example: `https://yourapp.com/saml/metadata`
- **X.509 Certificate**: Public certificate from your IdP
  - Paste the full certificate including `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`

**Where to get these:**
- From your SAML IdP (Okta, OneLogin, Auth0, etc.)
- Usually found in the SAML app configuration in your IdP admin panel

#### **🟢 OIDC Configuration**
You need to provide:
- **Issuer URL**: The base URL of your OIDC provider
  - Example: `https://accounts.google.com`
- **Authorization URL**: Where users are redirected to log in
  - Example: `https://accounts.google.com/o/oauth2/v2/auth`
- **Token URL**: Where access tokens are obtained
  - Example: `https://oauth2.googleapis.com/token`
- **Client ID**: Your application's client ID
- **Client Secret**: Your application's client secret

**Where to get these:**
- From your OIDC provider's developer console
- Usually in the OAuth/OIDC application settings

#### **🔴 Google Workspace**
- Automatically configured (uses Google OAuth)
- No manual configuration needed
- Contact support for setup assistance

### 5. **Integration Info Tab**

After configuring, switch to the "Integration Info" tab to get URLs you need to provide to your IdP:

#### **Callback URL (Redirect URI)**
- **Value:** `https://yourdomain.com/api/auth/callback/sso`
- **Purpose:** Where users are sent after successful authentication
- **Action:** Copy this and add it to your IdP's allowed redirect URIs

#### **SAML Metadata URL** (SAML only)
- **Value:** `https://yourdomain.com/api/auth/saml/metadata`
- **Purpose:** Provides your IdP with your app's SAML configuration
- **Action:** Provide this URL to your IdP administrator

#### **Login URL for Users**
- **Value:** `https://yourdomain.com/login`
- **Purpose:** Where users go to log in
- **Action:** Share this with your employees

### 6. **Save Configuration**
- Click "Save Configuration" button
- The system validates all required fields
- Saves to database via `/api/admin/sso-settings` (PUT)
- Shows success/error message

### 7. **Test Connection**
- Click "Test Connection" button (only visible after saving)
- Simulates an SSO authentication attempt
- Verifies that configuration is correct
- Shows success ✅ or error message

---

## 🔄 How SSO Login Works (User Experience)

### For Users:
1. User goes to `https://yourapp.com/login`
2. Clicks "Log in with your organization SSO"
3. Enters their organization domain (e.g., `acme.com`)
4. System looks up SSO configuration for that domain
5. User is redirected to their company's IdP (Azure AD, Okta, etc.)
6. User logs in with their corporate credentials
7. IdP sends authentication response back
8. User is logged into your platform

### Behind the Scenes:
1. User enters domain → API checks `/api/auth/sso/verify`
2. System retrieves SSO config from database (Tenant table)
3. Redirects to IdP with proper SAML/OIDC parameters
4. IdP authenticates user
5. IdP sends response to callback URL
6. System validates response
7. Creates/updates user in database
8. Creates session and logs user in

---

## 💾 Database Storage

All SSO configuration is stored in the `Tenant` table:

```prisma
model Tenant {
  id          String       @id @default(cuid())
  name        String
  domain      String       @unique
  ssoEnabled  Boolean      @default(false)
  ssoProvider SSOProvider? // SAML, OIDC, AZURE_AD, GOOGLE_WORKSPACE
  ssoConfig   Json?        // Provider-specific configuration
  // ... other fields
}
```

**ssoConfig JSON structure examples:**

### Azure AD:
```json
{
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "your-secret-here"
}
```

### SAML:
```json
{
  "entryPoint": "https://idp.company.com/saml/sso",
  "issuer": "https://yourapp.com/saml/metadata",
  "cert": "-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----",
  "identifierFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
}
```

### OIDC:
```json
{
  "issuer": "https://accounts.google.com",
  "authorizationURL": "https://accounts.google.com/o/oauth2/v2/auth",
  "tokenURL": "https://oauth2.googleapis.com/token",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret"
}
```

---

## 🛡️ Security Features

1. **Role-Based Access**: Only admins can configure SSO
2. **Validation**: All fields are validated before saving
3. **Secure Storage**: Client secrets stored securely in database
4. **Test Connection**: Verify configuration before going live
5. **Audit Trail**: All changes are logged with user ID and timestamp

---

## 💰 Cost Analysis (Platform Owner)

### No Additional Costs for:
- Basic SSO functionality
- SAML/OIDC support
- User authentication
- Session management

### Potential Costs:
1. **SSL Certificates**: Required for HTTPS (usually $0-$100/year)
2. **Server Resources**: Minimal increase in compute/storage
3. **Support**: Time spent helping customers configure SSO

### Revenue Opportunity:
- Charge premium for SSO feature (common in SaaS)
- Typical pricing: $5-$20/user/month for SSO
- Or include in Enterprise tier

---

## 📚 Related Documentation

For more details, see:
- `docs/SSO_IMPLEMENTATION_GUIDE.md` - Full technical implementation
- `docs/SSO_QUICK_SUMMARY.md` - Quick overview
- `docs/SSO_CUSTOM_DOMAINS_EXPLAINED.md` - How custom domains work
- `docs/SSO_COST_ANALYSIS.md` - Detailed cost breakdown
- `docs/SSO_VISUAL_GUIDE.md` - Visual flow diagrams

---

## 🎯 Benefits

### For Your Customers (Organizations):
- ✅ Employees use existing corporate credentials
- ✅ Centralized user management
- ✅ Enhanced security (MFA, password policies)
- ✅ Single sign-on across all apps
- ✅ Automatic user provisioning/deprovisioning

### For You (Platform Owner):
- ✅ Attract enterprise customers
- ✅ Higher pricing tier
- ✅ Reduced support (no password resets)
- ✅ Better security
- ✅ Competitive advantage

### For IT Teams:
- ✅ No code changes required
- ✅ Self-service configuration
- ✅ Test before going live
- ✅ Easy to update/change
- ✅ Clear documentation

---

## 🧪 Testing Checklist

Before enabling SSO for production:

- [ ] Configure SSO settings in admin panel
- [ ] Copy callback URL to IdP
- [ ] Add test users in IdP
- [ ] Click "Test Connection" - should succeed
- [ ] Try logging in via SSO
- [ ] Verify user is created in database
- [ ] Verify user has correct role
- [ ] Test with multiple users
- [ ] Test error cases (wrong domain, invalid credentials)
- [ ] Document setup for your team

---

## 🐛 Troubleshooting

### "Failed to save SSO configuration"
- Check all required fields are filled
- Verify you have admin permissions
- Check browser console for errors

### "SSO connection test failed"
- Verify IdP URLs are correct
- Check certificate format (SAML)
- Ensure callback URL is added to IdP
- Check client ID/secret are correct

### "User can't log in via SSO"
- Verify SSO is enabled
- Check domain matches user's email
- Ensure user exists in IdP
- Check IdP logs for errors
- Verify callback URL is accessible

---

## 🚀 Future Enhancements

Potential improvements:
- [ ] SCIM support for automatic user provisioning
- [ ] Multiple SSO providers per tenant
- [ ] SSO analytics dashboard
- [ ] Automatic certificate renewal
- [ ] SSO login audit logs
- [ ] Just-in-time (JIT) user provisioning
- [ ] Group/role mapping from IdP

