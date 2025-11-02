import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, password, organizationName } =
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

    // Check if organization already exists
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        name: organizationName,
      },
      include: {
        users: true,
      },
    })

    let tenant
    let userRole: 'ORG_ADMIN' | 'TEAM_MEMBER' = 'TEAM_MEMBER'

    if (existingTenant) {
      // Organization exists, add user as TEAM_MEMBER
      tenant = existingTenant
      userRole = 'TEAM_MEMBER'
    } else {
      // New organization, create it and make user ORG_ADMIN
      tenant = await prisma.tenant.create({
        data: {
          name: organizationName,
          domain: email.split('@')[1],
        },
      })
      userRole = 'ORG_ADMIN'
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
        status: 'ACTIVE',
      },
    })

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        },
        message:
          userRole === 'ORG_ADMIN'
            ? 'Account created successfully! You are the organization admin.'
            : 'Account created successfully! You have been added to the organization.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    )
  }
}
