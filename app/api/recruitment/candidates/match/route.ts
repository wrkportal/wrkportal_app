import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const matchSchema = z.object({
  jobId: z.string().optional(),
  requiredSkills: z.array(z.string()).optional(),
  experienceMin: z.number().optional(),
  experienceMax: z.number().optional(),
  department: z.string().optional(),
  limit: z.number().default(10),
})

// POST /api/recruitment/candidates/match - Match candidates to job requirements
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const body = await request.json()
    const validatedData = matchSchema.parse(body)

    // Get all candidates
    const candidates = await prisma.user.findMany({
      where: { tenantId },
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
    })

    // Calculate match scores
    const scoredCandidates = candidates.map((candidate: any) => {
      let score = 0
      let maxScore = 0
      const reasons: string[] = []

      // Department match (30 points)
      maxScore += 30
      if (
        validatedData.department &&
        candidate.department === validatedData.department
      ) {
        score += 30
        reasons.push('Department match')
      }

      // Skills match (50 points)
      maxScore += 50
      if (
        validatedData.requiredSkills &&
        validatedData.requiredSkills.length > 0
      ) {
        const candidateSkills = candidate.skills.map((s: any) =>
          s.skill.name.toLowerCase()
        )
        const matchingSkills = validatedData.requiredSkills.filter((skill: any) =>
          candidateSkills.includes(skill.toLowerCase())
        )
        const skillMatchPercentage =
          matchingSkills.length / validatedData.requiredSkills.length
        score += Math.round(50 * skillMatchPercentage)
        if (matchingSkills.length > 0) {
          reasons.push(
            `${matchingSkills.length}/${validatedData.requiredSkills.length} skills match`
          )
        }
      }

      // Experience match (20 points)
      maxScore += 20
      // TODO: Get actual experience from RecruitmentCandidate model
      // For now, use a placeholder
      const candidateExperience = 0 // Placeholder
      if (
        validatedData.experienceMin !== undefined &&
        validatedData.experienceMax !== undefined
      ) {
        if (
          candidateExperience >= validatedData.experienceMin &&
          candidateExperience <= validatedData.experienceMax
        ) {
          score += 20
          reasons.push('Experience range match')
        }
      }

      const matchPercentage =
        maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

      return {
        candidate: {
          id: candidate.id,
          name:
            `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() ||
            candidate.email,
          email: candidate.email,
          phone: candidate.phone,
          department: candidate.department,
          location: candidate.location,
        },
        score: matchPercentage,
        reasons,
        skills: candidate.skills.map((s: any) => s.skill.name),
      }
    })

    // Sort by score (descending) and limit
    const topMatches = scoredCandidates
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, validatedData.limit)

    return NextResponse.json({
      matches: topMatches,
      totalCandidates: candidates.length,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error matching candidates:', error)
    return NextResponse.json(
      { error: 'Failed to match candidates', details: error.message },
      { status: 500 }
    )
  }
}
