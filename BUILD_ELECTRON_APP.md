# How to Build the Electron Desktop App

## Prerequisites

1. **Node.js 18+** installed
2. **All dependencies** installed (`npm install`)
3. **Database setup** completed (Prisma migrations)

## Step-by-Step Build Instructions

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- Electron
- Electron Builder
- DuckDB (for local data processing)
- All other project dependencies

### Step 2: Build Next.js Application

First, build the Next.js app for production:

```bash
npm run build
```

This will:
- Generate Prisma client
- Run database migrations
- Build the Next.js application
- Create optimized production bundles

**Expected output:** `.next` folder with built application

### Step 3: Build Electron App (Create Installers)

Now build the Electron desktop app with installers:

```bash
npm run electron:build
```

This command:
1. Builds the Next.js app (if not already built)
2. Packages everything into Electron
3. Creates platform-specific installers

**Expected output:** `dist/` folder with installers:
- **Windows:** `Project Management Studio Setup.exe`
- **Mac:** `Project Management Studio.dmg`
- **Linux:** `Project Management Studio.AppImage` and `.deb`

**Note:** First build may take 5-10 minutes as it downloads Electron binaries (~200MB).

### Step 4: Copy Installers to Public Folder

After building, copy the installers to `public/downloads/` so they're accessible via the download page:

**Windows (PowerShell):**
```powershell
Copy-Item "dist\Project Management Studio Setup.exe" "public\downloads\Project-Management-Studio-Setup.exe"
```

**Windows (Command Prompt):**
```cmd
copy "dist\Project Management Studio Setup.exe" "public\downloads\Project-Management-Studio-Setup.exe"
```

**Mac/Linux:**
```bash
cp "dist/Project Management Studio.dmg" "public/downloads/Project-Management-Studio.dmg"
cp "dist/Project Management Studio.AppImage" "public/downloads/Project-Management-Studio.AppImage"
```

### Step 5: Test the Download Page

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit: `http://localhost:3000/download`

3. The download buttons should now be enabled and working!

---

## Development Mode (Testing Electron App)

To test the Electron app in development mode (without building installers):

```bash
npm run electron:dev
```

This will:
- Start Next.js dev server
- Launch Electron window
- Enable hot reloading
- Open DevTools automatically

---

## Platform-Specific Builds

### Build for Windows Only

```bash
npm run build
npx electron-builder --win
```

### Build for Mac Only

```bash
npm run build
npx electron-builder --mac
```

### Build for Linux Only

```bash
npm run build
npx electron-builder --linux
```

---

## Troubleshooting

### Issue: Build Fails with "Module not found"

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Issue: "electron-builder: command not found"

**Solution:**
```bash
npm install --save-dev electron-builder
```

### Issue: Build Takes Too Long

**Solution:**
- First build downloads Electron binaries (~200MB) - this is normal
- Subsequent builds are much faster
- Use `--dir` flag to skip installer creation: `npx electron-builder --dir`

### Issue: Installers Not Found After Build

**Solution:**
1. Check `dist/` folder exists
2. Verify build completed successfully (no errors)
3. Check `electron-builder.config.js` for correct output directory

### Issue: DuckDB Native Module Errors

**Solution:**
DuckDB is a native module. If you see errors:
1. Make sure you're building on the target platform (or use cross-compilation)
2. For Windows: May need Visual Studio Build Tools
3. For Mac: May need Xcode Command Line Tools

### Issue: Next.js Build Fails

**Solution:**
1. Check database connection
2. Run `npx prisma generate`
3. Check environment variables are set
4. Review build logs for specific errors

---

## File Structure After Build

```
ProjectManagement/
├── dist/                          # Built installers (created after electron:build)
│   ├── Project Management Studio Setup.exe  (Windows)
│   ├── Project Management Studio.dmg        (Mac)
│   └── Project Management Studio.AppImage   (Linux)
├── public/
│   └── downloads/                 # Copy installers here for web download
│       ├── Project-Management-Studio-Setup.exe
│       ├── Project-Management-Studio.dmg
│       └── Project-Management-Studio.AppImage
├── .next/                         # Next.js build output
├── electron/
│   ├── main.js                    # Electron main process
│   └── preload.js                 # Preload script
└── electron-builder.config.js     # Build configuration
```

---

## Alternative: Host Installers on CDN

Instead of copying files to `public/downloads/`, you can host installers on a CDN:

1. Upload installers to your CDN (AWS S3, Cloudflare, etc.)
2. Set environment variables in `.env.local`:

```env
NEXT_PUBLIC_DESKTOP_WINDOWS_URL=https://your-cdn.com/downloads/app.exe
NEXT_PUBLIC_DESKTOP_MAC_URL=https://your-cdn.com/downloads/app.dmg
NEXT_PUBLIC_DESKTOP_LINUX_URL=https://your-cdn.com/downloads/app.AppImage
```

---

## Build Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run build` | Build Next.js app for production |
| `npm run electron:dev` | Run Electron app in development mode |
| `npm run electron:build` | Build Next.js + Create Electron installers |
| `npm run desktop` | Build Next.js + Run Electron (no installer) |

---

## Next Steps

After building:
1. ✅ Test installers on target platforms
2. ✅ Sign installers (for distribution)
3. ✅ Set up auto-updater (optional)
4. ✅ Configure code signing certificates (for production)

---

## Need Help?

- Check `electron-builder.config.js` for build configuration
- Review `HOW_TO_BUILD_DESKTOP_APP.md` for quick reference
- Check Electron Builder docs: https://www.electron.build/

