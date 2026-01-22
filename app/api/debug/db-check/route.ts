import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Diagnostic endpoint to check database connection and verify user creation
export async function GET(req: NextRequest) {
  try {
    // Get database connection info (masked)
    const dbUrl = process.env.DATABASE_URL
    const dbInfo = dbUrl 
      ? {
          host: dbUrl.split('@')[1]?.split('/')[0] || 'unknown',
          database: dbUrl.split('/').pop()?.split('?')[0] || 'unknown',
          hasUrl: true,
        }
      : { hasUrl: false }
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1 as test`
    
    // Get user count
    const userCount = await prisma.user.count()
    
    // Get recent users (last 5)
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        tenantId: true,
      },
    })
    
    // Get tenant count
    const tenantCount = await prisma.tenant.count()
    
    // Get recent tenants
    const recentTenants = await prisma.tenant.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        domain: true,
        createdAt: true,
      },
    })
    
    return NextResponse.json({
      status: 'connected',
      database: dbInfo,
      stats: {
        userCount,
        tenantCount,
      },
      recentUsers,
      recentTenants,
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}
