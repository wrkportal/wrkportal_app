import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, WorkspaceType, GroupRole } from '@/types'
import { generateVerificationCode } from '@/lib/domain-utils'
import { canInviteUsers } from '@/lib/permissions'
import { sendInvitationEmail } from '@/lib/email'

// GET /api/invitations - List all invitations for the current tenant
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can view invitations
    if (session.user.role !== UserRole.TENANT_SUPER_ADMIN && session.user.role !== UserRole.ORG_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const invitations = await prisma.tenantInvitation.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/invitations - Create a new invitation
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with tenant information to check permissions
    // Try minimal query first, then fall back to session data if columns don't exist
    let user: any = null
    let tenantType: WorkspaceType = 'ORGANIZATION' // Default fallback
    let userRole: UserRole = session.user.role as UserRole
    let groupRole: GroupRole | undefined = undefined
    
    try {
      // First try with all fields
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          role: true,
          groupRole: true,
          tenantId: true,
          tenant: {
            select: {
              id: true,
              type: true,
            },
          },
        },
      })
      
      if (user) {
        tenantType = (user.tenant?.type as WorkspaceType) || 'ORGANIZATION'
        userRole = user.role as UserRole
        groupRole = user.groupRole as GroupRole | undefined
      }
    } catch (error: any) {
      // If query fails due to missing columns, try minimal query
      if (error.code === 'P2022' || error.message?.includes('column')) {
        console.warn('Some columns missing, trying minimal query:', error.message)
        try {
          // Try with just essential fields
          user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
              id: true,
              role: true,
              tenantId: true,
            },
          })
          
          if (user) {
            userRole = user.role as UserRole
            // Try to get tenant type separately
            try {
              const tenant = await prisma.tenant.findUnique({
                where: { id: user.tenantId },
                select: { type: true },
              })
              tenantType = (tenant?.type as WorkspaceType) || 'ORGANIZATION'
            } catch (tenantError: any) {
              console.warn('Could not fetch tenant type, using default')
              tenantType = 'ORGANIZATION'
            }
          }
        } catch (minimalError: any) {
          // If even minimal query fails, use session data
          console.warn('Minimal query also failed, using session data:', minimalError.message)
          user = {
            id: session.user.id,
            tenantId: session.user.tenantId,
            role: session.user.role,
          }
          userRole = session.user.role as UserRole
          tenantType = 'ORGANIZATION' // Default fallback
        }
      } else if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        // Table doesn't exist at all
        console.warn('User table not available, cannot check permissions for invitation')
        return NextResponse.json(
          { 
            error: 'User data unavailable for permission check. Please contact support.',
            code: 'SERVICE_UNAVAILABLE',
            requiresSetup: true
          },
          { status: 503 }
        )
      } else {
        throw error
      }
    }

    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'User or tenant not found' }, { status: 404 })
    }

    // Check if user has permission to invite using the permission function
    // This allows first-time users who created their own tenant to invite
    const hasInvitePermission = canInviteUsers(
      tenantType,
      userRole,
      groupRole
    )

    if (!hasInvitePermission) {
      console.warn('[Invitations] Permission denied:', {
        tenantType,
        userRole,
        groupRole,
        userId: user.id,
      })
      return NextResponse.json(
        { 
          error: 'You do not have permission to invite users. Only organization admins and workspace owners can send invitations.',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { 
      email, 
      role = UserRole.TEAM_MEMBER, 
      allowedSections,
      accessLevel,
      dataScope,
      dataScopeValue,
      accessExpiresAt,
      requireMFA,
      enableAuditLog,
      functionAccess,
    } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if user already exists
    let existingUser
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })
    } catch (error: any) {
      // Handle case where User table or columns might not exist
      if (error.code === 'P2021' || error.code === 'P2022' || 
          error.message?.includes('does not exist') ||
          error.message?.includes('column')) {
        console.warn('User table or column not available, proceeding with invitation')
        existingUser = null
      } else {
        throw error
      }
    }

    if (existingUser) {
      if (existingUser.tenantId === user.tenantId || existingUser.tenantId === session.user.tenantId) {
        return NextResponse.json(
          { error: 'User is already a member of this organization' },
          { status: 400 }
        )
      } else {
        // User exists in another tenant - allow cross-tenant invitation
        // This allows User A from Tenant A to invite User B from Tenant B
        // User B will have access to Tenant A's data based on allowedSections
        console.log(`[Invitation] Cross-tenant invitation: ${email} from tenant ${existingUser.tenantId} invited to tenant ${user.tenantId}`)
      }
    }

    // Check if invitation already exists
    let existingInvitation
    try {
      existingInvitation = await prisma.tenantInvitation.findFirst({
        where: {
          tenantId: user.tenantId || session.user.tenantId,
          email: email.toLowerCase(),
          status: 'PENDING',
        },
      })
    } catch (error: any) {
      // Handle case where TenantInvitation table might not exist
      if (error.code === 'P2021' || error.code === 'P2022' || 
          error.message?.includes('does not exist') ||
          error.message?.includes('column')) {
        console.warn('TenantInvitation table or column not available, proceeding with invitation')
        existingInvitation = null
      } else {
        throw error
      }
    }

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 400 }
      )
    }

    // Generate unique token
    const token = generateVerificationCode()

    // Create invitation (expires in 7 days)
    // Store allowedSections and additional security settings as JSON
    const invitationData: any = {
      tenantId: user.tenantId || session.user.tenantId,
      email: email.toLowerCase(),
      token,
      role: role as UserRole,
      invitedById: user.id || session.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      allowedSections: allowedSections && Array.isArray(allowedSections) 
        ? JSON.stringify(allowedSections) 
        : null,
    }

    // Store additional access control settings in a JSON field
    // Note: You may need to add an 'accessSettings' JSON field to TenantInvitation model
    const accessSettings: any = {}
    if (accessLevel) accessSettings.accessLevel = accessLevel
    if (dataScope) accessSettings.dataScope = dataScope
    if (dataScopeValue) accessSettings.dataScopeValue = dataScopeValue
    if (accessExpiresAt) accessSettings.accessExpiresAt = accessExpiresAt
    if (requireMFA !== undefined) accessSettings.requireMFA = requireMFA
    if (enableAuditLog !== undefined) accessSettings.enableAuditLog = enableAuditLog
    if (functionAccess) accessSettings.functionAccess = functionAccess

    // Store access settings in allowedSections field as JSON for now
    // In production, you'd want a separate JSON field in the schema
    if (Object.keys(accessSettings).length > 0) {
      invitationData.allowedSections = JSON.stringify({
        sections: allowedSections || [],
        settings: accessSettings,
      })
    }

    let invitation
    try {
      invitation = await prisma.tenantInvitation.create({
        data: invitationData,
        include: {
          invitedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    } catch (error: any) {
      // Handle case where TenantInvitation table might not exist
      if (error.code === 'P2021' || error.code === 'P2022' || 
          error.message?.includes('does not exist') ||
          error.message?.includes('column')) {
        console.warn('TenantInvitation table or column not available, cannot create invitation')
        return NextResponse.json(
          { 
            error: 'The invitation system is currently unavailable. This feature requires the TenantInvitation database table to be set up. Please contact your administrator or run the necessary database migrations.',
            code: 'SERVICE_UNAVAILABLE',
            requiresSetup: true
          },
          { status: 503 }
        )
      }
      throw error
    }

    // Generate invitation URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const invitationUrl = `${baseUrl}/signup?token=${token}`

    console.log('[Invitation] Starting email send process:', {
      email: invitation.email,
      tenantName: invitation.tenant.name,
      invitationId: invitation.id,
      baseUrl,
    })

    // Send invitation email
    try {
      const invitedByName = invitation.invitedBy
        ? `${invitation.invitedBy.firstName || ''} ${invitation.invitedBy.lastName || ''}`.trim() || invitation.invitedBy.email
        : undefined
      
      const roleDisplayName = invitation.role === UserRole.ORG_ADMIN 
        ? 'Organization Admin'
        : invitation.role === UserRole.TENANT_SUPER_ADMIN
        ? 'Super Admin'
        : 'Team Member'

      console.log('[Invitation] Calling sendInvitationEmail with:', {
        email: invitation.email,
        tenantName: invitation.tenant.name,
        invitedByName,
        roleDisplayName,
      })

      await sendInvitationEmail(
        invitation.email,
        invitationUrl,
        invitation.tenant.name,
        invitedByName,
        roleDisplayName
      )
      console.log(`[Invitation] ✅ Email sent successfully to ${invitation.email}`)
    } catch (emailError: any) {
      // Log email error but don't fail the invitation creation
      // The invitation is still valid and can be accessed via the URL
      console.error('[Invitation] ❌ Failed to send invitation email:', {
        error: emailError.message,
        errorStack: emailError.stack,
        errorCode: emailError.code,
        email: invitation.email,
        invitationId: invitation.id,
        tenantName: invitation.tenant.name,
      })
      // Continue - invitation is still created and valid
    }

    return NextResponse.json({
      invitation,
      invitationUrl,
      message: 'Invitation created successfully',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating invitation:', error)
    
    // Handle Prisma errors gracefully
    if (error.code === 'P2001' || 
        error.code === 'P2021' || 
        error.code === 'P2022' || 
        error.message?.includes('does not exist') ||
        error.message?.includes('column')) {
      console.warn('Database table or column not available')
      return NextResponse.json(
        { 
          error: 'The invitation system is currently unavailable. This feature requires the TenantInvitation database table to be set up. Please contact your administrator or run the necessary database migrations.',
          code: 'SERVICE_UNAVAILABLE',
          requiresSetup: true
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/invitations - Revoke an invitation
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can revoke invitations
    if (session.user.role !== UserRole.TENANT_SUPER_ADMIN && session.user.role !== UserRole.ORG_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const invitationId = searchParams.get('id')

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 })
    }

    // Verify invitation belongs to user's tenant
    const invitation = await prisma.tenantInvitation.findUnique({
      where: { id: invitationId },
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invitation.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Revoke invitation
    await prisma.tenantInvitation.update({
      where: { id: invitationId },
      data: { status: 'REVOKED' },
    })

    return NextResponse.json({ message: 'Invitation revoked successfully' })
  } catch (error) {
    console.error('Error revoking invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

