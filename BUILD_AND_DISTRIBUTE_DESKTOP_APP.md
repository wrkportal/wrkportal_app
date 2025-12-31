# How to Build and Distribute Desktop App

## Where Users Will See the Download Option

Users can access the download page from **two places**:

1. **Header** (Top right): "Desktop App" button (visible on medium+ screens)
2. **Sidebar** (Left navigation): "Download Desktop App" menu item (at the bottom, before Admin section)

Both will take users to `/download` page where they can:
- See platform-specific download buttons (Windows/Mac/Linux)
- View installation instructions
- See system requirements

---

## Building the Desktop App

### Step 1: Install Dependencies (if not already done)

```bash
npm install
```

### Step 2: Build the App

```bash
# Build Next.js app first
npm run build

# Build Electron app (creates installer)
npm run electron:build
```

**Output Location:**
After building, you'll find installers in the `dist/` folder:
- **Windows**: `dist/Project Management Studio Setup.exe`
- **Mac**: `dist/Project Management Studio.dmg`
- **Linux**: `dist/Project Management Studio.AppImage`

---

## Step 3: Host the Installers

### Option A: Manual Distribution
1. Upload installers to cloud storage:
   - AWS S3
   - Google Cloud Storage
   - Azure Blob Storage
   - Or any CDN

2. Update environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_DESKTOP_WINDOWS_URL=https://your-cdn.com/downloads/Project-Management-Studio-Setup.exe
   NEXT_PUBLIC_DESKTOP_MAC_URL=https://your-cdn.com/downloads/Project-Management-Studio.dmg
   NEXT_PUBLIC_DESKTOP_LINUX_URL=https://your-cdn.com/downloads/Project-Management-Studio.AppImage
   ```

3. The download page will automatically use these URLs

### Option B: Serve from Your App (Simple)
1. Create a `public/downloads/` folder
2. Copy installers there:
   ```
   public/downloads/
     ├── Project-Management-Studio-Setup.exe
     ├── Project-Management-Studio.dmg
     └── Project-Management-Studio.AppImage
   ```
3. The download page will automatically find them at `/downloads/...`

### Option C: Auto-Updater (Advanced - Future)
- Set up update server (e.g., using `electron-updater`)
- Configure `electron-builder` publish settings
- App checks for updates automatically

---

## Testing the Download Page

1. Start your dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/download`
3. Or click "Desktop App" in header / "Download Desktop App" in sidebar

---

## Development Mode

To test the Electron app in development:

```bash
# Build Next.js first
npm run build

# Run Electron in dev mode
npm run electron:dev
```

This will open the Electron window pointing to `http://localhost:3000` (if dev server is running) or the built Next.js app.

---

## Notes

- **First Build**: The first build may take 5-10 minutes as it downloads Electron binaries
- **File Size**: Installers are typically 100-200MB (includes Electron runtime + your app)
- **Code Signing**: For production, you'll want to code-sign the installers (see electron-builder docs)
- **Auto-Updates**: Requires additional setup with an update server

