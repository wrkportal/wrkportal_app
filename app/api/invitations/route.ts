import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types'
import { generateVerificationCode } from '@/lib/domain-utils'

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

    // Only admins can send invitations
    if (session.user.role !== UserRole.TENANT_SUPER_ADMIN && session.user.role !== UserRole.ORG_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { email, role = UserRole.TEAM_MEMBER, allowedSections } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      if (existingUser.tenantId === session.user.tenantId) {
        return NextResponse.json(
          { error: 'User is already a member of this organization' },
          { status: 400 }
        )
      } else {
        // User exists in another tenant - allow cross-tenant invitation
        // This allows User A from Tenant A to invite User B from Tenant B
        // User B will have access to Tenant A's data based on allowedSections
        console.log(`[Invitation] Cross-tenant invitation: ${email} from tenant ${existingUser.tenantId} invited to tenant ${session.user.tenantId}`)
      }
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.tenantInvitation.findFirst({
      where: {
        tenantId: session.user.tenantId,
        email: email.toLowerCase(),
        status: 'PENDING',
      },
    })

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 400 }
      )
    }

    // Generate unique token
    const token = generateVerificationCode()

    // Create invitation (expires in 7 days)
    // Store allowedSections as JSON string if provided
    const invitation = await prisma.tenantInvitation.create({
      data: {
        tenantId: session.user.tenantId,
        email: email.toLowerCase(),
        token,
        role: role as UserRole,
        invitedById: session.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        allowedSections: allowedSections && Array.isArray(allowedSections) 
          ? JSON.stringify(allowedSections) 
          : null,
      } as any,
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

    // Generate invitation URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const invitationUrl = `${baseUrl}/signup?token=${token}`

    return NextResponse.json({
      invitation,
      invitationUrl,
      message: 'Invitation created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating invitation:', error)
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

