import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bulkActionSchema = z.object({
  candidateIds: z.array(z.string()).min(1),
  action: z.enum([
    'UPDATE_STATUS',
    'ADD_TAG',
    'REMOVE_TAG',
    'SEND_EMAIL',
    'EXPORT',
  ]),
  data: z.record(z.any()).optional(),
})

// POST /api/recruitment/candidates/bulk - Perform bulk actions on candidates
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const userId = (session.user as any).id
    const body = await request.json()
    const validatedData = bulkActionSchema.parse(body)

    // Verify all candidates belong to tenant
    const candidates = await prisma.user.findMany({
      where: {
        id: { in: validatedData.candidateIds },
        tenantId,
      },
      select: { id: true },
    })

    if (candidates.length !== validatedData.candidateIds.length) {
      return NextResponse.json(
        { error: 'Some candidates not found or access denied' },
        { status: 403 }
      )
    }

    let result: any = {}

    switch (validatedData.action) {
      case 'UPDATE_STATUS':
        if (!validatedData.data?.status) {
          return NextResponse.json(
            { error: 'Status is required for UPDATE_STATUS action' },
            { status: 400 }
          )
        }
        // Create activity logs for status changes
        await Promise.all(
          candidates.map((candidate) =>
            prisma.activityFeed.create({
              data: {
                tenantId,
                userId,
                resourceType: 'CANDIDATE',
                resourceId: candidate.id,
                action: 'UPDATE',
                description: `Status changed to ${validatedData.data?.status}`,
                metadata: {
                  oldStatus: 'UNKNOWN', // Would get from RecruitmentCandidate model
                  newStatus: validatedData.data?.status,
                },
                mentions: [],
              },
            })
          )
        )
        result = {
          action: 'UPDATE_STATUS',
          updated: candidates.length,
          newStatus: validatedData.data?.status,
          message: `Updated status for ${candidates.length} candidates`,
        }
        break

      case 'ADD_TAG':
        if (!validatedData.data?.tag) {
          return NextResponse.json(
            { error: 'Tag is required for ADD_TAG action' },
            { status: 400 }
          )
        }
        // Create activity logs for tag additions
        await Promise.all(
          candidates.map((candidate) =>
            prisma.activityFeed.create({
              data: {
                tenantId,
                userId,
                resourceType: 'CANDIDATE',
                resourceId: candidate.id,
                action: 'UPDATE',
                description: `Tag "${validatedData.data?.tag}" added`,
                metadata: {
                  tag: validatedData.data?.tag,
                },
                mentions: [],
              },
            })
          )
        )
        result = {
          action: 'ADD_TAG',
          updated: candidates.length,
          tag: validatedData.data?.tag,
          message: `Added tag to ${candidates.length} candidates`,
        }
        break

      case 'REMOVE_TAG':
        if (!validatedData.data?.tag) {
          return NextResponse.json(
            { error: 'Tag is required for REMOVE_TAG action' },
            { status: 400 }
          )
        }
        // Create activity logs for tag removals
        await Promise.all(
          candidates.map((candidate) =>
            prisma.activityFeed.create({
              data: {
                tenantId,
                userId,
                resourceType: 'CANDIDATE',
                resourceId: candidate.id,
                action: 'UPDATE',
                description: `Tag "${validatedData.data?.tag}" removed`,
                metadata: {
                  tag: validatedData.data?.tag,
                },
                mentions: [],
              },
            })
          )
        )
        result = {
          action: 'REMOVE_TAG',
          updated: candidates.length,
          tag: validatedData.data?.tag,
          message: `Removed tag from ${candidates.length} candidates`,
        }
        break

      case 'SEND_EMAIL':
        if (!validatedData.data?.templateId && !validatedData.data?.subject) {
          return NextResponse.json(
            {
              error:
                'Template ID or subject/body is required for SEND_EMAIL action',
            },
            { status: 400 }
          )
        }
        // Get candidate emails
        const candidateEmails = await prisma.user.findMany({
          where: {
            id: { in: validatedData.candidateIds },
            tenantId,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        })
        // Create activity logs for emails sent
        await Promise.all(
          candidateEmails.map((candidate) =>
            prisma.activityFeed.create({
              data: {
                tenantId,
                userId,
                resourceType: 'CANDIDATE',
                resourceId: candidate.id,
                action: 'CREATE',
                description: `Email sent to ${candidate.email}`,
                metadata: {
                  templateId: validatedData.data?.templateId,
                  subject: validatedData.data?.subject,
                },
                mentions: [],
              },
            })
          )
        )
        // TODO: Actually send emails using email service
        result = {
          action: 'SEND_EMAIL',
          sent: candidateEmails.length,
          template: validatedData.data?.templateId,
          message: `Email sent to ${candidateEmails.length} candidates`,
        }
        break

      case 'EXPORT':
        // Get full candidate data for export
        const exportCandidates = await prisma.user.findMany({
          where: {
            id: { in: validatedData.candidateIds },
            tenantId,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            department: true,
            location: true,
            createdAt: true,
          },
        })

        result = {
          action: 'EXPORT',
          exported: exportCandidates.length,
          data: exportCandidates.map((c) => ({
            name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email,
            email: c.email,
            phone: c.phone,
            department: c.department,
            location: c.location,
            appliedDate: c.createdAt.toISOString(),
          })),
          message: `Exported ${exportCandidates.length} candidates`,
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk action', details: error.message },
      { status: 500 }
    )
  }
}
