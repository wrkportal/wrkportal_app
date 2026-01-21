/**
 * Quick test to verify User table exists and is accessible
 * Run with: npx tsx scripts/test-user-table.ts
 */

import { prisma } from '../lib/prisma'

async function testUserTable() {
  try {
    console.log('Testing User table access...\n')
    
    // Try to count users
    const count = await prisma.user.count()
    console.log(`✅ SUCCESS! User table exists and is accessible`)
    console.log(`   Current user count: ${count}\n`)
    
    // Try to query tenants
    const tenantCount = await prisma.tenant.count()
    console.log(`✅ Tenant table is also accessible`)
    console.log(`   Current tenant count: ${tenantCount}\n`)
    
    console.log('🎉 All tables are working! Google OAuth should work now.')
    
  } catch (error: any) {
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.error('❌ ERROR: User table still does not exist')
      console.error('   Error:', error.message)
      process.exit(1)
    } else {
      console.error('❌ ERROR:', error.message)
      process.exit(1)
    }
  } finally {
    await prisma.$disconnect()
  }
}

testUserTable()
