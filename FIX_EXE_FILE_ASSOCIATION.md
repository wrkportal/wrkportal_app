# Fix .exe File Association in Windows

## Problem
You accidentally set .exe files to "always open with Internet Explorer", so Windows shows them as browser icons and tries to open them in IE instead of executing them.

## Solution: Reset .exe File Association

### Method 1: Using Windows Settings (Windows 10/11)
1. Press **Windows Key + I** to open Settings
2. Go to **Apps** → **Default apps**
3. Scroll down and click **"Choose default apps by file type"**
4. Find **.exe** in the list
5. Click on it and select **"Windows Installer"** or **"Setup"**
6. If those aren't available, select **"Look for another app on this PC"**
7. Navigate to: `C:\Windows\System32\`
8. Select **`rundll32.exe`** or **`cmd.exe`**
9. Click **Open**

### Method 2: Using Registry (Advanced - Be Careful!)
1. Press **Windows Key + R**
2. Type `regedit` and press Enter
3. Navigate to: `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.exe\UserChoice`
4. **Delete** the `UserChoice` key (right-click → Delete)
5. Close Registry Editor
6. **Restart your computer** or log out and back in

### Method 3: Quick Fix for This File Only
1. **Right-click** on `Project-Management-Studio-Setup.exe`
2. Select **"Open with"** → **"Choose another app"**
3. Select **"Windows Installer"** or **"Setup"**
4. **UNCHECK** "Always use this app to open .exe files" (important!)
5. Click **OK**
6. The file should now run

### Method 4: Command Line Fix
Open **Command Prompt as Administrator** and run:
```cmd
assoc .exe=exefile
ftype exefile="%1" %*
```

Then restart your computer.

## Verify It's Fixed
After fixing, try:
1. Double-click any .exe file
2. It should execute, not open in a browser
3. The icon should change from browser icon to application icon

## Prevention
- When Windows asks "How do you want to open this file?", be careful
- Only check "Always use this app" if you're sure it's the right program
- For .exe files, always choose "Windows Installer" or "Setup", never a browser


