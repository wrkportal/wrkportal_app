# Quick Start: Desktop App Download

## For Users

### Where to Find the Download

1. **In the Header** (top right): Click "Desktop App" button
2. **In the Sidebar** (left menu): Click "Download Desktop App" at the bottom

Both will take you to the download page where you can:
- Download for your platform (Windows/Mac/Linux)
- See installation instructions
- View system requirements

---

## For Developers

### First Time Setup

1. **Build the desktop app** (one-time):
   ```bash
   npm run build
   npm run electron:build
   ```

2. **Host the installers**:
   - Option A: Upload to cloud storage (S3, etc.) and set environment variables
   - Option B: Copy to `public/downloads/` folder

3. **Test the download page**:
   - Visit `http://localhost:3000/download`
   - Or click the download button in header/sidebar

### Environment Variables (Optional)

If hosting installers on a CDN, add to `.env.local`:

```env
NEXT_PUBLIC_DESKTOP_WINDOWS_URL=https://your-cdn.com/downloads/app.exe
NEXT_PUBLIC_DESKTOP_MAC_URL=https://your-cdn.com/downloads/app.dmg
NEXT_PUBLIC_DESKTOP_LINUX_URL=https://your-cdn.com/downloads/app.AppImage
```

---

## Current Status

✅ Download page created at `/download`  
✅ Download button added to header  
✅ Download menu item added to sidebar  
⏳ Desktop app needs to be built (run `npm run electron:build`)  
⏳ Installers need to be hosted (upload to CDN or `public/downloads/`)

