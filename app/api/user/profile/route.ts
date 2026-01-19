import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  landingPage: z.string().optional(),
  avatar: z.string().nullable().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  department: z.string().optional(),
  primaryWorkflowType: z
    .enum([
      'SOFTWARE_DEVELOPMENT',
      'PRODUCT_MANAGEMENT',
      'MARKETING',
      'HUMAN_RESOURCES',
      'LEGAL',
      'CUSTOMER_SERVICE',
      'OPERATIONS',
      'IT_SUPPORT',
      'FINANCE',
      'SALES',
      'GENERAL',
    ])
    .nullable()
    .optional(),
  workflowSettings: z.record(z.any()).optional(),
  assistantName: z.string().min(1).max(50).optional().nullable(),
  voiceSampleUrl: z.string().url().optional().nullable(),
})

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = updateProfileSchema.parse(body)

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true,
        avatar: true,
        timezone: true,
        locale: true,
        landingPage: true,
        phone: true,
        location: true,
        department: true,
        primaryWorkflowType: true,
        workflowSettings: true,
        assistantName: true,
        voiceSampleUrl: true,
        status: true,
        lastLogin: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
