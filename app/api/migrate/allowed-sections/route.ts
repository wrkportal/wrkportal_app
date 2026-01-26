import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// This endpoint runs the allowedSections migration
// Only accessible to platform owners/admins
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is platform owner/admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || (user.role !== 'PLATFORM_OWNER' && user.role !== 'ORG_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Run migration
    try {
      const results: string[] = []

      // Add allowedSections to User table
      try {
        await prisma.$executeRaw`
          ALTER TABLE "User" 
          ADD COLUMN IF NOT EXISTS "allowedSections" TEXT;
        `
        results.push('✅ User.allowedSections column added')
      } catch (error: any) {
        if (error.message?.includes('already exists') || error.code === '42701') {
          results.push('ℹ️ User.allowedSections column already exists')
        } else {
          throw error
        }
      }

      // Check if TenantInvitation table exists and add column
      // Prisma might use different table name, so we'll check common variations
      const tableVariations = ['TenantInvitation', 'tenant_invitation', 'tenantInvitation']
      let tenantInvitationUpdated = false

      for (const tableName of tableVariations) {
        try {
          // Check if table exists by querying information_schema
          const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
            SELECT EXISTS (
              SELECT 1 
              FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = ${tableName}
            ) AS exists
          `

          if (tableExists && tableExists.length > 0 && tableExists[0]?.exists) {
            await prisma.$executeRawUnsafe(`
              ALTER TABLE "${tableName}" 
              ADD COLUMN IF NOT EXISTS "allowedSections" TEXT;
            `)
            results.push(`✅ ${tableName}.allowedSections column added`)
            tenantInvitationUpdated = true
            break
          }
        } catch (error: any) {
          // If column already exists, that's fine
          if (error.message?.includes('already exists') || error.code === '42701') {
            results.push(`ℹ️ ${tableName}.allowedSections column already exists`)
            tenantInvitationUpdated = true
            break
          }
          // If table doesn't exist, continue to next variation
          if (error.message?.includes('does not exist') || error.code === '42P01') {
            continue
          }
          // Other errors, log but continue
          console.warn(`[Migration] Error checking ${tableName}:`, error.message)
        }
      }

      if (!tenantInvitationUpdated) {
        results.push('⚠️ TenantInvitation table not found - skipping (table may not exist yet)')
      }

      return NextResponse.json({ 
        success: true,
        message: 'Migration completed',
        details: results
      })
    } catch (error: any) {
      throw error
    }
  } catch (error: any) {
    console.error('[Migration] Error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    )
  }
}
