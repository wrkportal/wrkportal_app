const { contextBridge, ipcRenderer } = require('electron')

// Expose safe API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Local database operations
  queryLocalDB: (query, params = []) => 
    ipcRenderer.invoke('local-db:query', query, params),
  
  loadFile: (filePath, tableName) => 
    ipcRenderer.invoke('local-db:load-file', filePath, tableName),
  
  getSchema: (tableName) => 
    ipcRenderer.invoke('local-db:get-schema', tableName),
  
  listTables: () => 
    ipcRenderer.invoke('local-db:list-tables'),
  
  // Report operations
  saveReport: (reportData) => 
    ipcRenderer.invoke('local-db:save-report', reportData),
  
  loadReport: (reportId) => 
    ipcRenderer.invoke('local-db:load-report', reportId),
  
  listReports: () => 
    ipcRenderer.invoke('local-db:list-reports'),
  
  // System info
  getAppPath: (name) => 
    ipcRenderer.invoke('app:get-path', name),
  
  isOnline: () => 
    ipcRenderer.invoke('app:is-online'),
  
  // Sync operations
  syncToCloud: (data) => 
    ipcRenderer.invoke('sync:to-cloud', data),
  
  syncFromCloud: () => 
    ipcRenderer.invoke('sync:from-cloud'),
  
  // Platform detection
  platform: process.platform,
  isElectron: true
})

// Also expose a flag for React components to detect Electron
window.isElectron = true

