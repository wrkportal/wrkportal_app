# Fix Downloaded Installer File

## Issue: File Shows as Browser Icon and Won't Run

If the downloaded file shows as a browser icon instead of an executable, try these solutions:

### Solution 1: Delete and Re-download
1. **Delete the corrupted file** from your Downloads folder
2. **Clear browser cache** (optional but recommended)
3. **Re-download** from the `/download` page
4. The new download method uses blob download which should preserve file type correctly

### Solution 2: Fix File Association (If file is actually correct)
1. **Right-click** on the file
2. Select **"Open with"** → **"Choose another app"**
3. Select **"Windows Installer"** or **"Setup"**
4. Check **"Always use this app to open .exe files"**
5. Click **OK**

### Solution 3: Verify File Integrity
1. Check the file size should be **~293 MB** (307,174,690 bytes)
2. If the file is smaller, it's incomplete - delete and re-download
3. Try running from Command Prompt:
   ```cmd
   cd %USERPROFILE%\Downloads
   "Project-Management-Studio-Setup.exe"
   ```

### Solution 4: Check Windows Security
1. **Right-click** the file → **Properties**
2. If you see **"This file came from another computer"**, click **"Unblock"**
3. Click **OK**
4. Try running again

### Solution 5: Download Directly from File System
If the web download keeps failing, you can copy directly:
1. Navigate to: `C:\Users\User\Desktop\ProjectManagement\public\downloads\`
2. Copy `Project-Management-Studio-Setup.exe` to your Downloads folder
3. Run it from there

## Prevention
The updated download code now:
- Uses blob download for better file type preservation
- Sets proper MIME type (`application/octet-stream`)
- Explicitly sets filename with `.exe` extension
- Should prevent this issue in future downloads


