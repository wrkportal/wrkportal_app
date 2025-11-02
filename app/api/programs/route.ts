import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch user's programs
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const programs = await prisma.program.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        budget: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ programs })
  } catch (error) {
    console.error('Error fetching programs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new program
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, code, description, startDate, endDate, budget, status } = body

    // Validate required fields
    if (!name || !code || !startDate || !endDate || budget === undefined) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: name, code, startDate, endDate, and budget are required',
        },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existingProgram = await prisma.program.findUnique({
      where: { code },
    })

    if (existingProgram) {
      return NextResponse.json(
        { error: 'Program code already exists' },
        { status: 409 }
      )
    }

    // Create the program
    const program = await prisma.program.create({
      data: {
        name,
        code,
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budget: budget,
        status: status || 'PLANNED',
        tenantId: session.user.tenantId,
        ownerId: session.user.id,
      },
    })

    return NextResponse.json({ program }, { status: 201 })
  } catch (error) {
    console.error('Error creating program:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
