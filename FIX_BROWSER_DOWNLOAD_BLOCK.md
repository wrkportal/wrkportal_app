# Fix Browser Download Blocking

If your browser is blocking the `.exe` download or showing "Unconfirmed" files:

## Quick Fix: Complete the Download

1. **Check your browser's download bar** (usually at the bottom)
   - Look for a warning about the file
   - Click **"Keep"** or **"Allow"** or **"Download anyway"**

2. **If the file shows as "Unconfirmed...crdownload":**
   - Right-click on it in the download bar
   - Select **"Keep"** or **"Allow"**
   - The file will complete downloading

## Alternative: Download Directly

If the browser keeps blocking, download directly from the file system:

1. **Open File Explorer**
2. Navigate to: `C:\Users\User\Desktop\ProjectManagement\public\downloads\`
3. **Copy** `Project-Management-Studio-Setup.exe`
4. **Paste** it to your Downloads folder or Desktop
5. **Right-click** the file → **Properties**
6. If you see **"Unblock"** button, click it
7. Click **OK**
8. Double-click to run

## Fix Browser Settings (Chrome/Edge)

To prevent future blocking:

1. **Chrome/Edge Settings:**
   - Go to `chrome://settings/downloads` (or `edge://settings/downloads`)
   - Under "Ask where to save each file before downloading" - **turn this ON**
   - This gives you more control

2. **Or allow downloads from localhost:**
   - Go to `chrome://settings/content/downloads`
   - Add `http://localhost:3000` to allowed sites

## Run the Installer from Command Prompt

If the file downloaded but won't run:

1. Open **Command Prompt**
2. Navigate to Downloads:
   ```cmd
   cd %USERPROFILE%\Downloads
   ```
3. Find the exact filename (might be "Unconfirmed [number].exe" or similar)
4. Rename it:
   ```cmd
   ren "Unconfirmed *.exe" "Project-Management-Studio-Setup.exe"
   ```
5. Run it:
   ```cmd
   "Project-Management-Studio-Setup.exe"
   ```

## Why This Happens

Browsers block `.exe` files by default because they can be dangerous. This is normal security behavior. The file is safe - it's your own installer that you built.

