import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple database connectivity test
export async function GET(req: NextRequest) {
  try {
    // Test 1: Basic connection
    await prisma.$queryRaw`SELECT 1 as test`
    console.log('[DB Test] ✅ Basic connection works')

    // Test 2: Check if User table exists
    const userCount = await prisma.user.count()
    console.log('[DB Test] ✅ User table exists, count:', userCount)

    // Test 3: Check if Tenant table exists
    const tenantCount = await prisma.tenant.count()
    console.log('[DB Test] ✅ Tenant table exists, count:', tenantCount)

    // Test 4: Try to create a test tenant (then delete it)
    const testDomain = `test-${Date.now()}@test.com`.split('@')[1]
    const testTenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        domain: testDomain,
      },
    })
    console.log('[DB Test] ✅ Can create tenant:', testTenant.id)

    // Clean up
    await prisma.tenant.delete({
      where: { id: testTenant.id },
    })
    console.log('[DB Test] ✅ Can delete tenant')

    return NextResponse.json({
      status: 'success',
      message: 'All database tests passed',
      userCount,
      tenantCount,
    })
  } catch (error: any) {
    console.error('[DB Test] ❌ Error:', {
      message: error.message,
      code: error.code,
      name: error.name,
    })
    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
        code: error.code,
      },
      { status: 500 }
    )
  }
}
