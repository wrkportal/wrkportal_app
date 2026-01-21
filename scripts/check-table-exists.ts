/**
 * Check if User table exists and verify connection
 * Run with: npx tsx scripts/check-table-exists.ts
 */

import { prisma } from '../lib/prisma'

async function checkTable() {
  try {
    console.log('🔍 Checking database connection and tables...\n')
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...')
    console.log('')

    // Test raw SQL query to check table
    console.log('1. Checking if User table exists (raw SQL)...')
    try {
      const result = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      `
      
      if (result.length > 0) {
        console.log('   ✅ Found table:', result[0].table_name)
      } else {
        console.log('   ❌ User table not found with exact case')
        
        // Check with case-insensitive
        const result2 = await prisma.$queryRaw<Array<{ table_name: string }>>`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND LOWER(table_name) = 'user'
        `
        if (result2.length > 0) {
          console.log('   ⚠️  Found table with different case:', result2[0].table_name)
          console.log('   💡 This might be a case-sensitivity issue')
        }
      }
    } catch (error: any) {
      console.error('   ❌ Error checking table:', error.message)
    }

    console.log('\n2. Listing all tables in public schema...')
    try {
      const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `
      console.log(`   Found ${tables.length} tables:`)
      tables.slice(0, 20).forEach(t => console.log(`   - ${t.table_name}`))
      if (tables.length > 20) {
        console.log(`   ... and ${tables.length - 20} more`)
      }
    } catch (error: any) {
      console.error('   ❌ Error listing tables:', error.message)
    }

    console.log('\n3. Testing Prisma User model...')
    try {
      const count = await prisma.user.count()
      console.log(`   ✅ SUCCESS! User table is accessible via Prisma`)
      console.log(`   User count: ${count}`)
    } catch (error: any) {
      console.error('   ❌ Error accessing User table:', error.message)
      console.error('   Error code:', error.code)
      if (error.code === 'P2021') {
        console.error('   💡 This means the table does not exist from Prisma\'s perspective')
      }
    }

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message)
    console.error('   Code:', error.code)
  } finally {
    await prisma.$disconnect()
  }
}

checkTable()
