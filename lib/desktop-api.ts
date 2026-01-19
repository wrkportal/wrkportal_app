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
   * NOTE: Reporting Studio has been removed. This method only works in Electron now.
   */
  async query(query: string, params: any[] = []): Promise<any[]> {
    if (this.isElectron) {
      // Use local DuckDB
      return await (window as any).electronAPI.queryLocalDB(query, params)
    } else {
      throw new Error('Query functionality requires Reporting Studio, which has been removed. Please use Electron version for offline queries.')
    }
  }
  
  /**
   * Load file into database
   * NOTE: Reporting Studio has been removed. This method only works in Electron now.
   */
  async loadFile(filePath: string, tableName?: string): Promise<{ success: boolean; rowCount: number; tableName: string }> {
    if (this.isElectron) {
      return await (window as any).electronAPI.loadFile(filePath, tableName)
    } else {
      throw new Error('File loading requires Reporting Studio, which has been removed. Please use Electron version.')
    }
  }
  
  /**
   * Get table schema
   * NOTE: Reporting Studio has been removed. This method only works in Electron now.
   */
  async getSchema(tableName: string): Promise<any[]> {
    if (this.isElectron) {
      return await (window as any).electronAPI.getSchema(tableName)
    } else {
      throw new Error('Schema access requires Reporting Studio, which has been removed. Please use Electron version.')
    }
  }
  
  /**
   * List all tables
   * NOTE: Reporting Studio has been removed. This method only works in Electron now.
   */
  async listTables(): Promise<string[]> {
    if (this.isElectron) {
      return await (window as any).electronAPI.listTables()
    } else {
      throw new Error('Table listing requires Reporting Studio, which has been removed. Please use Electron version.')
    }
  }
  
  /**
   * Save report
   * NOTE: Reporting Studio has been removed. This method only works in Electron now.
   */
  async saveReport(report: any): Promise<{ success: boolean; path?: string }> {
    if (this.isElectron) {
      return await (window as any).electronAPI.saveReport(report)
    } else {
      throw new Error('Report saving requires Reporting Studio, which has been removed. Please use Electron version.')
    }
  }
  
  /**
   * Load report
   * NOTE: Reporting Studio has been removed. This method only works in Electron now.
   */
  async loadReport(reportId: string): Promise<any> {
    if (this.isElectron) {
      return await (window as any).electronAPI.loadReport(reportId)
    } else {
      throw new Error('Report loading requires Reporting Studio, which has been removed. Please use Electron version.')
    }
  }
  
  /**
   * List all reports
   * NOTE: Reporting Studio has been removed. This method only works in Electron now.
   */
  async listReports(): Promise<any[]> {
    if (this.isElectron) {
      return await (window as any).electronAPI.listReports()
    } else {
      throw new Error('Report listing requires Reporting Studio, which has been removed. Please use Electron version.')
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

