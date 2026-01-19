import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const employeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  department: z.string().min(1),
  position: z.string().min(1),
  location: z.string().optional().nullable(),
})

// GET /api/recruitment/employees - List all employees
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const { searchParams } = new URL(request.url)
    const department = searchParams.get('department')

    // Use User model for employees
    const where: any = { tenantId, status: 'ACTIVE' }
    if (department && department !== 'all') {
      where.department = department
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        department: true,
        location: true,
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform users to employee format
    const employees = users.map((u) => ({
      id: u.id,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      email: u.email,
      phone: u.phone,
      department: u.department || 'Unassigned',
      position: u.department || 'Employee', // Would come from role or position field
      location: u.location,
      hireDate: u.createdAt.toISOString(),
      status: u.status,
    }))

    return NextResponse.json({ employees })
  } catch (error: any) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/recruitment/employees - Create a new employee
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const body = await request.json()
    const validatedData = employeeSchema.parse(body)

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Employee with this email already exists' },
        { status: 400 }
      )
    }

    // Parse name into first and last name
    const nameParts = validatedData.name.split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // Create user as employee
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        firstName,
        lastName,
        phone: validatedData.phone || null,
        department: validatedData.department,
        location: validatedData.location || null,
        tenantId,
        role: 'TEAM_MEMBER',
        status: 'ACTIVE',
      },
    })

    const employee = {
      id: newUser.id,
      name: validatedData.name,
      email: newUser.email,
      phone: newUser.phone,
      department: newUser.department || '',
      position: validatedData.position,
      location: newUser.location,
      hireDate: newUser.createdAt.toISOString(),
      status: newUser.status,
    }

    return NextResponse.json({ employee }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { error: 'Failed to create employee', details: error.message },
      { status: 500 }
    )
  }
}
