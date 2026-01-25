/**
 * Verify database connection and check if User table exists
 * Run with: npx tsx scripts/verify-database-connection.ts
 */

import { prisma } from '../lib/prisma'

async function verifyConnection() {
  try {
    console.log('🔍 Verifying database connection...\n')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✅' : 'Missing ❌')
    console.log('')

    // Test connection
    await prisma.$connect()
    console.log('✅ Prisma connection successful\n')

    // Try to query User table
    try {
      const userCount = await prisma.user.count()
      console.log(`✅ User table EXISTS and is accessible`)
      console.log(`   User count: ${userCount}\n`)
    } catch (error: any) {
      if (error.code === 'P2021') {
        console.error('❌ User table does NOT exist')
        console.error('   Error code:', error.code)
        console.error('   Error message:', error.message)
        console.error('')
        console.error('💡 Possible causes:')
        console.error('   1. DATABASE_URL points to wrong database')
        console.error('   2. Table created in different schema')
        console.error('   3. Connection string mismatch')
      } else {
        throw error
      }
    }

    // Try raw SQL query to check if table exists
    try {
      const result = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      `
      console.log('📋 Raw SQL check result:', result)
    } catch (error: any) {
      console.error('⚠️  Could not check with raw SQL:', error.message)
    }

    // Check all tables in public schema
    try {
      const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `
      console.log('\n📋 All tables in public schema:')
      tables.forEach((t: { table_name: string }) => console.log(`   - ${t.table_name}`))
    } catch (error: any) {
      console.error('⚠️  Could not list tables:', error.message)
    }

  } catch (error: any) {
    console.error('❌ Connection error:', error.message)
    console.error('   Code:', error.code)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyConnection()
