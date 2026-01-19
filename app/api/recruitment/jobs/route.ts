import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const jobSchema = z.object({
  jobCode: z.string().optional().nullable(),
  title: z.string().min(1),
  department: z.string().min(1),
  location: z.string().min(1),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
  status: z.enum(['OPEN', 'CLOSED', 'ON_HOLD', 'DRAFT']),
  salaryRange: z.string().optional().nullable(),
  commission: z.string().optional().nullable(),
  benefits: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  responsibilities: z.string().optional().nullable(),
  qualifications: z.string().optional().nullable(),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  experienceMin: z.number().optional().nullable(),
  experienceMax: z.number().optional().nullable(),
  educationLevel: z
    .enum(['HIGH_SCHOOL', 'ASSOCIATES', 'BACHELORS', 'MASTERS', 'PHD'])
    .optional()
    .nullable(),
  certifications: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  numberOfPositions: z.number().default(1),
  hiringManager: z.string().optional().nullable(),
  assignedRecruiter: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  expectedStartDate: z.string().optional().nullable(),
  applicationDeadline: z.string().optional().nullable(),
  workSchedule: z.string().optional().nullable(),
  travelRequired: z.boolean().default(false),
  travelPercentage: z.number().optional().nullable(),
  remoteType: z.enum(['ONSITE', 'REMOTE', 'HYBRID']).default('ONSITE'),
  internalNotes: z.string().optional().nullable(),
  postingChannels: z.array(z.string()).default([]),
})

// GET /api/recruitment/jobs - List all jobs
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // For now, return empty array since we don't have a RecruitmentJob model
    // TODO: Create RecruitmentJob model and query from database
    const jobs: any[] = []

    return NextResponse.json({ jobs })
  } catch (error: any) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/recruitment/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const body = await request.json()
    const validatedData = jobSchema.parse(body)

    // For now, return success with generated ID
    // TODO: Create RecruitmentJob model and save to database
    const newJob = {
      id: `job-${Date.now()}`,
      ...validatedData,
      candidateCount: 0,
      postedDate: new Date().toISOString(),
      expiryDate: validatedData.applicationDeadline || null,
    }

    return NextResponse.json({ job: newJob }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: 'Failed to create job', details: error.message },
      { status: 500 }
    )
  }
}
