# Single Sign-On (SSO) Implementation Guide

## 📋 Overview

Single Sign-On (SSO) allows users from enterprise organizations to log in to your ProjectHub application using their organization's existing identity provider (IdP) instead of creating separate credentials.

## 🎯 Benefits

### For End Users:
- **One set of credentials** - No need to remember multiple passwords
- **Faster login** - Already authenticated with their organization
- **Better security** - Passwords managed by IT, MFA enforced centrally
- **Seamless experience** - Automatic logout when they leave the company

### For Organizations:
- **Centralized control** - Manage access from one place
- **Enhanced security** - Enforce password policies and MFA
- **Compliance** - Meet regulatory requirements
- **Audit trail** - Track all authentication events
- **Reduced support** - Fewer password reset requests

## 🔄 How SSO Works

### High-Level Flow:

```
1. User clicks "Log in with your organization SSO"
   ↓
2. User enters organization domain (e.g., "acme.com")
   ↓
3. System verifies organization has SSO configured
   ↓
4. User is redirected to organization's Identity Provider (IdP)
   (e.g., Azure AD, Okta, Google Workspace)
   ↓
5. User logs in at their organization's login page
   ↓
6. IdP authenticates user and sends back a secure token
   ↓
7. System validates the token and creates a session
   ↓
8. User is logged in to ProjectHub
```

### Detailed Technical Flow:

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   User's    │         │ ProjectHub  │         │    IdP      │
│   Browser   │         │  (Your App) │         │ (Azure AD,  │
│             │         │             │         │ Okta, etc.) │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ 1. Enter domain       │                       │
       │ "acme.com"           │                       │
       ├──────────────────────>│                       │
       │                       │                       │
       │                       │ 2. Lookup tenant      │
       │                       │    SSO config         │
       │                       │                       │
       │ 3. Redirect to IdP    │                       │
       │ with SAML request     │                       │
       │<──────────────────────┤                       │
       │                       │                       │
       │ 4. Show org login     │                       │
       ├───────────────────────┼──────────────────────>│
       │                       │                       │
       │ 5. User authenticates │                       │
       │ (username + password  │                       │
       │  + MFA if required)   │                       │
       │                       │                       │
       │ 6. SAML response      │                       │
       │    with assertions    │                       │
       │<──────────────────────┼───────────────────────┤
       │                       │                       │
       │ 7. POST SAML response │                       │
       ├──────────────────────>│                       │
       │                       │                       │
       │                       │ 8. Validate signature │
       │                       │    & extract user info│
       │                       │                       │
       │ 9. Set session cookie │                       │
       │    & redirect to app  │                       │
       │<──────────────────────┤                       │
       │                       │                       │
       │ 10. Access app        │                       │
       │    (authenticated)    │                       │
       │                       │                       │
```

## 🛠️ Supported SSO Providers

### 1. **SAML 2.0** (Most Common for Enterprise)
   - **Examples**: Azure AD, Okta, OneLogin, Auth0
   - **Best for**: Large enterprises with existing IdP
   - **Protocol**: XML-based, industry standard

### 2. **OIDC** (OpenID Connect)
   - **Examples**: Google Workspace, Auth0, Keycloak
   - **Best for**: Modern applications, simpler than SAML
   - **Protocol**: Built on OAuth 2.0, uses JWT tokens

### 3. **Azure AD** (Microsoft)
   - **Best for**: Organizations using Microsoft 365
   - **Features**: Seamless integration with Office 365

## 📊 Database Schema Requirements

Your `Tenant` table should have these fields:

```prisma
model Tenant {
  id            String   @id @default(uuid())
  name          String
  domain        String?  @unique  // e.g., "acme.com"
  
  // SSO Configuration
  ssoEnabled    Boolean  @default(false)
  ssoProvider   SSOProvider?  // SAML, OIDC, AZURE_AD
  ssoConfig     Json?    // Provider-specific configuration
  
  // ... other fields
}

enum SSOProvider {
  SAML
  OIDC
  AZURE_AD
  GOOGLE_WORKSPACE
}
```

### SSO Config JSON Structure:

#### For SAML:
```json
{
  "entryPoint": "https://idp.acme.com/saml/sso",
  "issuer": "https://yourapp.com/saml/metadata",
  "cert": "MIIDXTCCAkWgAwIBAgIJ...", // X509 certificate
  "identifierFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
  "signatureAlgorithm": "sha256",
  "attributeMapping": {
    "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    "firstName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
    "lastName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
  }
}
```

#### For OIDC:
```json
{
  "issuer": "https://accounts.google.com",
  "authorizationURL": "https://accounts.google.com/o/oauth2/v2/auth",
  "tokenURL": "https://oauth2.googleapis.com/token",
  "userInfoURL": "https://openidconnect.googleapis.com/v1/userinfo",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "scope": "openid email profile"
}
```

## 🔧 Implementation Steps

### Step 1: Update Prisma Schema

Add SSO fields to your `Tenant` model (shown above).

```bash
npx prisma migrate dev --name add_sso_fields
```

### Step 2: Install Required Packages

```bash
# For SAML
npm install passport-saml @node-saml/passport-saml

# For OIDC
npm install openid-client

# For Azure AD
npm install @azure/msal-node
```

### Step 3: Configure NextAuth.js

Update `auth.config.ts`:

```typescript
import { NextAuthConfig } from 'next-auth'
import AzureADProvider from 'next-auth/providers/azure-ad'

export const authConfig: NextAuthConfig = {
  providers: [
    // ... existing providers
    
    // Azure AD SSO
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
    
    // For multi-tenant, you'd need custom provider
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      // Verify user belongs to authorized tenant
      if (account?.provider === 'azure-ad') {
        // Check tenant authorization
        const tenant = await prisma.tenant.findFirst({
          where: {
            ssoProvider: 'AZURE_AD',
            // Match tenant from SSO
          }
        })
        
        if (!tenant?.ssoEnabled) {
          return false // Reject login
        }
      }
      
      return true
    },
    
    async jwt({ token, user, account }) {
      // Add tenant info to JWT
      if (account?.provider === 'azure-ad') {
        token.tenantId = user.tenantId
      }
      return token
    },
  }
}
```

### Step 4: Create SAML Routes (for SAML provider)

Create `app/api/auth/saml/login/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { Strategy as SamlStrategy } from '@node-saml/passport-saml'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get('tenant')
  
  if (!tenantId) {
    return new Response('Tenant ID required', { status: 400 })
  }
  
  // Get tenant's SAML configuration
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { ssoConfig: true },
  })
  
  if (!tenant?.ssoConfig) {
    return new Response('SSO not configured', { status: 404 })
  }
  
  // Initialize SAML strategy with tenant config
  const samlStrategy = new SamlStrategy({
    ...tenant.ssoConfig,
    callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/saml/callback`,
  }, (profile, done) => done(null, profile))
  
  // Generate authentication request
  const authUrl = samlStrategy.generateAuthRequest()
  
  // Redirect to IdP
  return Response.redirect(authUrl)
}
```

### Step 5: Admin UI for SSO Setup

Organizations need a UI to configure SSO. Create `app/admin/sso-settings/page.tsx`:

```typescript
// This would be accessible only to TENANT_SUPER_ADMIN
// Form to configure:
// - SSO Provider (dropdown: SAML, OIDC, Azure AD)
// - Domain (acme.com)
// - IdP configuration (entry point, certificate, etc.)
// - Enable/Disable toggle
```

### Step 6: User Provisioning (Optional but Recommended)

Handle auto-provisioning of users on first SSO login:

```typescript
async function handleSSOLogin(profile: any, tenantId: string) {
  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { email: profile.email },
  })
  
  if (!user) {
    // Auto-provision user
    user = await prisma.user.create({
      data: {
        email: profile.email,
        name: `${profile.firstName} ${profile.lastName}`,
        tenantId: tenantId,
        role: 'TEAM_MEMBER', // Default role
        status: 'ACTIVE',
        // No password needed for SSO users
      },
    })
  }
  
  return user
}
```

## 🔐 Security Considerations

### 1. **Certificate Validation**
- Always validate SAML signatures
- Use proper certificate management
- Rotate certificates regularly

### 2. **Token Validation**
- Verify token signatures (JWT for OIDC)
- Check token expiration
- Validate issuer and audience

### 3. **Tenant Isolation**
- Never allow cross-tenant access
- Always validate tenantId in tokens
- Store tenant context in session

### 4. **Session Management**
- Implement proper logout (including IdP)
- Set appropriate session timeouts
- Support Single Logout (SLO) for SAML

## 📝 Admin Setup Process

### For Your Customers (Enterprise Organizations):

1. **Admin accesses SSO Settings** in ProjectHub
2. **Selects SSO Provider** (e.g., Azure AD)
3. **Enters organization details**:
   - Organization domain (e.g., acme.com)
   - IdP metadata/configuration
   - X.509 certificate (for SAML)
4. **ProjectHub provides metadata** to configure in their IdP
5. **Admin tests SSO** connection
6. **Admin enables SSO** for the organization
7. **Users can now log in** using SSO

## 🧪 Testing SSO

### Manual Testing:
1. Create a test tenant with SSO enabled
2. Log out of the application
3. Click "Log in with your organization SSO"
4. Enter test domain
5. Should redirect to IdP login
6. Log in at IdP
7. Should redirect back and be authenticated

### Automated Testing:
```bash
# Test SSO verification endpoint
curl -X POST http://localhost:3000/api/auth/sso/verify \
  -H "Content-Type: application/json" \
  -d '{"identifier": "acme.com"}'
```

## 📚 Additional Resources

- **SAML**: https://docs.oasis-open.org/security/saml/Post2.0/
- **OIDC**: https://openid.net/connect/
- **NextAuth.js**: https://next-auth.js.org/
- **Azure AD**: https://docs.microsoft.com/en-us/azure/active-directory/

## 🎯 Current Status

✅ **Completed:**
- Login UI with SSO option
- SSO verification endpoint (`/api/auth/sso/verify`)
- Database schema support (requires migration)

⏳ **To Implement:**
- Prisma migration for SSO fields
- SAML/OIDC provider configuration in NextAuth
- Admin UI for SSO setup
- User auto-provisioning on first login
- Callback handlers for each provider
- Single Logout (SLO) support

## 💡 Example Usage

### User Login Flow:

1. User visits `https://yourapp.com/login`
2. Clicks **"Log in with your organization SSO"**
3. Enters `acme.com`
4. System looks up Acme Corp's tenant → finds Azure AD SSO configured
5. Redirects to `https://login.microsoftonline.com/...`
6. User logs in with `john@acme.com` + password + MFA
7. Azure AD sends back SAML assertion
8. System validates assertion → creates session
9. User lands on `https://yourapp.com/my-work` ✅

---

**Need Help?** Check the implementation code in:
- `app/(auth)/login/page.tsx` - Login UI
- `app/api/auth/sso/verify/route.ts` - SSO verification
- `auth.config.ts` - NextAuth configuration (to be updated)

