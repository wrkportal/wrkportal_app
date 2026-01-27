/**
 * Script to compare Prisma schema with actual database columns
 * Run with: npx tsx scripts/check-prisma-schema-columns.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkColumns() {
  try {
    console.log('🔍 Checking database columns...\n')

    // Check User table
    console.log('📋 User table columns:')
    try {
      const userColumns = await prisma.$queryRaw<Array<{ column_name: string; data_type: string }>>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'User'
        ORDER BY ordinal_position
      `
      console.log(userColumns.map(c => `  - ${c.column_name} (${c.data_type})`).join('\n'))
      
      // Check for critical columns
      const hasGroupRole = userColumns.some(c => c.column_name === 'groupRole')
      console.log(`\n  ✅ groupRole column: ${hasGroupRole ? 'EXISTS' : '❌ MISSING'}`)
    } catch (error: any) {
      console.error('  ❌ Error checking User table:', error.message)
    }

    // Check Tenant table
    console.log('\n📋 Tenant table columns:')
    try {
      const tenantColumns = await prisma.$queryRaw<Array<{ column_name: string; data_type: string }>>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'Tenant'
        ORDER BY ordinal_position
      `
      console.log(tenantColumns.map(c => `  - ${c.column_name} (${c.data_type})`).join('\n'))
      
      // Check for critical columns
      const hasType = tenantColumns.some(c => c.column_name === 'type')
      console.log(`\n  ✅ type column: ${hasType ? 'EXISTS' : '❌ MISSING'}`)
    } catch (error: any) {
      console.error('  ❌ Error checking Tenant table:', error.message)
    }

    // Check TenantInvitation table
    console.log('\n📋 TenantInvitation table:')
    try {
      const invitationTable = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' 
          AND table_name = 'TenantInvitation'
      `
      
      if (invitationTable.length > 0) {
        console.log('  ✅ TenantInvitation table EXISTS')
        const invitationColumns = await prisma.$queryRaw<Array<{ column_name: string; data_type: string }>>`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public' 
            AND table_name = 'TenantInvitation'
          ORDER BY ordinal_position
        `
        console.log(invitationColumns.map(c => `  - ${c.column_name} (${c.data_type})`).join('\n'))
      } else {
        console.log('  ❌ TenantInvitation table MISSING')
      }
    } catch (error: any) {
      console.error('  ❌ Error checking TenantInvitation table:', error.message)
    }

    console.log('\n✅ Column check complete!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkColumns()
