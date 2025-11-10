import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { isPublicDomain, extractDomain } from '@/lib/domain-utils'
import { isPlatformOwner } from '@/lib/platform-config'

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, password, organizationName, invitationToken, workspaceType } =
      await request.json()

    // Validation
    if (!firstName || !lastName || !email || !password || !organizationName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    const domain = extractDomain(email)
    const isPublic = isPublicDomain(email)
    const isOwner = isPlatformOwner(email)

    let tenant
    let userRole: 'PLATFORM_OWNER' | 'TENANT_SUPER_ADMIN' | 'ORG_ADMIN' | 'TEAM_MEMBER' = 'TEAM_MEMBER'

    // SPECIAL CASE: Platform Owner
    if (isOwner) {
      // Check if platform owner already exists
      const existingOwner = await prisma.user.findFirst({
        where: { role: 'PLATFORM_OWNER' },
      })

      if (existingOwner && existingOwner.email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Platform owner already exists' },
          { status: 403 }
        )
      }

      // Create or get platform tenant
      tenant = await prisma.tenant.findFirst({
        where: { name: 'ManagerBook Platform' },
      })

      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            name: 'ManagerBook Platform',
            domain: null,
            type: 'ORGANIZATION',
            domainVerified: true, // Platform tenant is always verified
            plan: 'enterprise',
          },
        })
      }

      userRole = 'PLATFORM_OWNER'
    }

    // CASE 1: User has an invitation token
    if (invitationToken) {
      const invitation = await prisma.tenantInvitation.findUnique({
        where: { 
          token: invitationToken,
          status: 'PENDING',
        },
        include: {
          tenant: true,
        },
      })

      if (!invitation) {
        return NextResponse.json(
          { error: 'Invalid or expired invitation' },
          { status: 400 }
        )
      }

      if (invitation.expiresAt < new Date()) {
        await prisma.tenantInvitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' },
        })
        return NextResponse.json(
          { error: 'Invitation has expired' },
          { status: 400 }
        )
      }

      if (invitation.email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Email does not match invitation' },
          { status: 400 }
        )
      }

      // Join the invited tenant
      tenant = invitation.tenant
      userRole = invitation.role

      // Mark invitation as accepted
      await prisma.tenantInvitation.update({
        where: { id: invitation.id },
        data: { 
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      })
    }
    // CASE 2: Public domain (Gmail, Yahoo, etc.) - Always create new tenant
    else if (!isOwner && isPublic) {
      tenant = await prisma.tenant.create({
        data: {
          name: organizationName,
          type: workspaceType || 'ORGANIZATION', // Use provided type or default
          domain: null, // Don't set domain for public emails
          domainVerified: false,
        },
      })
      userRole = 'TENANT_SUPER_ADMIN' // User is admin of their own tenant
    }
    // CASE 3: Private/Corporate domain - Check for verified tenant
    else if (!isOwner && domain) {
      // Check if a verified tenant exists with this domain
      const existingTenant = await prisma.tenant.findFirst({
        where: {
          domain: domain,
          domainVerified: true,
        },
        include: {
          users: {
            take: 1,
          },
        },
      })

      if (existingTenant && existingTenant.autoJoinEnabled) {
        // Auto-join verified tenant with domain matching
        tenant = existingTenant
        userRole = 'TEAM_MEMBER'
      } else if (existingTenant) {
        // Verified tenant exists but auto-join is disabled
        return NextResponse.json(
          { 
            error: 'This domain is registered. Please request an invitation from your organization admin.',
            requiresInvitation: true,
          },
          { status: 403 }
        )
      } else {
        // No verified tenant exists - create new unverified tenant
        tenant = await prisma.tenant.create({
          data: {
            name: organizationName,
            type: workspaceType || 'ORGANIZATION', // Use provided type or default
            domain: domain,
            domainVerified: false,
          },
        })
        userRole = 'TENANT_SUPER_ADMIN' // Provisional admin
      }
    } else if (!isOwner) {
      // Fallback - create new tenant
      tenant = await prisma.tenant.create({
        data: {
          name: organizationName,
          type: workspaceType || 'ORGANIZATION', // Use provided type or default
          domain: null,
          domainVerified: false,
        },
      })
      userRole = 'TENANT_SUPER_ADMIN'
    }

    // Create user with appropriate role
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        tenantId: tenant.id,
        role: userRole,
        // Set groupRole for GROUP type workspaces
        groupRole: tenant.type === 'GROUP' && (userRole === 'TENANT_SUPER_ADMIN' || userRole === 'PLATFORM_OWNER') ? 'OWNER' : undefined,
        status: 'ACTIVE',
      },
    })

    // Prepare response message
    let message = 'Account created successfully!'
    if (userRole === 'TENANT_SUPER_ADMIN' && !tenant.domainVerified && domain && !isPublic) {
      message += ' Verify your domain to unlock full features and enable team auto-join.'
    } else if (userRole === 'TENANT_SUPER_ADMIN') {
      message += ' You are the organization admin.'
    } else if (invitationToken) {
      message += ' Welcome to the team!'
    } else {
      message += ' You have joined the organization.'
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          domainVerified: tenant.domainVerified,
        },
        message,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { 
        error: 'An error occurred during signup',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
