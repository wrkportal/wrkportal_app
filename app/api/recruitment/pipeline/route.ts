import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/recruitment/pipeline - Get candidate pipeline data grouped by stage
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId

    // Get all candidates (using User model for now)
    // TODO: Replace with RecruitmentCandidate model when available
    const candidates = await prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group candidates by stage (using APPLIED as default for now)
    // TODO: Replace with actual status from RecruitmentCandidate model
    const stages = [
      { id: 'APPLIED', label: 'Applied', color: '#8884d8' },
      { id: 'SCREENING', label: 'Screening', color: '#82ca9d' },
      { id: 'INTERVIEW', label: 'Interview', color: '#ffc658' },
      { id: 'OFFER', label: 'Offer', color: '#ff8042' },
      { id: 'HIRED', label: 'Hired', color: '#a28dff' },
    ]

    const pipeline = stages.map((stage) => {
      // For now, distribute candidates across stages for demo
      // In real implementation, this would come from RecruitmentCandidate.status
      const stageCandidates = candidates
        .filter((_, index) => {
          // Simple distribution for demo - replace with actual status filtering
          const stageIndex = stages.findIndex((s) => s.id === stage.id)
          return index % stages.length === stageIndex
        })
        .map((candidate) => ({
          id: candidate.id,
          name:
            `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() ||
            candidate.email,
          email: candidate.email,
          phone: candidate.phone,
          appliedDate: candidate.createdAt.toISOString(),
          position: candidate.department || 'Not specified',
          rating: 'AVERAGE' as const,
          source: 'WEBSITE' as const,
        }))

      return {
        ...stage,
        candidates: stageCandidates,
        count: stageCandidates.length,
      }
    })

    // Calculate pipeline metrics
    const totalCandidates = candidates.length
    const totalInPipeline = pipeline.reduce(
      (sum, stage) => sum + stage.count,
      0
    )
    const conversionRates = pipeline.map((stage, index) => {
      const previousCount =
        index > 0 ? pipeline[index - 1].count : totalCandidates
      const rate = previousCount > 0 ? (stage.count / previousCount) * 100 : 0
      return {
        stage: stage.id,
        rate: Math.round(rate),
      }
    })

    return NextResponse.json({
      pipeline,
      metrics: {
        totalCandidates,
        totalInPipeline,
        conversionRates,
      },
    })
  } catch (error: any) {
    console.error('Error fetching pipeline:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pipeline data', details: error.message },
      { status: 500 }
    )
  }
}
