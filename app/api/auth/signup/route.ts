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

      // Check if user already exists (cross-tenant invitation)
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      if (existingUser) {
        // User already exists - this is a cross-tenant invitation
        // Create UserTenantAccess record to grant access to the new tenant
        const allowedSections = invitation.allowedSections
          ? (typeof invitation.allowedSections === 'string'
              ? JSON.parse(invitation.allowedSections)
              : invitation.allowedSections)
          : null

        // Mark invitation as accepted
        await prisma.tenantInvitation.update({
          where: { id: invitation.id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
          },
        })

        // Create UserTenantAccess record (if table exists)
        try {
          console.log('[Signup] Attempting to create UserTenantAccess for existing user:', {
            userId: existingUser.id,
            tenantId: invitation.tenant.id,
            role: invitation.role,
            invitationId: invitation.id,
          })
          
          await (prisma as any).userTenantAccess.create({
            data: {
              userId: existingUser.id,
              tenantId: invitation.tenant.id,
              role: invitation.role,
              allowedSections: allowedSections
                ? JSON.stringify(allowedSections)
                : null,
              invitedById: invitation.invitedById,
              invitationId: invitation.id,
              isActive: false, // Not the primary tenant
            },
          })
          console.log('[Signup] ✅ UserTenantAccess record created successfully')
        } catch (error: any) {
          console.error('[Signup] ❌ Failed to create UserTenantAccess record:', {
            error: error.message,
            code: error.code,
            meta: error.meta,
            userId: existingUser.id,
            tenantId: invitation.tenant.id,
            invitationId: invitation.id,
          })
          
          // UserTenantAccess table might not exist yet, or there might be a constraint issue
          if (error.code === 'P2021' || error.message?.includes('does not exist')) {
            console.warn('[Signup] UserTenantAccess table does not exist - this is expected if migration not run')
          } else if (error.code === 'P2002') {
            // Unique constraint violation - record might already exist
            console.warn('[Signup] UserTenantAccess record might already exist:', error.meta)
          } else {
            // Other error - log it but don't fail
            console.error('[Signup] Unexpected error creating UserTenantAccess:', error)
          }
        }

        return NextResponse.json(
          {
            user: {
              id: existingUser.id,
              email: existingUser.email,
              name: `${existingUser.firstName} ${existingUser.lastName}`,
              role: existingUser.role,
            },
            tenant: {
              id: invitation.tenant.id,
              name: invitation.tenant.name,
            },
            message: 'You now have access to this workspace. Please log in with your existing account.',
            crossTenantAccess: true,
            allowedSections: allowedSections,
          },
          { status: 200 }
        )
      }

      // Join the invited tenant (new user signup)
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
      
      // Note: allowedSections will be applied when creating the user below
      // UserTenantAccess record will be created after user creation (see below)
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

    // Determine allowed sections based on signup type
    let allowedSections: string[] | null = null
    
    if (invitationToken) {
      // User signed up with invitation - get allowed sections from invitation
      const invitation = await prisma.tenantInvitation.findUnique({
        where: { token: invitationToken },
        select: { allowedSections: true },
      })
      
      if (invitation && invitation.allowedSections) {
        const parsed = typeof invitation.allowedSections === 'string'
          ? JSON.parse(invitation.allowedSections)
          : invitation.allowedSections
        
        // Handle nested structure with sections and settings
        let sectionsArray: string[] = []
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          // Nested format: { sections: [...], settings: {...} }
          if (parsed.sections && Array.isArray(parsed.sections)) {
            sectionsArray = parsed.sections
          }
        } else if (Array.isArray(parsed)) {
          // Simple array format
          sectionsArray = parsed
        }
        
        // Extract unique function names from section format "Function:Section"
        // e.g., "Finance:Dashboard" -> "Finance"
        const functionNames = new Set<string>()
        sectionsArray.forEach((section: string) => {
          if (typeof section === 'string' && section.includes(':')) {
            const functionName = section.split(':')[0].trim()
            if (functionName) {
              functionNames.add(functionName)
            }
          } else if (typeof section === 'string') {
            // If it's already just a function name, use it directly
            functionNames.add(section)
          }
        })
        
        allowedSections = functionNames.size > 0 ? Array.from(functionNames) : null
      } else {
        // No sections specified in invitation - null means full access
        allowedSections = null
      }
    } else {
      // First-time signup without invitation - give full access (all sections)
      // null means all sections are accessible
      allowedSections = null
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
        allowedSections: allowedSections ? JSON.stringify(allowedSections) : null,
      } as any,
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

    // Create UserTenantAccess record for new users who signed up with invitation
    // This ensures consistency and supports workspace switching
    if (invitationToken) {
      try {
        const invitation = await prisma.tenantInvitation.findUnique({
          where: { token: invitationToken },
          select: { id: true, tenantId: true, role: true, allowedSections: true, invitedById: true },
        })
        
        if (invitation) {
          console.log('[Signup] Creating UserTenantAccess for new user with invitation:', {
            userId: user.id,
            tenantId: invitation.tenantId,
            role: invitation.role,
            invitationId: invitation.id,
          })
          
          await (prisma as any).userTenantAccess.create({
            data: {
              userId: user.id,
              tenantId: invitation.tenantId,
              role: invitation.role,
              allowedSections: invitation.allowedSections,
              invitedById: invitation.invitedById,
              invitationId: invitation.id,
              isActive: true, // This is their primary tenant
            },
          })
          console.log('[Signup] ✅ UserTenantAccess record created for new user')
        }
      } catch (error: any) {
        console.error('[Signup] ❌ Failed to create UserTenantAccess for new user:', {
          error: error.message,
          code: error.code,
          meta: error.meta,
          userId: user.id,
        })
        // Don't fail signup if UserTenantAccess creation fails
        // The user's primary tenantId is already set correctly
      }
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
  } catch (error: any) {
    console.error('❌ Signup error:', error)
    console.error('❌ Error stack:', error?.stack)
    console.error('❌ Error code:', error?.code)
    console.error('❌ Error name:', error?.name)
    
    // Provide more specific error messages based on error type
    let errorMessage = 'An error occurred during signup'
    let errorDetails = error instanceof Error ? error.message : 'Unknown error'
    
    // Prisma-specific errors
    if (error?.code === 'P2002') {
      errorMessage = 'A record with this information already exists'
      errorDetails = error.meta?.target 
        ? `Duplicate entry for: ${error.meta.target.join(', ')}`
        : error.message
    } else if (error?.code === 'P2003') {
      errorMessage = 'Invalid reference in database'
      errorDetails = error.meta?.field_name 
        ? `Invalid reference: ${error.meta.field_name}`
        : error.message
    } else if (error?.code === 'P1001' || error?.code === 'P1017') {
      errorMessage = 'Database connection error'
      errorDetails = 'Unable to connect to the database. Please try again later.'
    } else if (error?.code === 'P2025') {
      errorMessage = 'Record not found'
      errorDetails = error.message
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        code: error?.code || 'UNKNOWN',
        // Include additional context for debugging (only in development)
        ...(process.env.NODE_ENV === 'development' && {
          stack: error?.stack,
          name: error?.name,
        }),
      },
      { status: 500 }
    )
  }
}
