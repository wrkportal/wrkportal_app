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
      // Add allowedSections to User table
      await prisma.$executeRaw`
        ALTER TABLE "User" 
        ADD COLUMN IF NOT EXISTS "allowedSections" TEXT;
      `

      // Add allowedSections to TenantInvitation table
      await prisma.$executeRaw`
        ALTER TABLE "TenantInvitation" 
        ADD COLUMN IF NOT EXISTS "allowedSections" TEXT;
      `

      return NextResponse.json({ 
        success: true,
        message: 'Migration completed successfully' 
      })
    } catch (error: any) {
      // If columns already exist, that's fine
      if (error.message?.includes('already exists') || error.code === '42701') {
        return NextResponse.json({ 
          success: true,
          message: 'Columns already exist' 
        })
      }
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
