import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const searchSchema = z.object({
  query: z.string().optional(),
  status: z
    .enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'])
    .optional(),
  source: z
    .enum(['LINKEDIN', 'WEBSITE', 'REFERRAL', 'JOB_BOARD', 'RECRUITER'])
    .optional(),
  rating: z.enum(['HIGH', 'AVERAGE', 'LOW']).optional(),
  experienceMin: z.number().optional(),
  experienceMax: z.number().optional(),
  department: z.string().optional(),
  skills: z.array(z.string()).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  sortBy: z.enum(['createdAt', 'firstName', 'lastName', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().default(1),
  limit: z.number().default(20),
})

// POST /api/recruitment/candidates/search - Advanced candidate search
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const body = await request.json()
    const validatedData = searchSchema.parse(body)

    // Build where clause
    const where: any = { tenantId }

    // Text search (name, email, phone)
    if (validatedData.query) {
      where.OR = [
        { firstName: { contains: validatedData.query, mode: 'insensitive' } },
        { lastName: { contains: validatedData.query, mode: 'insensitive' } },
        { email: { contains: validatedData.query, mode: 'insensitive' } },
        { phone: { contains: validatedData.query, mode: 'insensitive' } },
      ]
    }

    // Specific field filters
    if (validatedData.email) {
      where.email = { contains: validatedData.email, mode: 'insensitive' }
    }

    if (validatedData.phone) {
      where.phone = { contains: validatedData.phone, mode: 'insensitive' }
    }

    // Department filter
    if (validatedData.department) {
      where.department = { contains: validatedData.department, mode: 'insensitive' }
    }

    // Location filter
    if (validatedData.location) {
      where.location = { contains: validatedData.location, mode: 'insensitive' }
    }

    // Date range filter
    if (validatedData.dateFrom || validatedData.dateTo) {
      where.createdAt = {}
      if (validatedData.dateFrom) {
        where.createdAt.gte = new Date(validatedData.dateFrom)
      }
      if (validatedData.dateTo) {
        where.createdAt.lte = new Date(validatedData.dateTo)
      }
    }

    // Skills filter (if skills table exists)
    if (validatedData.skills && validatedData.skills.length > 0) {
      where.skills = {
        some: {
          skill: {
            name: {
              in: validatedData.skills,
              mode: 'insensitive',
            },
          },
        },
      }
    }

    // Calculate pagination
    const skip = (validatedData.page - 1) * validatedData.limit
    const take = validatedData.limit

    // Get total count
    const total = await prisma.user.count({ where })

    // Build orderBy clause
    const orderBy: any = {}
    orderBy[validatedData.sortBy] = validatedData.sortOrder

    // Fetch candidates with skills
    const candidates = await prisma.user.findMany({
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
        skills: {
          select: {
            skill: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy,
      skip,
      take,
    })

    // Transform to candidate format
    const results = candidates.map((u) => ({
      id: u.id,
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email,
      phone: u.phone,
      position: u.department || 'Not specified',
      location: u.location,
      status: 'APPLIED' as const, // TODO: Get from RecruitmentCandidate model
      source: 'WEBSITE' as const, // TODO: Get from RecruitmentCandidate model
      experience: null, // TODO: Get from RecruitmentCandidate model
      rating: 'AVERAGE' as const, // TODO: Get from RecruitmentCandidate model
      skills: u.skills.map((s) => s.skill.name),
      createdAt: u.createdAt.toISOString(),
    }))

    return NextResponse.json({
      candidates: results,
      pagination: {
        page: validatedData.page,
        limit: validatedData.limit,
        total,
        totalPages: Math.ceil(total / validatedData.limit),
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error searching candidates:', error)
    return NextResponse.json(
      { error: 'Failed to search candidates', details: error.message },
      { status: 500 }
    )
  }
}
