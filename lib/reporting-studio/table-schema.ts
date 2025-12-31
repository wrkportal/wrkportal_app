// Table Schema Utilities for Reporting Studio
// Functions to get detailed table schema including columns

import { DataSourceProvider } from '@/types/reporting-studio'
import { DatabaseConnectionConfig } from './database-connections'

export interface TableColumn {
  name: string
  type: string
  nullable: boolean
  primaryKey: boolean
  defaultValue?: any
  description?: string
}

export interface TableSchema {
  tableName: string
  schema?: string
  columns: TableColumn[]
}

/**
 * Get table schema with columns for a specific table
 */
export async function getTableSchema(
  provider: DataSourceProvider,
  config: DatabaseConnectionConfig,
  tableName: string,
  schema?: string
): Promise<TableSchema> {
  switch (provider) {
    case 'POSTGRESQL':
      return await getPostgreSQLTableSchema(config, tableName, schema)
    case 'MYSQL':
      return await getMySQLTableSchema(config, tableName, schema)
    case 'SQLSERVER':
      return await getSQLServerTableSchema(config, tableName, schema)
    default:
      throw new Error(`Schema retrieval not yet implemented for ${provider}`)
  }
}

/**
 * Get table schemas for multiple tables
 */
export async function getTableSchemas(
  provider: DataSourceProvider,
  config: DatabaseConnectionConfig,
  tableNames: string[]
): Promise<TableSchema[]> {
  const schemas = await Promise.all(
    tableNames.map((tableName) => getTableSchema(provider, config, tableName))
  )
  return schemas
}

/**
 * Get PostgreSQL table schema with columns
 */
async function getPostgreSQLTableSchema(
  config: DatabaseConnectionConfig,
  tableName: string,
  schemaName?: string
): Promise<TableSchema> {
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

    // Determine schema to use
    const searchSchema = schemaName || 'public'

    const query = `
      SELECT 
        c.column_name as name,
        c.data_type as type,
        c.udt_name as pg_type,
        c.is_nullable = 'YES' as nullable,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as primary_key,
        c.column_default as default_value,
        col_description(pgc.oid, c.ordinal_position) as description
      FROM information_schema.columns c
      JOIN pg_class pgc ON pgc.relname = c.table_name
      JOIN pg_namespace pgn ON pgn.oid = pgc.relnamespace AND pgn.nspname = c.table_schema
      LEFT JOIN (
        SELECT ku.table_schema, ku.table_name, ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name
          AND tc.table_schema = ku.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
      ) pk ON pk.table_schema = c.table_schema 
        AND pk.table_name = c.table_name 
        AND pk.column_name = c.column_name
      WHERE c.table_schema = $1 AND c.table_name = $2
      ORDER BY c.ordinal_position
    `

    const result = await client.query(query, [searchSchema, tableName])
    await client.end()

    const columns: TableColumn[] = result.rows.map((row: any) => ({
      name: row.name,
      type: row.pg_type || row.type, // Use PostgreSQL-specific type if available
      nullable: row.nullable,
      primaryKey: row.primary_key,
      defaultValue: row.default_value,
      description: row.description,
    }))

    return {
      tableName,
      schema: searchSchema,
      columns,
    }
  } catch (error) {
    await client.end()
    throw error
  }
}

/**
 * Get MySQL table schema with columns
 */
async function getMySQLTableSchema(
  config: DatabaseConnectionConfig,
  tableName: string,
  schemaName?: string
): Promise<TableSchema> {
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
    const schema = schemaName || config.database

    const query = `
      SELECT 
        c.column_name as name,
        c.data_type as type,
        c.is_nullable = 'YES' as nullable,
        CASE WHEN kcu.column_name IS NOT NULL THEN true ELSE false END as primary_key,
        c.column_default as default_value,
        c.column_comment as description
      FROM information_schema.columns c
      LEFT JOIN information_schema.key_column_usage kcu
        ON kcu.table_schema = c.table_schema
        AND kcu.table_name = c.table_name
        AND kcu.column_name = c.column_name
        AND kcu.constraint_name = 'PRIMARY'
      WHERE c.table_schema = ? AND c.table_name = ?
      ORDER BY c.ordinal_position
    `

    const [rows] = await connection.query(query, [schema, tableName])
    await connection.end()

    const columns: TableColumn[] = (rows as any[]).map((row: any) => ({
      name: row.name,
      type: row.type,
      nullable: row.nullable,
      primaryKey: row.primary_key,
      defaultValue: row.default_value,
      description: row.description,
    }))

    return {
      tableName,
      schema,
      columns,
    }
  } catch (error) {
    await connection.end()
    throw error
  }
}

/**
 * Get SQL Server table schema with columns
 */
async function getSQLServerTableSchema(
  config: DatabaseConnectionConfig,
  tableName: string,
  schemaName?: string
): Promise<TableSchema> {
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
    const schema = schemaName || 'dbo'

    const query = `
      SELECT 
        c.COLUMN_NAME as name,
        c.DATA_TYPE as type,
        c.IS_NULLABLE = 'YES' as nullable,
        CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as primary_key,
        c.COLUMN_DEFAULT as default_value,
        ep.value as description
      FROM INFORMATION_SCHEMA.COLUMNS c
      LEFT JOIN (
        SELECT ku.TABLE_SCHEMA, ku.TABLE_NAME, ku.COLUMN_NAME
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
          ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
        WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
      ) pk ON pk.TABLE_SCHEMA = c.TABLE_SCHEMA
        AND pk.TABLE_NAME = c.TABLE_NAME
        AND pk.COLUMN_NAME = c.COLUMN_NAME
      LEFT JOIN sys.extended_properties ep
        ON ep.major_id = OBJECT_ID(QUOTENAME(c.TABLE_SCHEMA) + '.' + QUOTENAME(c.TABLE_NAME))
        AND ep.minor_id = c.ORDINAL_POSITION
        AND ep.name = 'MS_Description'
      WHERE c.TABLE_SCHEMA = @schema AND c.TABLE_NAME = @tableName
      ORDER BY c.ORDINAL_POSITION
    `

    const result = await pool
      .request()
      .input('schema', sql.VarChar, schema)
      .input('tableName', sql.VarChar, tableName)
      .query(query)

    await pool.close()

    const columns: TableColumn[] = result.recordset.map((row: any) => ({
      name: row.name,
      type: row.type,
      nullable: row.nullable,
      primaryKey: row.primary_key === 1,
      defaultValue: row.default_value,
      description: row.description,
    }))

    return {
      tableName,
      schema,
      columns,
    }
  } catch (error) {
    await pool.close()
    throw error
  }
}

