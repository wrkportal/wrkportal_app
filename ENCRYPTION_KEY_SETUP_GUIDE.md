# Encryption Key Setup Guide

## 🔐 What is REPORTING_STUDIO_ENCRYPTION_KEY?

The `REPORTING_STUDIO_ENCRYPTION_KEY` is used to **encrypt sensitive data** stored in your database, specifically:

1. **Database Connection Passwords** - When users connect external databases (PostgreSQL, MySQL, etc.), their passwords are encrypted before storing
2. **API Keys** - OAuth tokens, API keys for SaaS integrations (Salesforce, QuickBooks, etc.)
3. **Connection Configurations** - Any sensitive connection details

### Why is it needed?

- **Security**: Passwords and API keys should NEVER be stored in plain text
- **Compliance**: Required for enterprise security standards (SOC 2, ISO 27001)
- **Data Protection**: Protects user credentials even if database is compromised

## 📝 How to Set It Up

### Step 1: Generate a Secure Key

**Option A: Using OpenSSL (Recommended)**
```bash
openssl rand -base64 32
```

**Option B: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option C: Using PowerShell (Windows)**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

This will generate a 32-byte (256-bit) key, which is what AES-256 requires.

### Step 2: Add to Your .env File

1. Open your `.env` file (or create it if it doesn't exist)
2. Add the following line:

```env
REPORTING_STUDIO_ENCRYPTION_KEY="your-generated-key-here"
```

**Example:**
```env
REPORTING_STUDIO_ENCRYPTION_KEY="xK9mP2vQ7wR4tY8uI3oP6aS1dF5gH9jK2lM4nB7vC0xZ="
```

### Step 3: Restart Your Development Server

After adding the key, restart your Next.js server:
```bash
npm run dev
```

## ⚠️ Important Security Notes

### 1. **Never Commit This Key to Git**
- The `.env` file should be in `.gitignore`
- Never share this key publicly
- Each environment (dev, staging, production) should have a **different key**

### 2. **Key Management**
- **Development**: Store in `.env` file (local only)
- **Production**: Use a secure key management service:
  - AWS Secrets Manager
  - AWS KMS (Key Management Service)
  - HashiCorp Vault
  - Azure Key Vault
  - Google Cloud Secret Manager

### 3. **Key Rotation**
- Rotate keys periodically (every 90 days recommended)
- When rotating, you'll need to re-encrypt all existing data
- Plan for key rotation in your maintenance schedule

### 4. **Backup Your Key**
- Store a secure backup of your key (encrypted, in a secure location)
- If you lose the key, **all encrypted data becomes unrecoverable**

## 🔄 How It Works

### Encryption Flow:
1. User creates a data source with database password
2. API receives the password in plain text
3. `encrypt()` function uses the key to encrypt the password
4. Encrypted password is stored in database
5. Original password is discarded

### Decryption Flow:
1. System needs to connect to the database
2. Retrieves encrypted password from database
3. `decrypt()` function uses the key to decrypt
4. Decrypted password is used for connection
5. Password is never logged or exposed

## 📋 Complete .env Example

```env
# Database
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Reporting Studio Encryption Key
REPORTING_STUDIO_ENCRYPTION_KEY="xK9mP2vQ7wR4tY8uI3oP6aS1dF5gH9jK2lM4nB7vC0xZ="

# Other variables...
```

## 🧪 Testing the Setup

After setting up the key, test it:

```typescript
// In a test file or API route
import { encrypt, decrypt } from '@/lib/reporting-studio'

const testPassword = "my-secret-password"
const encrypted = encrypt(testPassword)
const decrypted = decrypt(encrypted)

console.log("Original:", testPassword)
console.log("Encrypted:", encrypted)
console.log("Decrypted:", decrypted)
// Should match: testPassword === decrypted
```

## 🚨 Troubleshooting

### Error: "REPORTING_STUDIO_ENCRYPTION_KEY environment variable is not set"
- **Solution**: Make sure the key is in your `.env` file and you've restarted the server

### Error: "Failed to decrypt data"
- **Solution**: The key might have changed. All encrypted data was encrypted with a different key
- **Prevention**: Never change the key without a migration plan

### Can't decrypt existing data after deployment
- **Solution**: Make sure the production environment has the same key (or migrated data)

## 📚 Production Deployment

### For Vercel:
1. Go to Project Settings → Environment Variables
2. Add `REPORTING_STUDIO_ENCRYPTION_KEY` with your production key
3. Deploy

### For AWS/Docker:
1. Store key in AWS Secrets Manager or environment variables
2. Reference in your deployment configuration
3. Never hardcode in Docker images

## ✅ Checklist

- [ ] Generated a secure 32-byte key
- [ ] Added to `.env` file
- [ ] Verified `.env` is in `.gitignore`
- [ ] Restarted development server
- [ ] Tested encryption/decryption
- [ ] Documented key location (secure backup)
- [ ] Set up production key management

## 🎯 Summary

**What it does**: Encrypts sensitive data (passwords, API keys) before storing in database

**How to set it up**: 
1. Generate key: `openssl rand -base64 32`
2. Add to `.env`: `REPORTING_STUDIO_ENCRYPTION_KEY="your-key"`
3. Restart server

**Why it matters**: Protects user credentials and meets security compliance requirements

**Remember**: 
- Never commit the key to Git
- Use different keys for dev/staging/production
- Keep a secure backup
- Plan for key rotation

