# Fix .exe File Association - Alternative Methods

Since `.exe` doesn't appear in the file type list, use these methods:

## Method 1: Command Prompt (Easiest - Recommended)

1. **Press Windows Key + X**
2. Select **"Windows Terminal (Admin)"** or **"Command Prompt (Admin)"**
3. Click **"Yes"** when prompted by UAC
4. Copy and paste these commands one by one:

```cmd
assoc .exe=exefile
ftype exefile="%1" %*
```

5. **Restart your computer** (important!)
6. After restart, `.exe` files should work correctly

## Method 2: Registry Editor (If Command Prompt doesn't work)

1. **Press Windows Key + R**
2. Type `regedit` and press Enter
3. Click **"Yes"** when prompted
4. Navigate to this path (copy-paste in address bar):
   ```
   HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.exe\UserChoice
   ```
5. **Right-click** on `UserChoice` folder
6. Select **"Delete"**
7. Click **"Yes"** to confirm
8. **Close Registry Editor**
9. **Restart your computer**

## Method 3: Fix Just This File (Quick Test)

1. **Right-click** on `Project-Management-Studio-Setup.exe`
2. Select **"Properties"**
3. Look for **"Unblock"** button at the bottom - if you see it, click it
4. Click **"OK"**
5. Try double-clicking the file

## Method 4: Run from Command Prompt (Bypass Association)

1. Open **Command Prompt** (regular, not admin)
2. Navigate to Downloads:
   ```cmd
   cd %USERPROFILE%\Downloads
   ```
3. Run the installer:
   ```cmd
   "Project-Management-Studio-Setup.exe"
   ```
   (or whatever the exact filename is)

This bypasses the file association and runs it directly.

## Verify It's Fixed

After using Method 1 or 2 and restarting:
- `.exe` files should have the correct icon (not browser icon)
- Double-clicking should execute them
- The installer should run normally


