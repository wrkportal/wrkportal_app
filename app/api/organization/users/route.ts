import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logUserCreated, getIpAddress, getUserAgent } from '@/lib/audit/logger'

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum([
    'TENANT_SUPER_ADMIN',
    'ORG_ADMIN',
    'PMO_LEAD',
    'PROJECT_MANAGER',
    'TEAM_MEMBER',
    'RESOURCE_MANAGER',
    'FINANCE_CONTROLLER',
    'EXECUTIVE',
    'CLIENT_STAKEHOLDER',
    'COMPLIANCE_AUDITOR',
    'INTEGRATION_ADMIN',
  ]),
  department: z.string().optional(),
  orgUnitId: z.string().optional(),
  reportsToId: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
})

// GET - Fetch all users with their details
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const orgUnitId = searchParams.get('orgUnitId')
    const status = searchParams.get('status')
    const leadsOnly = searchParams.get('leadsOnly') === 'true'

    const whereClause: any = {
      tenantId: session.user.tenantId,
    }

    if (role) {
      whereClause.role = role
    }

    if (orgUnitId) {
      whereClause.orgUnitId = orgUnitId
    }

    if (status) {
      whereClause.status = status
    }

    // If leadsOnly is true, only return users who don't report to anyone (department leads)
    if (leadsOnly) {
      whereClause.reportsToId = null
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        phone: true,
        location: true,
        avatar: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        orgUnit: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            assignedTasks: true,
            managedProjects: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get counts by role
    const roleCounts = await prisma.user.groupBy({
      by: ['role'],
      where: {
        tenantId: session.user.tenantId,
      },
      _count: true,
    })

    // Get counts by status
    const statusCounts = await prisma.user.groupBy({
      by: ['status'],
      where: {
        tenantId: session.user.tenantId,
      },
      _count: true,
    })

    return NextResponse.json({
      users,
      roleCounts,
      statusCounts,
      totalUsers: users.length,
      success: true,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission (only admins can create users)
    const allowedRoles = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        name: `${validatedData.firstName} ${validatedData.lastName}`,
        role: validatedData.role,
        department: validatedData.department,
        orgUnitId: validatedData.orgUnitId,
        reportsToId: validatedData.reportsToId || null,
        phone: validatedData.phone,
        location: validatedData.location,
        tenantId: session.user.tenantId,
        status: 'INVITED', // User needs to set password
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        status: true,
      },
    })

    // Log audit trail
    await logUserCreated({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      createdUserId: user.id,
      createdUserEmail: user.email,
      createdUserName: `${user.firstName} ${user.lastName}`,
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json({ user, success: true }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

// PATCH - Update user
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, ...updateData } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        status: true,
        orgUnitId: true,
      },
    })

    return NextResponse.json({ user, success: true })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE - Remove user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin permissions
    const allowedRoles = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Prevent self-deletion
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete yourself' },
        { status: 400 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
