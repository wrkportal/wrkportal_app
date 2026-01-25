import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/resources/skills - Get skills matrix for all users
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId

    // Get all users with their skills
    const users = await (prisma as any).user.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
      include: {
        userSkills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: {
        firstName: 'asc',
      },
    })

    // Get all unique skills
    const allSkills = await prisma.skill.findMany({
      orderBy: {
        category: 'asc',
        name: 'asc',
      },
    })

    // Build skills matrix
    const skillsMatrix = users.map((user: any) => ({
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      skills: user.userSkills.map((us: any) => ({
        id: us.skill.id,
        name: us.skill.name,
        category: us.skill.category,
        level: us.level,
        yearsOfExperience: us.yearsOfExperience ? Number(us.yearsOfExperience) : null,
      })),
    }))

    return NextResponse.json({
      users: skillsMatrix,
      allSkills,
    })
  } catch (error: any) {
    console.error('Error fetching skills matrix:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skills matrix', details: error.message },
      { status: 500 }
    )
  }
}

