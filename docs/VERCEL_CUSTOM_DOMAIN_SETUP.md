# Adding Custom Domain to Vercel

## Overview

You can add your own domain (e.g., `wrkportal.com`) to your Vercel deployment instead of using `wrkportal-app.vercel.app`.

---

## Step-by-Step Guide

### Step 1: Go to Vercel Domain Settings

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select your `wrkportal` project

2. **Navigate to Domain Settings:**
   - Click **"Settings"** tab
   - Click **"Domains"** in left sidebar

---

### Step 2: Add Your Domain

1. **Click "Add" or "Add Domain" button**

2. **Enter Your Domain:**
   - Type your domain: `wrkportal.com` (or `www.wrkportal.com`)
   - Click **"Add"**

3. **Vercel will show DNS instructions:**
   - You'll see DNS records to add
   - Example:
     ```
     Type: A
     Name: @
     Value: 76.76.21.21
     
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```

---

### Step 3: Configure DNS at Your Domain Provider

You need to add DNS records at your domain registrar (where you bought the domain).

#### Common Domain Providers:

**GoDaddy:**
1. Log in to GoDaddy
2. Go to: My Products → Domains → Manage DNS
3. Add the DNS records Vercel provided
4. Save

**Namecheap:**
1. Log in to Namecheap
2. Go to: Domain List → Manage → Advanced DNS
3. Add the DNS records
4. Save

**Cloudflare:**
1. Log in to Cloudflare
2. Select your domain
3. Go to: DNS → Records
4. Add the DNS records
5. Save

**Google Domains:**
1. Log in to Google Domains
2. Go to: DNS → Custom records
3. Add the DNS records
4. Save

---

### Step 4: Wait for DNS Propagation

- DNS changes can take **5 minutes to 48 hours**
- Usually takes **15-30 minutes**
- Vercel will show status: "Validating" → "Valid Configuration"

---

### Step 5: Update Environment Variables

After your domain is connected, update:

1. **NEXTAUTH_URL:**
   - Change from: `https://wrkportal-app.vercel.app`
   - Change to: `https://yourdomain.com`
   - Or: `https://www.yourdomain.com` (if using www)

2. **Google OAuth (if configured):**
   - Go to Google Cloud Console
   - Update Authorized JavaScript origins:
     - Add: `https://yourdomain.com`
     - Add: `https://www.yourdomain.com` (if using www)
   - Update Authorized redirect URIs:
     - Add: `https://yourdomain.com/api/auth/callback/google`
     - Add: `https://www.yourdomain.com/api/auth/callback/google`

3. **Redeploy:**
   - After updating environment variables
   - Redeploy your app

---

## DNS Record Types

### Option 1: A Record (Root Domain)
```
Type: A
Name: @ (or leave blank)
Value: 76.76.21.21 (Vercel's IP - check Vercel for current IP)
```

### Option 2: CNAME (Subdomain)
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com (Vercel's CNAME)
```

### Option 3: Apex Domain (Vercel's Method)
Vercel may provide specific instructions for your domain.

---

## Common Issues

### "Domain not resolving"
- ✅ Wait longer (DNS can take up to 48 hours)
- ✅ Check DNS records are correct
- ✅ Verify records at your domain provider

### "SSL Certificate pending"
- ✅ Wait 5-10 minutes after DNS is verified
- ✅ Vercel automatically issues SSL certificates
- ✅ HTTPS will work automatically

### "Domain already in use"
- ✅ Remove domain from another Vercel project first
- ✅ Or use a different subdomain

---

## Quick Checklist

- [ ] Go to Vercel → Settings → Domains
- [ ] Add your domain
- [ ] Copy DNS records from Vercel
- [ ] Add DNS records at your domain provider
- [ ] Wait for DNS propagation (15-30 min)
- [ ] Verify domain is connected in Vercel
- [ ] Update NEXTAUTH_URL environment variable
- [ ] Update Google OAuth redirect URIs
- [ ] Redeploy app

---

## After Domain is Connected

Your app will be accessible at:
- `https://yourdomain.com`
- `https://www.yourdomain.com` (if configured)

Vercel automatically:
- ✅ Issues SSL certificate (HTTPS)
- ✅ Redirects www to non-www (or vice versa)
- ✅ Handles all routing

---

## Need Help?

- Vercel Domain Docs: https://vercel.com/docs/concepts/projects/domains
- Check Vercel dashboard for DNS status
- Contact your domain registrar if DNS issues persist
