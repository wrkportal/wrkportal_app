// Type declaration for pg module
// @types/pg is installed, this helps TypeScript resolve the module
declare module 'pg' {
  export class Pool {
    constructor(config?: {
      connectionString?: string
      host?: string
      port?: number
      database?: string
      user?: string
      password?: string
      max?: number
      idleTimeoutMillis?: number
      connectionTimeoutMillis?: number
      [key: string]: any
    })
    query(text: string, params?: any[]): Promise<any>
    end(): Promise<void>
    connect(): Promise<any>
    on(event: string, listener: (...args: any[]) => void): void
  }
  
  export interface PoolConfig {
    connectionString?: string
    host?: string
    port?: number
    database?: string
    user?: string
    password?: string
    max?: number
    idleTimeoutMillis?: number
    connectionTimeoutMillis?: number
  }
}
