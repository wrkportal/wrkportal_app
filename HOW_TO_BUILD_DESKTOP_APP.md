# How to Build the Desktop App

## Quick Start

The 404 error occurs because the installers haven't been built yet. Follow these steps:

### Step 1: Install Dependencies (if not already done)

```bash
npm install
```

### Step 2: Build the Desktop App

```bash
# First, build the Next.js app
npm run build

# Then, build the Electron app (this creates installers)
npm run electron:build
```

**Note:** The first build may take 5-10 minutes as it downloads Electron binaries.

### Step 3: Copy Installers to Public Folder

After building, you'll find installers in the `dist/` folder. Copy them to `public/downloads/`:

**Windows:**
```bash
copy "dist\Project Management Studio Setup.exe" "public\downloads\Project-Management-Studio-Setup.exe"
```

**Mac:**
```bash
cp "dist/Project Management Studio.dmg" "public/downloads/Project-Management-Studio.dmg"
```

**Linux:**
```bash
cp "dist/Project Management Studio.AppImage" "public/downloads/Project-Management-Studio.AppImage"
```

### Step 4: Test the Download Page

1. Start your dev server: `npm run dev`
2. Visit: `http://localhost:3000/download`
3. The download buttons should now work!

---

## Alternative: Use Environment Variables

Instead of copying files, you can host installers on a CDN and set environment variables:

Create `.env.local`:
```env
NEXT_PUBLIC_DESKTOP_WINDOWS_URL=https://your-cdn.com/downloads/app.exe
NEXT_PUBLIC_DESKTOP_MAC_URL=https://your-cdn.com/downloads/app.dmg
NEXT_PUBLIC_DESKTOP_LINUX_URL=https://your-cdn.com/downloads/app.AppImage
```

---

## Troubleshooting

### Build Fails
- Make sure you have Node.js 18+ installed
- Try deleting `node_modules` and `dist` folders, then run `npm install` again

### Installers Not Found
- Check that `dist/` folder exists after running `npm run electron:build`
- Verify the installer names match what's in `electron-builder.config.js`

### Download Still Shows 404
- Make sure files are in `public/downloads/` folder
- Check file names match exactly (case-sensitive)
- Restart your dev server after copying files

---

## File Locations

- **Built installers:** `dist/` folder
- **Public downloads:** `public/downloads/` folder
- **Config:** `electron-builder.config.js`

