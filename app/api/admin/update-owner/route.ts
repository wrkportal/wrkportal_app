import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Temporary endpoint to update platform owner role
// DELETE THIS FILE AFTER RUNNING ONCE!

export async function POST(req: NextRequest) {
  try {
    // Add a secret key for security
    const { secret } = await req.json()

    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Updating production user role to PLATFORM_OWNER...')

    const result = await prisma.user.updateMany({
      where: {
        email: 'sandeep200680@gmail.com',
      },
      data: {
        role: 'PLATFORM_OWNER',
      },
    })

    console.log(`✅ Updated ${result.count} user(s)`)

    const user = await prisma.user.findUnique({
      where: { email: 'sandeep200680@gmail.com' },
      select: { email: true, role: true },
    })

    return NextResponse.json({
      success: true,
      message: `Updated ${result.count} user(s)`,
      user,
    })
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
