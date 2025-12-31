import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * Sales Automation Rules API
 * CRUD operations for automation rules
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const triggerType = searchParams.get('triggerType')

    const where: any = {
      tenantId: session.user.tenantId!,
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }
    if (triggerType) {
      where.triggerType = triggerType
    }

    const rules = await prisma.salesAutomationRule.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        priority: 'desc',
      },
    })

    return NextResponse.json(rules)
  } catch (error: any) {
    console.error('Error fetching automation rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch automation rules', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      triggerType,
      triggerConditions,
      actionType,
      actionConfig,
      isActive,
      priority,
    } = body

    const rule = await prisma.salesAutomationRule.create({
      data: {
        tenantId: session.user.tenantId!,
        name,
        description: description || null,
        triggerType: triggerType as any,
        triggerConditions: triggerConditions || {},
        actionType: actionType as any,
        actionConfig: actionConfig || {},
        isActive: isActive !== false,
        priority: priority || 0,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(rule, { status: 201 })
  } catch (error: any) {
    console.error('Error creating automation rule:', error)
    return NextResponse.json(
      { error: 'Failed to create automation rule', details: error.message },
      { status: 500 }
    )
  }
}

