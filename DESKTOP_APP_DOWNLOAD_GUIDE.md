# Desktop App Download Guide

## ✅ Current Status

### What's Working:
1. **Download Page** (`/download`): 
   - ✅ Detects user's platform automatically
   - ✅ Shows download buttons for Windows, Mac, and Linux
   - ✅ Checks if installer files exist before enabling download
   - ✅ Provides helpful instructions if installers aren't available

2. **Installer Created**:
   - ✅ Windows installer: `dist/enterprise-project-management Setup 1.0.0.exe`
   - ✅ Copied to: `public/downloads/Project-Management-Studio-Setup.exe`
   - ✅ Download page can now serve it to users

### What Needs Testing:
1. **Production Build**: The installer needs to be rebuilt with the latest fixes to ensure the Next.js server starts correctly
2. **Path Resolution**: The app needs to find the bundled Next.js standalone server in the packaged app

## 🚀 How Real Users Will Download

### For End Users:
1. **Visit the Download Page**: Users go to `https://yourdomain.com/download` (or `/download` in your app)
2. **Platform Detection**: The page automatically detects if they're on Windows, Mac, or Linux
3. **Download**: Click the "Download" button for their platform
4. **Install**: Run the installer and follow the setup wizard
5. **Launch**: The app will start automatically after installation

### For You (Developer):
1. **Build the Installer**: Run `npm run electron:build`
2. **Copy to Downloads**: The installer is automatically copied to `public/downloads/`
3. **Deploy**: Upload the `public/downloads/` folder to your hosting/CDN
4. **Update Links** (optional): Set environment variables for custom download URLs:
   ```env
   NEXT_PUBLIC_DESKTOP_WINDOWS_URL=https://your-cdn.com/downloads/Project-Management-Studio-Setup.exe
   NEXT_PUBLIC_DESKTOP_MAC_URL=https://your-cdn.com/downloads/Project-Management-Studio.dmg
   NEXT_PUBLIC_DESKTOP_LINUX_URL=https://your-cdn.com/downloads/Project-Management-Studio.AppImage
   ```

## 🔧 Rebuilding the Installer (With Latest Fixes)

To rebuild the installer with all the spawn error fixes:

```bash
# 1. Build Next.js with standalone output
npm run build

# 2. Build Electron app
npm run electron:build

# 3. Copy installer to downloads folder
# Windows:
copy "dist\enterprise-project-management Setup 1.0.0.exe" "public\downloads\Project-Management-Studio-Setup.exe"

# Or use PowerShell:
Copy-Item -Path "dist\enterprise-project-management Setup 1.0.0.exe" -Destination "public\downloads\Project-Management-Studio-Setup.exe" -Force
```

## 📋 Testing the Installer

### Before Distribution:
1. **Install on a Clean Machine**: Test the installer on a machine that doesn't have Node.js or your dev environment
2. **Check Server Startup**: The app should start the Next.js server automatically
3. **Verify Functionality**: Test that all features work in the packaged app

### If the App Shows "Server Could Not Be Started":
- The standalone server might not be included in the package
- Check that `electron-builder.config.js` includes `.next/standalone/**/*`
- Verify that `next.config.js` has `output: 'standalone'`

## 🌐 Hosting the Installers

### Option 1: Same Server (Simple)
- Keep installers in `public/downloads/`
- Next.js will serve them statically
- Works for small-scale distribution

### Option 2: CDN (Recommended for Production)
- Upload installers to AWS S3, Cloudflare R2, or similar
- Set `NEXT_PUBLIC_DESKTOP_*_URL` environment variables
- Better performance and bandwidth management

### Option 3: GitHub Releases
- Create releases in your GitHub repo
- Upload installers as release assets
- Update download links to point to GitHub releases

## 📝 Current Issues & Solutions

### Issue: "SPAWNSYSTEM32" Error
**Status**: ✅ Fixed
- The app now uses `process.execPath` instead of spawning `cmd.exe`
- Development mode requires manual Next.js server start
- Production mode should work automatically

### Issue: "Server Could Not Be Started"
**Status**: 🔄 In Progress
- Path resolution improved to check multiple locations
- Need to verify standalone server is included in package
- May need to adjust `electron-builder.config.js` file patterns

### Issue: Download Page Shows "Not Available"
**Status**: ✅ Fixed
- Installer is now in `public/downloads/`
- Download page checks file existence
- Buttons enable/disable based on file availability

## 🎯 Next Steps

1. **Rebuild the installer** with the latest fixes
2. **Test on a clean machine** to ensure it works for end users
3. **Set up CDN/hosting** for production distribution
4. **Update download page** with production URLs if using CDN
5. **Add auto-updater** (optional) for seamless updates

## 📞 Support

If users encounter issues:
- Check Electron DevTools console (if accessible)
- Verify Next.js server is starting (check Task Manager for Node.js processes)
- Ensure firewall isn't blocking localhost:3000
- Check that the app has necessary permissions


