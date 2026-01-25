import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logUserUpdated, getIpAddress, getUserAgent } from '@/lib/audit/logger'

const updateUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  role: z.enum([
    'TENANT_SUPER_ADMIN',
    'ORG_ADMIN',
    'PMO_LEAD',
    'PROJECT_MANAGER',
    'TEAM_MEMBER',
    'EXECUTIVE',
    'RESOURCE_MANAGER',
    'FINANCE_CONTROLLER',
    'CLIENT_STAKEHOLDER',
    'COMPLIANCE_AUDITOR',
    'INTEGRATION_ADMIN',
  ]),
  status: z.enum(['ACTIVE', 'INACTIVE', 'INVITED', 'SUSPENDED']),
  department: z.string().optional(),
  reportsToId: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to edit users
    const isAdmin =
      session.user.role === 'TENANT_SUPER_ADMIN' ||
      session.user.role === 'ORG_ADMIN'

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedData = updateUserSchema.parse(body)

    // Get the user being edited
    const userToEdit = await prisma.user.findUnique({
      where: { id: params.userId },
    })

    if (!userToEdit) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check tenant isolation
    if (userToEdit.tenantId !== session.user.tenantId) {
      return NextResponse.json(
        { error: 'Cannot edit users from other organizations' },
        { status: 403 }
      )
    }

    // ORG_ADMIN cannot promote users to TENANT_SUPER_ADMIN
    if (
      session.user.role === 'ORG_ADMIN' &&
      validatedData.role === 'TENANT_SUPER_ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Cannot assign TENANT_SUPER_ADMIN role' },
        { status: 403 }
      )
    }

    // ORG_ADMIN cannot edit TENANT_SUPER_ADMIN users
    if (
      session.user.role === 'ORG_ADMIN' &&
      userToEdit.role === 'TENANT_SUPER_ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Cannot edit TENANT_SUPER_ADMIN users' },
        { status: 403 }
      )
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
        status: validatedData.status,
        department: validatedData.department || null,
        reportsToId: validatedData.reportsToId || null,
        phone: validatedData.phone || null,
        location: validatedData.location || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        department: true,
        phone: true,
        location: true,
      },
    })

    // Log audit trail
    await logUserUpdated({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      updatedUserId: updatedUser.id,
      updatedUserEmail: updatedUser.email,
      changes: {
        role: { from: userToEdit.role, to: updatedUser.role },
        status: { from: userToEdit.status, to: updatedUser.status },
        department: { from: userToEdit.department, to: updatedUser.department },
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    })

    return NextResponse.json({ user: updatedUser }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

