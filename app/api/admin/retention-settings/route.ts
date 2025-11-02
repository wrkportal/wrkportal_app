import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const retentionSchema = z.object({
  auditLogRetentionDays: z.number().int().min(-1),
  taskRetentionDays: z.number().int().min(-1),
  notificationRetentionDays: z.number().int().min(-1),
  projectRetentionDays: z.number().int().min(-1),
})

// GET - Load current retention settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can access retention settings
    const allowedRoles = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get tenant's retention settings
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        id: true,
        name: true,
        auditLogRetentionDays: true,
        taskRetentionDays: true,
        notificationRetentionDays: true,
        projectRetentionDays: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json({
      tenantId: tenant.id,
      tenantName: tenant.name,
      auditLogRetentionDays: tenant.auditLogRetentionDays,
      taskRetentionDays: tenant.taskRetentionDays,
      notificationRetentionDays: tenant.notificationRetentionDays,
      projectRetentionDays: tenant.projectRetentionDays,
    })
  } catch (error) {
    console.error('Error loading retention settings:', error)
    return NextResponse.json(
      { error: 'Failed to load retention settings' },
      { status: 500 }
    )
  }
}

// PUT - Update retention settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can update retention settings
    const allowedRoles = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = retentionSchema.parse(body)

    // Update tenant retention settings
    const updatedTenant = await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: {
        auditLogRetentionDays: validatedData.auditLogRetentionDays,
        taskRetentionDays: validatedData.taskRetentionDays,
        notificationRetentionDays: validatedData.notificationRetentionDays,
        projectRetentionDays: validatedData.projectRetentionDays,
      },
      select: {
        id: true,
        name: true,
        auditLogRetentionDays: true,
        taskRetentionDays: true,
        notificationRetentionDays: true,
        projectRetentionDays: true,
      },
    })

    // Log the configuration change
    console.log(
      `Retention settings updated for tenant ${updatedTenant.id} by user ${session.user.id}`
    )

    return NextResponse.json({
      success: true,
      message: 'Retention settings updated successfully',
      settings: updatedTenant,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid retention settings', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating retention settings:', error)
    return NextResponse.json(
      { error: 'Failed to update retention settings' },
      { status: 500 }
    )
  }
}

