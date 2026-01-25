import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { WorkspaceType, UserRole, GroupRole } from '@/types'
import { canInviteUsers } from '@/lib/permissions'
import { AuditAction, AuditEntity } from '@prisma/client'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, role, groupRole } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get user with tenant information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { tenant: true },
    })

    if (!user || !user.tenant) {
      return NextResponse.json(
        { success: false, error: 'User or tenant not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to invite
    const hasInvitePermission = canInviteUsers(
      user.tenant.type as WorkspaceType,
      user.role as UserRole,
      user.groupRole as GroupRole | undefined
    )

    if (!hasInvitePermission) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to invite users' },
        { status: 403 }
      )
    }

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      if (existingUser.tenantId === user.tenantId) {
        return NextResponse.json(
          { success: false, error: 'User is already a member of this workspace' },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { success: false, error: 'This email is already registered with another workspace' },
          { status: 400 }
        )
      }
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.tenantInvitation.findUnique({
      where: {
        tenantId_email: {
          tenantId: user.tenantId,
          email,
        },
      },
    })

    if (existingInvitation && existingInvitation.status === 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'An invitation has already been sent to this email' },
        { status: 400 }
      )
    }

    // Delete any expired invitations for this email
    if (existingInvitation) {
      await prisma.tenantInvitation.delete({
        where: { id: existingInvitation.id },
      })
    }

    // Determine the role based on workspace type
    let inviteRole: UserRole
    if (user.tenant.type === 'GROUP') {
      // For groups, use groupRole or default to MEMBER
      inviteRole = UserRole.TEAM_MEMBER // Store as TEAM_MEMBER in DB, but use groupRole field
    } else {
      // For organizations, use the provided role or default to TEAM_MEMBER
      inviteRole = (role as UserRole) || UserRole.TEAM_MEMBER
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')

    // Create invitation
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    const invitation = await prisma.tenantInvitation.create({
      data: {
        tenantId: user.tenantId,
        email,
        token,
        role: inviteRole,
        invitedById: user.id,
        status: 'PENDING',
        expiresAt,
      },
    })

    // TODO: Send invitation email
    // In a production app, you would send an email here with the invitation link
    // For now, we'll just return the invitation details
    const invitationLink = `${process.env.NEXTAUTH_URL}/accept-invitation?token=${token}`

    // Log the activity
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: AuditAction.CREATE,
        entity: AuditEntity.USER,
        entityId: invitation.id,
        entityName: email,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          invitedEmail: email,
          role: user.tenant.type === 'GROUP' ? groupRole : role,
          workspaceType: user.tenant.type,
          invitationId: invitation.id,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        id: invitation.id,
        email: invitation.email,
        role: user.tenant.type === 'GROUP' ? groupRole : role,
        expiresAt: invitation.expiresAt,
        invitationLink, // In dev mode, return the link for testing
      },
    })
  } catch (error) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}

