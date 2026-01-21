/**
 * Script to check if database tables exist
 * Run with: npx tsx scripts/check-database-tables.ts
 */

import { prisma } from '../lib/prisma'

async function checkTables() {
  try {
    console.log('Checking database tables...\n')

    // Try to query the User table
    try {
      const userCount = await prisma.user.count()
      console.log('✅ User table exists')
      console.log(`   Found ${userCount} users\n`)
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.log('❌ User table does NOT exist')
        console.log('   Error:', error.message)
      } else {
        throw error
      }
    }

    // Try to query the Tenant table
    try {
      const tenantCount = await prisma.tenant.count()
      console.log('✅ Tenant table exists')
      console.log(`   Found ${tenantCount} tenants\n`)
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.log('❌ Tenant table does NOT exist')
        console.log('   Error:', error.message)
      } else {
        throw error
      }
    }

    // Check migration status
    try {
      const result = await prisma.$queryRaw`
        SELECT migration_name, finished_at 
        FROM "_prisma_migrations" 
        ORDER BY finished_at DESC 
        LIMIT 5
      `
      console.log('📋 Recent migrations:')
      console.log(JSON.stringify(result, null, 2))
    } catch (error: any) {
      console.log('⚠️  Could not check migration status:', error.message)
    }

  } catch (error: any) {
    console.error('❌ Error checking database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkTables()
