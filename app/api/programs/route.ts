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

    const tenantId = session.user.tenantId

    if (!tenantId) {
      console.warn('No tenantId found for user, returning empty programs array')
      return NextResponse.json({ programs: [] })
    }

    try {
      const programs = await prisma.program.findMany({
        where: {
          tenantId: tenantId,
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
    } catch (dbError: any) {
      // Handle case where Program table might not exist yet
      if (dbError.code === 'P2001' || dbError.message?.includes('does not exist') || dbError.message?.includes('Unknown model')) {
        console.warn('Program table not found, returning empty array')
        return NextResponse.json({ programs: [] })
      }
      throw dbError
    }
  } catch (error) {
    console.error('Error fetching programs:', error)
    // Return empty array instead of 500 to prevent UI errors
    return NextResponse.json({ programs: [] })
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
