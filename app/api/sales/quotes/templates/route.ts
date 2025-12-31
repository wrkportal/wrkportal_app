import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await prisma.salesQuoteTemplate.findMany({
      where: {
        tenantId: session.user.tenantId!,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(templates)
  } catch (error: any) {
    console.error('Error fetching quote templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
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
    const { name, description, templateData, isDefault } = body

    if (!name || !templateData) {
      return NextResponse.json(
        { error: 'Name and template data are required' },
        { status: 400 }
      )
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.salesQuoteTemplate.updateMany({
        where: {
          tenantId: session.user.tenantId!,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    const template = await prisma.salesQuoteTemplate.create({
      data: {
        tenantId: session.user.tenantId!,
        name,
        description: description || null,
        templateData,
        isDefault: isDefault || false,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error: any) {
    console.error('Error creating quote template:', error)
    return NextResponse.json(
      { error: 'Failed to create template', details: error.message },
      { status: 500 }
    )
  }
}

