/**
 * Run the allowedSections migration
 * Usage: npx tsx scripts/run-migration.ts
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function runMigration() {
  try {
    console.log('🚀 Starting migration: Add allowedSections fields...')
    
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'scripts', 'add-allowed-sections-migration.sql')
    const sql = readFileSync(sqlPath, 'utf-8')
    
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      if (statement) {
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        await prisma.$executeRawUnsafe(statement)
      }
    }
    
    console.log('✅ Migration completed successfully!')
    
    // Verify
    const userColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' AND column_name = 'allowedSections'
    `
    
    const invitationColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'TenantInvitation' AND column_name = 'allowedSections'
    `
    
    if (userColumns.length > 0 && invitationColumns.length > 0) {
      console.log('✅ Verification: Columns added successfully!')
    } else {
      console.warn('⚠️  Warning: Could not verify columns. Please check manually.')
    }
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    if (error.code === 'P2022') {
      console.log('💡 This might mean the columns already exist. That\'s okay!')
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runMigration()
