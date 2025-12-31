import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { SalesAutomationEngine } from '@/lib/sales/automation-engine'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage')
    const status = searchParams.get('status')
    const ownerId = searchParams.get('ownerId')
    const accountId = searchParams.get('accountId')
    const search = searchParams.get('search')

    const where: any = {
      tenantId: session.user.tenantId!,
    }

    if (stage) {
      where.stage = stage
    }
    if (status) {
      where.status = status
    }
    if (ownerId) {
      where.ownerId = ownerId
    }
    if (accountId) {
      where.accountId = accountId
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const opportunities = await prisma.salesOpportunity.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        expectedCloseDate: 'asc',
      },
    })

    return NextResponse.json(opportunities)
  } catch (error: any) {
    console.error('Error fetching opportunities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch opportunities', details: error.message },
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
      accountId,
      name,
      description,
      stage,
      amount,
      probability,
      expectedCloseDate,
      type,
      leadSource,
      nextStep,
      competitorInfo,
      ownerId,
      contactIds,
      products,
    } = body

    const opportunity = await prisma.salesOpportunity.create({
      data: {
        tenantId: session.user.tenantId!,
        accountId: accountId || null,
        name,
        description,
        stage: stage || 'PROSPECTING',
        amount: amount || 0,
        probability: probability || 10,
        expectedCloseDate: new Date(expectedCloseDate),
        type: type || null,
        leadSource: leadSource || null,
        nextStep: nextStep || null,
        competitorInfo: competitorInfo || null,
        ownerId: ownerId || session.user.id,
        createdById: session.user.id,
        status: 'OPEN',
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    // Add contacts if provided
    if (contactIds && contactIds.length > 0) {
      await Promise.all(
        contactIds.map((contactId: string, index: number) =>
          prisma.salesOpportunityContact.create({
            data: {
              opportunityId: opportunity.id,
              contactId,
              role: 'DECISION_MAKER',
              isPrimary: index === 0,
            },
          })
        )
      )
    }

    // Add products if provided
    if (products && products.length > 0) {
      await Promise.all(
        products.map((item: any) =>
          prisma.salesOpportunityProduct.create({
            data: {
              opportunityId: opportunity.id,
              productId: item.productId,
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0,
              discount: item.discount || 0,
              totalPrice: (item.quantity || 1) * (item.unitPrice || 0) * (1 - (item.discount || 0) / 100),
              description: item.description || null,
            },
          })
        )
      )
    }

    const fullOpportunity = await prisma.salesOpportunity.findUnique({
      where: { id: opportunity.id },
      include: {
        account: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        contacts: {
          include: {
            contact: true,
          },
        },
        products: {
          include: {
            product: true,
          },
        },
      },
    })

    // Trigger automation
    await SalesAutomationEngine.trigger({
      tenantId: session.user.tenantId!,
      triggerType: 'OPPORTUNITY_CREATED',
      data: { opportunityId: fullOpportunity.id, opportunity: fullOpportunity },
    })

    return NextResponse.json(fullOpportunity, { status: 201 })
  } catch (error: any) {
    console.error('Error creating opportunity:', error)
    return NextResponse.json(
      { error: 'Failed to create opportunity', details: error.message },
      { status: 500 }
    )
  }
}

