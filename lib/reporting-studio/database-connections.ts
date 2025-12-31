// Database connection utilities for Reporting Studio

import { DataSourceType, DataSourceProvider } from '@/types/reporting-studio'

export interface DatabaseConnectionConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl?: boolean
  connectionString?: string
  options?: Record<string, any>
}

export interface ConnectionTestResult {
  success: boolean
  message: string
  latency?: number
  error?: string
}

export interface DatabaseTable {
  name: string
  schema?: string
  type: 'table' | 'view'
  rowCount?: number
}

export interface DatabaseColumn {
  name: string
  type: string
  nullable: boolean
  primaryKey: boolean
  defaultValue?: any
}

/**
 * Test database connection based on type and config
 */
export async function testDatabaseConnection(
  type: DataSourceType,
  provider: DataSourceProvider,
  config: DatabaseConnectionConfig
): Promise<ConnectionTestResult> {
  const startTime = Date.now()

  try {
    switch (type) {
      case 'DATABASE':
        return await testSQLDatabase(provider, config, startTime)
      case 'API':
        return await testAPIConnection(config)
      case 'FILE':
        return { success: true, message: 'File connection validated', latency: 0 }
      default:
        return { success: false, message: `Unsupported data source type: ${type}` }
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Connection test failed',
      error: error.message,
      latency: Date.now() - startTime,
    }
  }
}

/**
 * Test SQL database connection (PostgreSQL, MySQL, SQL Server)
 */
async function testSQLDatabase(
  provider: DataSourceProvider,
  config: DatabaseConnectionConfig,
  startTime: number
): Promise<ConnectionTestResult> {
  try {
    switch (provider) {
      case 'POSTGRESQL':
        return await testPostgreSQL(config, startTime)
      case 'MYSQL':
        return await testMySQL(config, startTime)
      case 'SQLSERVER':
        return await testSQLServer(config, startTime)
      case 'MONGODB':
        return await testMongoDB(config, startTime)
      default:
        return { success: false, message: `Unsupported database provider: ${provider}` }
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Database connection failed',
      error: error.message,
      latency: Date.now() - startTime,
    }
  }
}

/**
 * Test PostgreSQL connection
 */
async function testPostgreSQL(
  config: DatabaseConnectionConfig,
  startTime: number
): Promise<ConnectionTestResult> {
  try {
    // Dynamic import to avoid loading in environments without pg installed
    const { Client } = await import('pg')

    const client = new Client({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
    })

    await client.connect()
    const result = await client.query('SELECT NOW()')
    await client.end()

    return {
      success: true,
      message: 'PostgreSQL connection successful',
      latency: Date.now() - startTime,
    }
  } catch (error: any) {
    return {
      success: false,
      message: `PostgreSQL connection failed: ${error.message}`,
      error: error.message,
      latency: Date.now() - startTime,
    }
  }
}

/**
 * Test MySQL connection
 */
async function testMySQL(
  config: DatabaseConnectionConfig,
  startTime: number
): Promise<ConnectionTestResult> {
  try {
    // Dynamic import to avoid loading in environments without mysql2 installed
    const mysql = await import('mysql2/promise')

    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? {} : false,
    })

    await connection.query('SELECT 1')
    await connection.end()

    return {
      success: true,
      message: 'MySQL connection successful',
      latency: Date.now() - startTime,
    }
  } catch (error: any) {
    // If mysql2 is not installed, return a helpful error
    if (error.code === 'MODULE_NOT_FOUND') {
      return {
        success: false,
        message: 'MySQL driver not installed. Run: npm install mysql2',
        error: 'MODULE_NOT_FOUND',
        latency: Date.now() - startTime,
      }
    }

    return {
      success: false,
      message: `MySQL connection failed: ${error.message}`,
      error: error.message,
      latency: Date.now() - startTime,
    }
  }
}

/**
 * Test SQL Server connection
 */
async function testSQLServer(
  config: DatabaseConnectionConfig,
  startTime: number
): Promise<ConnectionTestResult> {
  try {
    // Dynamic import to avoid loading in environments without mssql installed
    const sql = await import('mssql')

    const pool = await sql.connect({
      server: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      options: {
        encrypt: config.ssl || false,
        trustServerCertificate: !config.ssl,
        ...config.options,
      },
    })

    await pool.request().query('SELECT 1')
    await pool.close()

    return {
      success: true,
      message: 'SQL Server connection successful',
      latency: Date.now() - startTime,
    }
  } catch (error: any) {
    // If mssql is not installed, return a helpful error
    if (error.code === 'MODULE_NOT_FOUND') {
      return {
        success: false,
        message: 'SQL Server driver not installed. Run: npm install mssql',
        error: 'MODULE_NOT_FOUND',
        latency: Date.now() - startTime,
      }
    }

    return {
      success: false,
      message: `SQL Server connection failed: ${error.message}`,
      error: error.message,
      latency: Date.now() - startTime,
    }
  }
}

/**
 * Test MongoDB connection
 */
async function testMongoDB(
  config: DatabaseConnectionConfig,
  startTime: number
): Promise<ConnectionTestResult> {
  try {
    // Dynamic import - mongodb is externalized in webpack config
    // This won't fail the build, but will fail at runtime if mongodb is not installed
    const { MongoClient } = await import('mongodb')

    const connectionString =
      config.connectionString ||
      `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`

    const client = new MongoClient(connectionString, {
      ...config.options,
    })

    await client.connect()
    await client.db(config.database).admin().ping()
    await client.close()

    return {
      success: true,
      message: 'MongoDB connection successful',
      latency: Date.now() - startTime,
    }
  } catch (error: any) {
    // If mongodb is not installed, return a helpful error
    if (error.code === 'MODULE_NOT_FOUND' ||
        error.message?.includes('Cannot find module') ||
        error.message?.includes('mongodb') ||
        error.message?.includes('Failed to fetch dynamically imported module')) {
      return {
        success: false,
        message: 'MongoDB driver not installed. Run: npm install mongodb',
        error: 'MODULE_NOT_FOUND',
        latency: Date.now() - startTime,
      }
    }

    return {
      success: false,
      message: `MongoDB connection failed: ${error.message}`,
      error: error.message,
      latency: Date.now() - startTime,
    }
  }
}

/**
 * Test API connection
 */
async function testAPIConnection(config: DatabaseConnectionConfig): Promise<ConnectionTestResult> {
  try {
    const url = config.connectionString || `https://${config.host}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`,
        ...config.options,
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (response.ok) {
      return {
        success: true,
        message: 'API connection successful',
      }
    } else {
      return {
        success: false,
        message: `API connection failed: ${response.status} ${response.statusText}`,
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: `API connection failed: ${error.message}`,
      error: error.message,
    }
  }
}

/**
 * List tables/views from a database
 */
export async function listDatabaseTables(
  provider: DataSourceProvider,
  config: DatabaseConnectionConfig
): Promise<DatabaseTable[]> {
  switch (provider) {
    case 'POSTGRESQL':
      return await listPostgreSQLTables(config)
    case 'MYSQL':
      return await listMySQLTables(config)
    case 'SQLSERVER':
      return await listSQLServerTables(config)
    case 'MONGODB':
      return await listMongoDBCollections(config)
    default:
      throw new Error(`Unsupported database provider: ${provider}`)
  }
}

/**
 * List PostgreSQL tables and views
 */
async function listPostgreSQLTables(config: DatabaseConnectionConfig): Promise<DatabaseTable[]> {
  const { Client } = await import('pg')

  const client = new Client({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
  })

  try {
    await client.connect()

    const query = `
      SELECT 
        schemaname,
        tablename as name,
        'table' as type,
        (SELECT COUNT(*) FROM information_schema.tables t2 
         WHERE t2.table_schema = t.schemaname AND t2.table_name = t.tablename) as row_count
      FROM pg_tables t
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      UNION ALL
      SELECT 
        schemaname,
        viewname as name,
        'view' as type,
        NULL as row_count
      FROM pg_views
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schemaname, name
    `

    const result = await client.query(query)
    await client.end()

    return result.rows.map((row: any) => ({
      name: row.name,
      schema: row.schemaname,
      type: row.type,
      rowCount: row.row_count || undefined,
    }))
  } catch (error) {
    await client.end()
    throw error
  }
}

/**
 * List MySQL tables and views
 */
async function listMySQLTables(config: DatabaseConnectionConfig): Promise<DatabaseTable[]> {
  const mysql = await import('mysql2/promise')

  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    ssl: config.ssl ? {} : false,
  })

  try {
    const [tables] = await connection.query(`
      SELECT table_name as name, 'table' as type, table_rows as row_count
      FROM information_schema.tables
      WHERE table_schema = ?
      UNION ALL
      SELECT table_name as name, 'view' as type, NULL as row_count
      FROM information_schema.views
      WHERE table_schema = ?
      ORDER BY name
    `, [config.database, config.database])

    await connection.end()

    return (tables as any[]).map((row: any) => ({
      name: row.name,
      type: row.type,
      rowCount: row.row_count || undefined,
    }))
  } catch (error) {
    await connection.end()
    throw error
  }
}

/**
 * List SQL Server tables and views
 */
async function listSQLServerTables(config: DatabaseConnectionConfig): Promise<DatabaseTable[]> {
  const sql = await import('mssql')

  const pool = await sql.connect({
    server: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    options: {
      encrypt: config.ssl || false,
      trustServerCertificate: !config.ssl,
    },
  })

  try {
    const result = await pool.request().query(`
      SELECT 
        TABLE_SCHEMA as schema_name,
        TABLE_NAME as name,
        TABLE_TYPE as type
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE IN ('BASE TABLE', 'VIEW')
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `)

    await pool.close()

    return result.recordset.map((row: any) => ({
      name: row.name,
      schema: row.schema_name,
      type: row.type === 'BASE TABLE' ? 'table' : 'view',
    }))
  } catch (error) {
    await pool.close()
    throw error
  }
}

/**
 * List MongoDB collections
 */
async function listMongoDBCollections(config: DatabaseConnectionConfig): Promise<DatabaseTable[]> {
  try {
    // Dynamic import - mongodb is externalized in webpack config
    // This won't fail the build, but will fail at runtime if mongodb is not installed
    const { MongoClient } = await import('mongodb')

    const connectionString =
      config.connectionString ||
      `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`

    const client = new MongoClient(connectionString)
    await client.connect()

    try {
      const db = client.db(config.database)
      const collections = await db.listCollections().toArray()

      return collections.map((col: any) => ({
        name: col.name,
        type: 'table', // MongoDB collections are treated as tables
      }))
    } finally {
      await client.close()
    }
  } catch (error: any) {
    // If mongodb is not installed, return a helpful error
    if (error.code === 'MODULE_NOT_FOUND' || 
        error.message?.includes('Cannot find module') ||
        error.message?.includes('mongodb') ||
        error.message?.includes('Failed to fetch dynamically imported module')) {
      throw new Error('MongoDB driver not installed. Run: npm install mongodb')
    }
    throw error
  }
}

/**
 * Execute a query on a database
 */
export async function executeDatabaseQuery(
  provider: DataSourceProvider,
  config: DatabaseConnectionConfig,
  query: string,
  limit?: number
): Promise<{ columns: string[]; rows: any[]; rowCount: number }> {
  switch (provider) {
    case 'POSTGRESQL':
      return await executePostgreSQLQuery(config, query, limit)
    case 'MYSQL':
      return await executeMySQLQuery(config, query, limit)
    case 'SQLSERVER':
      return await executeSQLServerQuery(config, query, limit)
    default:
      throw new Error(`Query execution not yet implemented for ${provider}`)
  }
}

/**
 * Execute PostgreSQL query
 */
async function executePostgreSQLQuery(
  config: DatabaseConnectionConfig,
  query: string,
  limit?: number
): Promise<{ columns: string[]; rows: any[]; rowCount: number }> {
  const { Client } = await import('pg')

  const client = new Client({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
  })

  try {
    await client.connect()

    // Apply limit if specified (for safety)
    let finalQuery = query
    if (limit && !query.toLowerCase().includes('limit')) {
      finalQuery = `${query} LIMIT ${limit}`
    }

    const result = await client.query(finalQuery)
    await client.end()

    return {
      columns: result.fields.map((f) => f.name),
      rows: result.rows,
      rowCount: result.rowCount,
    }
  } catch (error) {
    await client.end()
    throw error
  }
}

/**
 * Execute MySQL query
 */
async function executeMySQLQuery(
  config: DatabaseConnectionConfig,
  query: string,
  limit?: number
): Promise<{ columns: string[]; rows: any[]; rowCount: number }> {
  const mysql = await import('mysql2/promise')

  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    ssl: config.ssl ? {} : false,
  })

  try {
    // Apply limit if specified
    let finalQuery = query
    if (limit && !query.toLowerCase().includes('limit')) {
      finalQuery = `${query} LIMIT ${limit}`
    }

    const [rows] = await connection.query(finalQuery)

    // Get column names from the first row or from query metadata
    const columns = rows && rows.length > 0 ? Object.keys((rows as any[])[0]) : []

    await connection.end()

    return {
      columns,
      rows: rows as any[],
      rowCount: (rows as any[]).length,
    }
  } catch (error) {
    await connection.end()
    throw error
  }
}

/**
 * Execute SQL Server query
 */
async function executeSQLServerQuery(
  config: DatabaseConnectionConfig,
  query: string,
  limit?: number
): Promise<{ columns: string[]; rows: any[]; rowCount: number }> {
  const sql = await import('mssql')

  const pool = await sql.connect({
    server: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    options: {
      encrypt: config.ssl || false,
      trustServerCertificate: !config.ssl,
    },
  })

  try {
    // Apply TOP limit if specified (SQL Server uses TOP instead of LIMIT)
    let finalQuery = query
    if (limit && !query.toLowerCase().includes('top')) {
      finalQuery = query.replace(/^SELECT\s+/i, `SELECT TOP ${limit} `)
    }

    const result = await pool.request().query(finalQuery)
    await pool.close()

    const columns = result.recordset.columns ? Object.keys(result.recordset.columns) : []

    return {
      columns,
      rows: result.recordset,
      rowCount: result.recordset.length,
    }
  } catch (error) {
    await pool.close()
    throw error
  }
}

