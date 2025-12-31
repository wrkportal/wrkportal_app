# Quick Build Guide - Electron Desktop App

## 🚀 Quick Start (3 Steps)

### 1. Build Next.js App
```bash
npm run build
```

### 2. Build Electron Installers
```bash
npm run electron:build
```

### 3. Copy Installers to Public Folder

**Windows:**
```cmd
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

## ✅ Done!

Now visit `http://localhost:3000/download` - the download buttons will work!

---

## 📝 Full Details

See `BUILD_ELECTRON_APP.md` for:
- Troubleshooting
- Platform-specific builds
- Development mode
- Advanced configuration

---

## ⚠️ Important Notes

1. **First build takes 5-10 minutes** (downloads Electron binaries)
2. **Installers are in `dist/` folder** after `npm run electron:build`
3. **Copy installers to `public/downloads/`** for web download
4. **Test installers** on target platforms before distribution

---

## 🔧 Development Mode

To test Electron app without building installers:

```bash
npm run electron:dev
```

This starts Next.js dev server + Electron window with hot reload.

