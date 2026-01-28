const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs').promises

let mainWindow
let nextProcess
let localDB
let dbPath
let duckdb = null

// Try to load DuckDB (optional - may not be available in packaged app)
try {
  duckdb = require('duckdb')
} catch (error) {
  console.warn('⚠️ DuckDB not available - local data processing will be limited')
}

// Initialize local DuckDB (optional)
function initLocalDB() {
  if (!duckdb) {
    console.warn('⚠️ DuckDB not available - skipping local database initialization')
    return
  }
  
  try {
    const userDataPath = app.getPath('userData')
    const dbDir = path.join(userDataPath, 'local-data')
    
    // Ensure directory exists
    fs.mkdir(dbDir, { recursive: true }).catch(console.error)
    
    dbPath = path.join(dbDir, 'local.db')
    localDB = new duckdb.Database(dbPath)
    
    console.log('✅ Local DuckDB initialized at:', dbPath)
    
    // Test connection
    localDB.all('SELECT 1 as test', (err, result) => {
      if (err) {
        console.error('❌ DuckDB connection error:', err)
      } else {
        console.log('✅ DuckDB connection successful')
      }
    })
  } catch (error) {
    console.error('❌ Failed to initialize DuckDB:', error)
    localDB = null
  }
}

// Start Next.js dev server (for development)
function startNextDev() {
  try {
    const projectRoot = path.join(__dirname, '..')
    
    // For development, we can skip starting the server if it's already running
    // Or use a simpler approach that doesn't require spawning
    console.log('⚠️ Development mode: Please start Next.js manually with "npm run dev" in a separate terminal')
    console.log('   The Electron app will connect to http://localhost:3000')
    
    // Don't spawn - let user start it manually or it might already be running
    // This avoids the spawn/cmd.exe issues
    return
    
    // Alternative: Try to find and use node directly
    /*
    const nodePath = process.execPath // Use Electron's node
    const nextPath = path.join(projectRoot, 'node_modules', '.bin', 'next')
    
    nextProcess = spawn(nodePath, [nextPath, 'dev'], {
      cwd: projectRoot,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PATH: process.env.PATH || ''
      }
    })
    
    nextProcess.stdout?.on('data', (data) => {
      console.log(`Next.js: ${data.toString()}`)
    })
    
    nextProcess.stderr?.on('data', (data) => {
      console.error(`Next.js error: ${data.toString()}`)
    })
    
    nextProcess.on('error', (error) => {
      console.error('Failed to start Next.js:', error)
    })
    
    nextProcess.on('exit', (code) => {
      console.log(`Next.js exited with code ${code}`)
    })
    */
  } catch (error) {
    console.error('Error starting Next.js dev server:', error)
  }
}

// Start Next.js production server
async function startNextProd() {
  try {
    // In packaged app, files are in resources/app.asar or resources/app
    const appPath = app.getAppPath()
    const isPackaged = app.isPackaged
    
    console.log('🔍 Looking for Next.js standalone server...')
    console.log('   App path:', appPath)
    console.log('   Is packaged:', isPackaged)
    
    // Try multiple possible locations for the Next.js server
    const possibleServerPaths = []
    
    if (isPackaged) {
      // In packaged app, .next/standalone should be in resources/app.asar or resources/app
      const resourcesPath = path.resolve(appPath, '..', '..', '..')
      const exeDir = path.dirname(process.execPath)
      
      possibleServerPaths.push(
        path.join(resourcesPath, 'app', '.next', 'standalone', 'server.js'),
        path.join(resourcesPath, '.next', 'standalone', 'server.js'),
        path.join(exeDir, 'resources', 'app', '.next', 'standalone', 'server.js'),
        path.join(exeDir, 'resources', '.next', 'standalone', 'server.js'),
        path.join(appPath, '.next', 'standalone', 'server.js'),
        path.join(__dirname, '..', '.next', 'standalone', 'server.js')
      )
    } else {
      // In development build, use project root
      const projectRoot = path.resolve(__dirname, '..')
      possibleServerPaths.push(
        path.join(projectRoot, '.next', 'standalone', 'server.js'),
        path.join(appPath, '.next', 'standalone', 'server.js')
      )
    }
    
    let serverPath = null
    for (const possiblePath of possibleServerPaths) {
      try {
        await fs.access(possiblePath)
        serverPath = possiblePath
        console.log('✅ Found Next.js server at:', serverPath)
        break
      } catch (e) {
        // Path doesn't exist, try next
        console.log('❌ Server not found at:', possiblePath)
      }
    }
    
    if (!serverPath) {
      const errorMsg = 'Next.js standalone server not found. Please rebuild the app with "npm run build && npm run electron:build"'
      console.error('❌', errorMsg)
      console.error('   Searched paths:')
      possibleServerPaths.forEach(p => console.error('     -', p))
      throw new Error(errorMsg)
    }
    
    // Get Node.js executable path (in packaged app, it's bundled with Electron)
    const nodePath = process.execPath // Electron's node executable
    
    console.log('🚀 Starting Next.js server with:', nodePath)
    console.log('   Server script:', serverPath)
    console.log('   Working directory:', path.dirname(serverPath))
    
    // Use spawn with nodePath directly (no shell needed)
    nextProcess = spawn(nodePath, [serverPath], {
      cwd: path.dirname(serverPath),
      shell: false, // Don't use shell to avoid cmd.exe issues
      stdio: ['ignore', 'pipe', 'pipe'], // Capture output
      env: {
        ...process.env,
        PORT: '3000',
        NODE_ENV: 'production',
        PATH: process.env.PATH || ''
      }
    })
    
    // Log output for debugging
    nextProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim()
      if (output) {
        console.log(`[Next.js] ${output}`)
      }
    })
    
    nextProcess.stderr?.on('data', (data) => {
      const output = data.toString().trim()
      if (output) {
        console.error(`[Next.js ERROR] ${output}`)
      }
    })
    
    nextProcess.on('error', (error) => {
      console.error('❌ Failed to start Next.js production server:', error)
      throw error
    })
    
    nextProcess.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        console.error(`❌ Next.js production server exited with code ${code} (signal: ${signal})`)
      } else {
        console.log(`ℹ️ Next.js production server exited (code: ${code}, signal: ${signal})`)
      }
    })
    
    // Wait for server to start - check if it's listening on port 3000
    let serverReady = false
    const maxWaitTime = 10000 // 10 seconds
    const checkInterval = 500 // Check every 500ms
    const startTime = Date.now()
    
    while (!serverReady && (Date.now() - startTime) < maxWaitTime) {
      try {
        const http = require('http')
        await new Promise((resolve, reject) => {
          const req = http.get('http://localhost:3000', (res) => {
            serverReady = true
            resolve(true)
          })
          req.on('error', () => {
            // Server not ready yet
            setTimeout(resolve, checkInterval)
          })
          req.setTimeout(100, () => {
            req.destroy()
            setTimeout(resolve, checkInterval)
          })
        })
        
        if (serverReady) {
          console.log('✅ Next.js server is ready!')
          break
        }
      } catch (e) {
        // Continue waiting
        await new Promise(resolve => setTimeout(resolve, checkInterval))
      }
    }
    
    if (!serverReady) {
      console.warn('⚠️ Next.js server may not be ready yet, but continuing...')
    }
    
    return Promise.resolve()
  } catch (error) {
    console.error('❌ Error in startNextProd:', error)
    throw error // Re-throw so caller can handle it
  }
}

// Create Electron window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    icon: path.join(__dirname, '../public/icon.png'),
    titleBarStyle: 'default',
    show: false // Don't show until ready
  })

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    // Focus window
    if (process.platform === 'darwin') {
      app.dock.show()
    }
  })

  // Load Next.js app
  if (process.env.NODE_ENV === 'development') {
    // In dev mode, assume Next.js is already running or will be started manually
    startNextDev() // This now just logs a message
    
    // Try to load with retries
    let retryCount = 0
    const maxRetries = 10
    const retryDelay = 2000 // 2 seconds
    
    const tryLoad = () => {
      mainWindow.loadURL('http://localhost:3000').then(() => {
        console.log('✅ Successfully connected to Next.js dev server')
      }).catch((error) => {
        retryCount++
        if (retryCount < maxRetries) {
          console.log(`⏳ Waiting for Next.js server... (attempt ${retryCount}/${maxRetries})`)
          setTimeout(tryLoad, retryDelay)
        } else {
          console.warn('⚠️ Could not connect to Next.js dev server after multiple attempts.')
          console.warn('   Please run "npm run dev" in a separate terminal and reload the window (Ctrl+R)')
          mainWindow.loadURL(`data:text/html,<html><body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>Waiting for Next.js Server</h1>
            <p>Please start the Next.js dev server:</p>
            <p><code style="background: #f0f0f0; padding: 10px; display: inline-block;">npm run dev</code></p>
            <p>Then press <strong>Ctrl+R</strong> to reload this window.</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">Attempt ${retryCount} of ${maxRetries}</p>
          </body></html>`)
        }
      })
    }
    
    // Start trying after a short delay
    setTimeout(tryLoad, 1000)
  } else {
    // In production, try to start Next.js server and load from localhost
    // If that fails, show an error page with helpful instructions
    startNextProd()
      .then(() => {
        // Wait a bit more for server to be fully ready
        setTimeout(() => {
          // Try to load from localhost with retries
          let retryCount = 0
          const maxRetries = 5
          const retryDelay = 1000
          
          const tryLoad = () => {
            mainWindow.loadURL('http://localhost:3000')
              .then(() => {
                console.log('✅ Successfully loaded Next.js app')
              })
              .catch((error) => {
                retryCount++
                if (retryCount < maxRetries) {
                  console.log(`⏳ Retrying to load app... (${retryCount}/${maxRetries})`)
                  setTimeout(tryLoad, retryDelay)
                } else {
                  console.error('❌ Failed to load from localhost after retries:', error)
                  showErrorPage('Failed to connect to Next.js server', error.message)
                }
              })
          }
          
          tryLoad()
        }, 2000)
      })
      .catch((error) => {
        console.error('❌ Failed to start production server:', error)
        showErrorPage('Next.js server could not be started', error.message)
      })
  }
  
  // Helper function to show error page
  function showErrorPage(title, errorMessage) {
    const errorHtml = `
      <html>
        <head>
          <title>Application Error</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              padding: 40px;
              text-align: center;
              background: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            h1 { color: #d32f2f; margin-bottom: 20px; }
            .error { 
              background: #ffebee; 
              padding: 15px; 
              border-radius: 4px; 
              margin: 20px 0;
              font-family: monospace;
              font-size: 12px;
              text-align: left;
            }
            .instructions {
              text-align: left;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
            }
            .instructions ol {
              margin: 10px 0;
              padding-left: 20px;
            }
            .instructions code {
              background: #f5f5f5;
              padding: 2px 6px;
              border-radius: 3px;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚠️ ${title}</h1>
            <p>The application could not start properly.</p>
            <div class="error">
              <strong>Error:</strong><br>
              ${errorMessage}
            </div>
            <div class="instructions">
              <h3>To fix this issue:</h3>
              <ol>
                <li>Close this application</li>
                <li>Open Command Prompt in the project directory</li>
                <li>Run: <code>npm run build</code></li>
                <li>Then run: <code>npm run electron:build</code></li>
                <li>Reinstall the application</li>
              </ol>
              <p style="margin-top: 20px; color: #666; font-size: 12px;">
                If the problem persists, check the console logs for more details.
              </p>
            </div>
          </div>
        </body>
      </html>
    `
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`)
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
    
    // Add keyboard shortcut to reload
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.control && input.key.toLowerCase() === 'r') {
        event.preventDefault()
        mainWindow.reload()
      }
    })
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  // Don't crash the app, just log the error
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // Don't crash the app, just log the error
})

// Initialize when ready
app.whenReady().then(() => {
  try {
    initLocalDB()
    createWindow()
    
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  } catch (error) {
    console.error('Error during app initialization:', error)
    // Try to show error window
    if (mainWindow) {
      mainWindow.loadURL(`data:text/html,<html><body style="font-family: Arial; padding: 40px;">
        <h1>Initialization Error</h1>
        <p>${error.message}</p>
      </body></html>`)
    }
  }
})

app.on('window-all-closed', () => {
  // Close Next.js server (dev or prod)
  if (nextProcess) {
    nextProcess.kill()
    nextProcess = null
  }
  
  // Close DuckDB connection
  if (localDB) {
    localDB.close((err) => {
      if (err) console.error('Error closing DuckDB:', err)
    })
    localDB = null
  }
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers for local database operations

// Query local DuckDB
ipcMain.handle('local-db:query', async (event, query, params = []) => {
  return new Promise((resolve, reject) => {
    if (!localDB || !duckdb) {
      reject(new Error('Local database not available. DuckDB is not installed or not initialized.'))
      return
    }
    
    localDB.all(query, params, (err, rows) => {
      if (err) {
        console.error('DuckDB query error:', err)
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
})

// Load file into local DuckDB
ipcMain.handle('local-db:load-file', async (event, filePath, tableName = 'imported_data') => {
  return new Promise((resolve, reject) => {
    if (!localDB || !duckdb) {
      reject(new Error('Local database not available. DuckDB is not installed or not initialized.'))
      return
    }
    
    // Determine file type
    const ext = path.extname(filePath).toLowerCase()
    let query
    
    if (ext === '.csv') {
      query = `
        CREATE OR REPLACE TABLE ${tableName} AS 
        SELECT * FROM read_csv_auto('${filePath.replace(/'/g, "''")}')
      `
    } else if (ext === '.xlsx' || ext === '.xls') {
      // For Excel, we'll need to convert to CSV first or use a different approach
      // For now, reject Excel files (can be enhanced later)
      reject(new Error('Excel files need to be converted to CSV first'))
      return
    } else {
      reject(new Error(`Unsupported file type: ${ext}`))
      return
    }
    
    localDB.run(query, (err) => {
      if (err) {
        console.error('Error loading file:', err)
        reject(err)
      } else {
        // Get row count
        localDB.all(`SELECT COUNT(*) as count FROM ${tableName}`, (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve({ 
              success: true, 
              rowCount: rows[0]?.count || 0,
              tableName 
            })
          }
        })
      }
    })
  })
})

// Get table schema
ipcMain.handle('local-db:get-schema', async (event, tableName) => {
  return new Promise((resolve, reject) => {
    if (!localDB || !duckdb) {
      reject(new Error('Local database not available. DuckDB is not installed or not initialized.'))
      return
    }
    
    localDB.all(`DESCRIBE ${tableName}`, (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
})

// List all tables
ipcMain.handle('local-db:list-tables', async () => {
  return new Promise((resolve, reject) => {
    if (!localDB || !duckdb) {
      reject(new Error('Local database not available. DuckDB is not installed or not initialized.'))
      return
    }
    
    localDB.all("SHOW TABLES", (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows.map(row => row.name))
      }
    })
  })
})

// Save report locally
ipcMain.handle('local-db:save-report', async (event, reportData) => {
  try {
    const reportsDir = path.join(app.getPath('userData'), 'reports')
    await fs.mkdir(reportsDir, { recursive: true })
    
    const reportPath = path.join(reportsDir, `${reportData.id || Date.now()}.rptx`)
    
    // Compress and save (simple JSON for now, can add compression later)
    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2), 'utf-8')
    
    return { success: true, path: reportPath }
  } catch (error) {
    console.error('Error saving report:', error)
    throw error
  }
})

// Load report from local storage
ipcMain.handle('local-db:load-report', async (event, reportId) => {
  try {
    const reportsDir = path.join(app.getPath('userData'), 'reports')
    const reportPath = path.join(reportsDir, `${reportId}.rptx`)
    
    const data = await fs.readFile(reportPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading report:', error)
    throw error
  }
})

// List all saved reports
ipcMain.handle('local-db:list-reports', async () => {
  try {
    const reportsDir = path.join(app.getPath('userData'), 'reports')
    await fs.mkdir(reportsDir, { recursive: true })
    
    const files = await fs.readdir(reportsDir)
    const reports = []
    
    for (const file of files) {
      if (file.endsWith('.rptx')) {
        try {
          const data = await fs.readFile(path.join(reportsDir, file), 'utf-8')
          const report = JSON.parse(data)
          reports.push({
            id: report.id || path.basename(file, '.rptx'),
            name: report.metadata?.name || file,
            created: report.metadata?.created || new Date(),
            modified: report.metadata?.modified || new Date()
          })
        } catch (e) {
          console.error(`Error reading report ${file}:`, e)
        }
      }
    }
    
    return reports.sort((a, b) => 
      new Date(b.modified).getTime() - new Date(a.modified).getTime()
    )
  } catch (error) {
    console.error('Error listing reports:', error)
    return []
  }
})

// Get app path
ipcMain.handle('app:get-path', async (event, name) => {
  return app.getPath(name || 'userData')
})

// Check online status
ipcMain.handle('app:is-online', async () => {
  // In Electron main process, we need to check differently
  try {
    const { net } = require('electron')
    return net.isOnline()
  } catch (error) {
    // Fallback
    return true
  }
})

// Sync to cloud (when online) - DISABLED: Reporting Studio removed
ipcMain.handle('sync:to-cloud', async (event, data) => {
  throw new Error('Sync functionality requires Reporting Studio, which has been removed.')
})

// Sync from cloud - DISABLED: Reporting Studio removed
ipcMain.handle('sync:from-cloud', async () => {
  throw new Error('Sync functionality requires Reporting Studio, which has been removed.')
})

