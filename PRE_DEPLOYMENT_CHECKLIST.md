# ✅ PRE-DEPLOYMENT CHECKLIST

Use this checklist before deploying to production.

---

## 🔐 Security & Credentials

### Environment Variables

- [ ] Created `.env` file with all required variables
- [ ] `NEXTAUTH_SECRET` is strong (32+ characters)
- [ ] `DATABASE_URL` uses SSL/TLS (`?sslmode=require`)
- [ ] All secrets are unique (not default values)
- [ ] `.env` file is in `.gitignore` (not committed)
- [ ] Environment variables added to Vercel dashboard

### Database Security

- [ ] Database password is strong and unique
- [ ] Database connection uses SSL/TLS encryption
- [ ] Database backups are enabled
- [ ] Database is not publicly accessible (only allow app access)

### OAuth Configuration

- [ ] Google OAuth credentials configured
- [ ] Correct redirect URIs added (both local and production)
- [ ] OAuth consent screen configured
- [ ] Test OAuth login works locally

---

## 🗄️ Database Setup

- [ ] PostgreSQL database created (Neon.tech, Supabase, or other)
- [ ] Connection string obtained and tested
- [ ] Prisma client generated: `npx prisma generate`
- [ ] Database migrations applied: `npx prisma migrate deploy`
- [ ] Test database connection locally
- [ ] Can view database in Prisma Studio: `npx prisma studio`

---

## 🧪 Local Testing

### Basic Functionality

- [ ] App runs locally without errors: `npm run dev`
- [ ] No console errors in browser
- [ ] Can access login page: `http://localhost:3000/login`
- [ ] Can access signup page: `http://localhost:3000/signup`

### Authentication Testing

- [ ] Email/password signup works
- [ ] Email/password login works
- [ ] Google OAuth sign-in works
- [ ] Logout works
- [ ] Session persists after page refresh
- [ ] Protected routes redirect to login when not authenticated

### Core Features

- [ ] Can create a project
- [ ] Can create a task
- [ ] Can update task status
- [ ] Can view dashboard
- [ ] Can access admin panel (as admin)
- [ ] Role-based access control works

### User Experience

- [ ] All pages load without errors
- [ ] Forms submit successfully
- [ ] Validation messages appear correctly
- [ ] Loading states work
- [ ] Mobile responsive (test on phone)

---

## 🔨 Build Testing

- [ ] Production build succeeds: `npm run build`
- [ ] No build errors or warnings (critical ones)
- [ ] Can run production build locally: `npm run start`
- [ ] Production build works same as dev

---

## 📦 Code Quality

- [ ] No sensitive data hardcoded (API keys, passwords, secrets)
- [ ] No `console.log` statements in production code (or remove them)
- [ ] No commented-out code blocks
- [ ] TypeScript types are correct (no `any` where avoidable)
- [ ] All imports resolve correctly

---

## 🌐 Git & GitHub

- [ ] Git repository initialized
- [ ] `.gitignore` includes `.env`, `node_modules`, `.next`
- [ ] All changes committed
- [ ] Repository pushed to GitHub
- [ ] Repository is private (if app has sensitive info)

---

## ☁️ Vercel Configuration

### Project Setup

- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Framework preset: Next.js (auto-detected)
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Install command: `npm install`
- [ ] Node version: 18.x or later

### Environment Variables (in Vercel)

- [ ] `DATABASE_URL` added
- [ ] `NEXTAUTH_URL` added (production URL)
- [ ] `NEXTAUTH_SECRET` added
- [ ] `GOOGLE_CLIENT_ID` added
- [ ] `GOOGLE_CLIENT_SECRET` added
- [ ] All other required variables added
- [ ] Variables applied to "Production" environment

---

## 🚀 First Deployment

- [ ] Click "Deploy" in Vercel
- [ ] Wait for build to complete (2-3 minutes)
- [ ] Build succeeds without errors
- [ ] Deployment URL generated
- [ ] Can access deployment URL

---

## ✅ Post-Deployment Testing

### Access & Authentication

- [ ] Production site loads
- [ ] Can access login page
- [ ] Can create new account
- [ ] Can login with email/password
- [ ] Can login with Google OAuth
- [ ] Session persists across pages

### Functionality

- [ ] Can create a project
- [ ] Can create a task
- [ ] Can navigate all pages
- [ ] Admin panel works (for admin users)
- [ ] Data saves to database
- [ ] Data persists after logout/login

### Performance & UX

- [ ] Pages load quickly (< 3 seconds)
- [ ] No console errors in browser
- [ ] Mobile responsive
- [ ] Works in Chrome, Firefox, Safari
- [ ] SSL certificate active (https://)

---

## 🔧 OAuth Update

- [ ] Copy production URL from Vercel
- [ ] Go to Google Cloud Console
- [ ] Add production redirect URI:
  ```
  https://your-app.vercel.app/api/auth/callback/google
  ```
- [ ] Save changes
- [ ] Test Google OAuth on production

---

## 👥 User Management

- [ ] Create first admin account
- [ ] Test user invitation (if implemented)
- [ ] Test role assignment
- [ ] Verify multi-tenancy works (if multiple orgs)
- [ ] Test organization creation

---

## 📊 Monitoring & Alerts

- [ ] Set up Vercel deployment notifications
- [ ] Configure error alerts (optional: Sentry)
- [ ] Set up uptime monitoring (optional: UptimeRobot)
- [ ] Check Vercel Analytics (optional: enable)

---

## 📄 Documentation

- [ ] Update README.md with production URL
- [ ] Document environment variables needed
- [ ] Create user onboarding guide (optional)
- [ ] Document admin setup process
- [ ] Create troubleshooting guide

---

## 🔒 Security Review

- [ ] All passwords are hashed (bcrypt)
- [ ] JWT tokens configured correctly
- [ ] CSRF protection enabled (NextAuth default)
- [ ] Database uses SSL/TLS
- [ ] No exposed secrets in code
- [ ] HTTPS enforced (Vercel default)
- [ ] Rate limiting considered (optional)

---

## 📱 Legal & Compliance

- [ ] Privacy Policy page added (if collecting user data)
- [ ] Terms of Service page added
- [ ] Cookie notice (if using analytics)
- [ ] GDPR compliance (if EU users)
- [ ] Data retention policy defined

---

## 💾 Backup & Recovery

- [ ] Database backups enabled (Neon.tech auto-backups)
- [ ] Test database restore process
- [ ] Document backup schedule
- [ ] Plan for disaster recovery

---

## 🎓 Team Preparation

- [ ] Admin users identified
- [ ] Onboarding process planned
- [ ] Training materials prepared (optional)
- [ ] Support process defined
- [ ] Feedback collection method ready

---

## 📈 Scaling Preparation

- [ ] Know current limits (users, database, bandwidth)
- [ ] Plan for scaling (when to upgrade)
- [ ] Monitor usage metrics
- [ ] Budget for growth

---

## ✅ FINAL GO/NO-GO

### Must Have (Critical)

- ✅ Database connected and working
- ✅ Authentication working
- ✅ No build errors
- ✅ All environment variables set
- ✅ Basic features working

### Should Have (Important)

- ✅ OAuth configured
- ✅ Mobile responsive
- ✅ Error handling working
- ✅ Performance acceptable

### Nice to Have (Optional)

- 📌 Email notifications
- 📌 Custom domain
- 📌 Analytics
- 📌 Monitoring

---

## 🎯 Decision Time

**Are all "Must Have" items checked?**

- ✅ YES → **READY TO DEPLOY!** 🚀
- ❌ NO → Complete remaining items before deployment

**Are all "Should Have" items checked?**

- ✅ YES → **PRODUCTION READY!** 🎉
- ❌ NO → Consider delaying or document known limitations

---

## 📞 Emergency Contacts

If something goes wrong after deployment:

1. **Vercel Issues:**

   - Dashboard: https://vercel.com/dashboard
   - Status: https://status.vercel.com
   - Rollback: Dashboard → Deployments → Previous deployment → Promote

2. **Database Issues:**

   - Dashboard: https://console.neon.tech
   - Status: https://status.neon.tech
   - Support: Check dashboard for support options

3. **Quick Fixes:**
   - Redeploy: Git push or Vercel dashboard "Redeploy"
   - Clear cache: Vercel dashboard → Settings → Clear cache
   - Check logs: Vercel dashboard → Deployments → View function logs

---

## 📝 Notes Section

**Date of Deployment:** ******\_\_\_******

**Production URL:** ******\_\_\_******

**First Admin Email:** ******\_\_\_******

**Database Provider:** ******\_\_\_******

**Special Configurations:**

---

---

---

---

**Remember:** It's better to delay deployment and fix issues than to rush and have problems in production!

**Good luck! 🚀**
