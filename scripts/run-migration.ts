/**
 * Run the allowedSections migration
 * Usage: npx tsx scripts/run-migration.ts
 * 
 * This script uses pg directly to avoid Prisma client dependency issues
 */

import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'

// Load environment variables from .env file
config()

async function runMigration() {
  let pool: Pool | null = null
  
  try {
    console.log('🚀 Starting migration: Add allowedSections fields...')
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.')
    }
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
    
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'scripts', 'add-allowed-sections-migration.sql')
    const sql = readFileSync(sqlPath, 'utf-8')
    
    // Split by semicolons and execute each statement
    // Handle multi-line statements properly
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    const client = await pool.connect()
    
    try {
      for (const statement of statements) {
        if (statement && statement.length > 0) {
          const preview = statement.replace(/\s+/g, ' ').substring(0, 60)
          console.log(`Executing: ${preview}...`)
          try {
            await client.query(statement)
            console.log('   ✓ Success')
          } catch (err: any) {
            // If column already exists, that's fine (idempotent)
            if (err.code === '42701') {
              console.log('   ✓ Column already exists (skipping)')
            } 
            // If table doesn't exist, that's okay - user might need to run Prisma migrations first
            else if (err.code === '42P01') {
              console.log(`   ⚠️  Table doesn't exist yet. You may need to run Prisma migrations first.`)
              console.log(`   Error: ${err.message}`)
              // Continue with other statements
            } else {
              console.error(`   ❌ Error: ${err.message}`)
              throw err
            }
          }
        }
      }
      
      console.log('✅ Migration completed successfully!')
      
      // Verify
      const userResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'allowedSections'
      `)
      
      const invitationResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'TenantInvitation' AND column_name = 'allowedSections'
      `)
      
      if (userResult.rows.length > 0 && invitationResult.rows.length > 0) {
        console.log('✅ Verification: Columns added successfully!')
        console.log('   - User.allowedSections: ✓')
        console.log('   - TenantInvitation.allowedSections: ✓')
      } else {
        console.warn('⚠️  Warning: Could not verify columns. Please check manually.')
      }
      
    } finally {
      client.release()
    }
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    if (error.code === '42701') {
      console.log('💡 Column already exists. That\'s okay! Migration is idempotent.')
    } else {
      console.error('Error details:', error)
      process.exit(1)
    }
  } finally {
    if (pool) {
      await pool.end()
    }
  }
}

runMigration()
