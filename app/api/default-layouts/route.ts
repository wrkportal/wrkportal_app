import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for creating/updating default layout
const defaultLayoutSchema = z.object({
  pageKey: z.string(),
  targetRole: z.string().optional().nullable(),
  layoutData: z.any(), // JSON data
})

// GET: Retrieve default layout for a specific page
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pageKey = searchParams.get('pageKey')
    const role = searchParams.get('role')

    if (!pageKey) {
      return NextResponse.json({ error: 'pageKey is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Try to find default layout for specific role, then fall back to general default
    const defaultLayout = await prisma.defaultLayout.findFirst({
      where: {
        tenantId: user.tenantId,
        pageKey,
        OR: [
          { targetRole: role || user.role },
          { targetRole: null },
        ],
      },
      orderBy: [
        { targetRole: 'desc' }, // Specific role layouts first
        { updatedAt: 'desc' },
      ],
    })

    if (!defaultLayout) {
      return NextResponse.json({ defaultLayout: null }, { status: 200 })
    }

    return NextResponse.json({ defaultLayout }, { status: 200 })
  } catch (error) {
    console.error('Error fetching default layout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Save default layout (Platform Owner only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only Platform Owner can save default layouts
    if (user.role !== 'PLATFORM_OWNER') {
      return NextResponse.json({ error: 'Forbidden: Only Platform Owners can save default layouts' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = defaultLayoutSchema.parse(body)

    // Upsert the default layout
    const defaultLayout = await prisma.defaultLayout.upsert({
      where: {
        tenantId_pageKey_targetRole: {
          tenantId: user.tenantId,
          pageKey: validatedData.pageKey,
          targetRole: validatedData.targetRole || null,
        },
      },
      update: {
        layoutData: validatedData.layoutData,
        updatedAt: new Date(),
      },
      create: {
        tenantId: user.tenantId,
        pageKey: validatedData.pageKey,
        targetRole: validatedData.targetRole || null,
        layoutData: validatedData.layoutData,
        createdById: session.user.id,
      },
    })

    return NextResponse.json({ defaultLayout }, { status: 200 })
  } catch (error) {
    console.error('Error saving default layout:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove default layout (Platform Owner only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only Platform Owner can delete default layouts
    if (user.role !== 'PLATFORM_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const pageKey = searchParams.get('pageKey')
    const targetRole = searchParams.get('targetRole')

    if (!pageKey) {
      return NextResponse.json({ error: 'pageKey is required' }, { status: 400 })
    }

    await prisma.defaultLayout.deleteMany({
      where: {
        tenantId: user.tenantId,
        pageKey,
        targetRole: targetRole || null,
      },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting default layout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

