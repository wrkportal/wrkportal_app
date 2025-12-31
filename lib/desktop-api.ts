/**
 * Desktop API Wrapper
 * 
 * Provides unified API for both web and desktop (Electron) environments.
 * Automatically detects environment and uses appropriate backend.
 */

export class DesktopAPI {
  private isElectron: boolean
  
  constructor() {
    // Check if running in Electron
    this.isElectron = typeof window !== 'undefined' && 
                      'electronAPI' in window &&
                      (window as any).isElectron === true
  }
  
  /**
   * Query data (works offline in Electron, online in web)
   */
  async query(query: string, params: any[] = []): Promise<any[]> {
    if (this.isElectron) {
      // Use local DuckDB
      return await (window as any).electronAPI.queryLocalDB(query, params)
    } else {
      // Use web API (server-side DuckDB)
      const response = await fetch('/api/reporting-studio/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, params })
      })
      
      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`)
      }
      
      const result = await response.json()
      return result.data || []
    }
  }
  
  /**
   * Load file into database
   */
  async loadFile(filePath: string, tableName?: string): Promise<{ success: boolean; rowCount: number; tableName: string }> {
    if (this.isElectron) {
      return await (window as any).electronAPI.loadFile(filePath, tableName)
    } else {
      // Web: upload file first
      const formData = new FormData()
      // Note: In web, filePath should be a File object
      if (filePath instanceof File) {
        formData.append('file', filePath)
      } else {
        throw new Error('Web version requires File object, not file path')
      }
      
      const response = await fetch('/api/reporting-studio/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }
      
      return await response.json()
    }
  }
  
  /**
   * Get table schema
   */
  async getSchema(tableName: string): Promise<any[]> {
    if (this.isElectron) {
      return await (window as any).electronAPI.getSchema(tableName)
    } else {
      const response = await fetch(`/api/reporting-studio/schema?table=${tableName}`)
      if (!response.ok) {
        throw new Error(`Schema fetch failed: ${response.statusText}`)
      }
      const result = await response.json()
      return result.schema || []
    }
  }
  
  /**
   * List all tables
   */
  async listTables(): Promise<string[]> {
    if (this.isElectron) {
      return await (window as any).electronAPI.listTables()
    } else {
      const response = await fetch('/api/reporting-studio/tables')
      if (!response.ok) {
        throw new Error(`Tables fetch failed: ${response.statusText}`)
      }
      const result = await response.json()
      return result.tables || []
    }
  }
  
  /**
   * Save report
   */
  async saveReport(report: any): Promise<{ success: boolean; path?: string }> {
    if (this.isElectron) {
      return await (window as any).electronAPI.saveReport(report)
    } else {
      const response = await fetch('/api/reporting-studio/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      })
      
      if (!response.ok) {
        throw new Error(`Save failed: ${response.statusText}`)
      }
      
      return await response.json()
    }
  }
  
  /**
   * Load report
   */
  async loadReport(reportId: string): Promise<any> {
    if (this.isElectron) {
      return await (window as any).electronAPI.loadReport(reportId)
    } else {
      const response = await fetch(`/api/reporting-studio/reports/${reportId}`)
      if (!response.ok) {
        throw new Error(`Load failed: ${response.statusText}`)
      }
      return await response.json()
    }
  }
  
  /**
   * List all reports
   */
  async listReports(): Promise<any[]> {
    if (this.isElectron) {
      return await (window as any).electronAPI.listReports()
    } else {
      const response = await fetch('/api/reporting-studio/reports')
      if (!response.ok) {
        throw new Error(`List failed: ${response.statusText}`)
      }
      const result = await response.json()
      return result.reports || []
    }
  }
  
  /**
   * Sync to cloud (when online)
   */
  async syncToCloud(data: any): Promise<any> {
    if (!this.isElectron) {
      // Web is always "synced" (data is in cloud)
      return { success: true }
    }
    
    const isOnline = await (window as any).electronAPI.isOnline()
    if (!isOnline) {
      throw new Error('Need internet connection to sync')
    }
    
    return await (window as any).electronAPI.syncToCloud(data)
  }
  
  /**
   * Sync from cloud
   */
  async syncFromCloud(): Promise<any> {
    if (!this.isElectron) {
      // Web doesn't need sync
      return { success: true }
    }
    
    return await (window as any).electronAPI.syncFromCloud()
  }
  
  /**
   * Check if online
   */
  async isOnline(): Promise<boolean> {
    if (this.isElectron) {
      return await (window as any).electronAPI.isOnline()
    } else {
      return navigator.onLine
    }
  }
  
  /**
   * Get environment info
   */
  getEnvironment(): 'electron' | 'web' {
    return this.isElectron ? 'electron' : 'web'
  }
}

// Export singleton instance
export const desktopAPI = new DesktopAPI()

