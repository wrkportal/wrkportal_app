import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { isPublicDomain, extractDomain } from '@/lib/domain-utils'
import { isPlatformOwner } from '@/lib/platform-config'
import { sendEmailVerification } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      organizationName,
      invitationToken,
      workspaceType,
    } = await request.json()

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

    let tenant: any = null
    let userRole: string = 'TEAM_MEMBER'

    // SPECIAL CASE: Platform Owner
    if (isOwner) {
      // Check if platform owner already exists
      const existingOwner = await prisma.user.findFirst({
        where: { role: 'PLATFORM_OWNER' },
      })

      if (
        existingOwner &&
        existingOwner.email.toLowerCase() !== email.toLowerCase()
      ) {
        return NextResponse.json(
          { error: 'Platform owner already exists' },
          { status: 403 }
        )
      }

      // Create or get platform tenant
      tenant = await prisma.tenant.findFirst({
        where: { name: 'wrkportal.com Platform' },
      })

      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            name: 'wrkportal.com Platform',
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
      userRole = invitation.role as string

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
            error:
              'This domain is registered. Please request an invitation from your organization admin.',
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

    // Ensure tenant exists before creating user
    if (!tenant) {
      return NextResponse.json(
        { error: 'Failed to create or find tenant' },
        { status: 500 }
      )
    }

    // Create user with appropriate role (emailVerified is null initially)
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        tenantId: tenant.id,
        role: userRole as any,
        // Set groupRole for GROUP type workspaces
        groupRole:
          tenant.type === 'GROUP' &&
          (userRole === 'TENANT_SUPER_ADMIN' || userRole === 'PLATFORM_OWNER')
            ? 'OWNER'
            : undefined,
        status: 'ACTIVE',
        emailVerified: null, // Will be set after email verification
      },
    })

    // Generate email verification token
    const verificationToken = randomBytes(32).toString('hex')
    // Increase expiration to 48 hours to account for email delivery delays
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours

    console.log('🔑 Generated verification token:', {
      email,
      tokenLength: verificationToken.length,
      expiresAt: expires,
      expiresInHours: 48,
    })

    // Store verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires,
      },
    })

    // Send verification email
    let emailSent = false
    let emailError = null
    try {
      await sendEmailVerification(
        email,
        verificationToken,
        `${firstName} ${lastName}`
      )
      emailSent = true
      console.log('✅ Verification email sent successfully to:', email)
    } catch (emailErrorObj: any) {
      emailError = emailErrorObj
      console.error('❌ Failed to send verification email:', {
        error: emailErrorObj.message,
        code: emailErrorObj.code,
        email: email,
      })
      // Don't fail signup if email fails, but log it and inform user
    }

    // Prepare response message
    let message = 'Account created successfully!'
    if (emailSent) {
      message += ' Please check your email to verify your account.'
    } else {
      message +=
        ' However, we were unable to send the verification email. Please use the "Resend Verification Email" option on the login page.'
    }
    if (!tenant) {
      return NextResponse.json(
        { error: 'Failed to create or find tenant' },
        { status: 500 }
      )
    }

    if (
      userRole === 'TENANT_SUPER_ADMIN' &&
      !tenant.domainVerified &&
      domain &&
      !isPublic
    ) {
      message +=
        ' After verifying your email, verify your domain to unlock full features and enable team auto-join.'
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
        emailSent,
        ...(emailError && {
          emailWarning:
            'Verification email could not be sent. Please use the resend option on the login page.',
        }),
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
