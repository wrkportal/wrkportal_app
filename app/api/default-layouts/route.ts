import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { UserRole } from '@prisma/client'

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

    // Ensure targetRole is either a valid UserRole enum or explicitly null (not undefined)
    const targetRole: UserRole | null = validatedData.targetRole && Object.values(UserRole).includes(validatedData.targetRole as UserRole)
      ? (validatedData.targetRole as UserRole)
      : null

    // Prisma doesn't allow null in unique constraint where clauses for upsert
    // So we need to use findFirst, then update or create
    const existing = await prisma.defaultLayout.findFirst({
      where: {
        tenantId: user.tenantId,
        pageKey: validatedData.pageKey,
        targetRole: targetRole,
      },
    })

    let defaultLayout
    if (existing) {
      // Update existing
      defaultLayout = await prisma.defaultLayout.update({
        where: { id: existing.id },
        data: {
          layoutData: validatedData.layoutData,
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new
      defaultLayout = await prisma.defaultLayout.create({
        data: {
          tenantId: user.tenantId,
          pageKey: validatedData.pageKey,
          targetRole: targetRole,
          layoutData: validatedData.layoutData,
          createdById: session.user.id,
        },
      })
    }

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
    const targetRoleParam = searchParams.get('targetRole')

    if (!pageKey) {
      return NextResponse.json({ error: 'pageKey is required' }, { status: 400 })
    }

    // Ensure targetRole is either a valid UserRole enum or explicitly null
    const targetRole: UserRole | null = targetRoleParam && Object.values(UserRole).includes(targetRoleParam as UserRole)
      ? (targetRoleParam as UserRole)
      : null

    await prisma.defaultLayout.deleteMany({
      where: {
        tenantId: user.tenantId,
        pageKey,
        targetRole: targetRole,
      },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting default layout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

