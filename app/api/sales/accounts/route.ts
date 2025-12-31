import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { AutoActivityCapture } from '@/lib/sales/auto-activity-capture'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const ownerId = searchParams.get('ownerId')
    const search = searchParams.get('search')

    const where: any = {
      tenantId: session.user.tenantId!,
    }

    if (type) {
      where.type = type
    }
    if (status) {
      where.status = status
    }
    if (ownerId) {
      where.ownerId = ownerId
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const accounts = await prisma.salesAccount.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        parentAccount: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            contacts: true,
            opportunities: true,
            activities: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(accounts)
  } catch (error: any) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts', details: error.message },
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
      type,
      industry,
      website,
      phone,
      email,
      billingAddress,
      shippingAddress,
      annualRevenue,
      numberOfEmployees,
      description,
      ownerId,
      parentAccountId,
      rating,
    } = body

    const account = await prisma.salesAccount.create({
      data: {
        tenantId: session.user.tenantId!,
        name,
        type: type || 'CUSTOMER',
        industry: industry || null,
        website: website || null,
        phone: phone || null,
        email: email || null,
        billingAddress: billingAddress || null,
        shippingAddress: shippingAddress || null,
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : null,
        numberOfEmployees: numberOfEmployees ? parseInt(numberOfEmployees) : null,
        description: description || null,
        ownerId: ownerId || session.user.id,
        parentAccountId: parentAccountId || null,
        status: 'ACTIVE',
        rating: rating || null,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        parentAccount: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Automatically capture activity for account creation
    await AutoActivityCapture.capture({
      tenantId: session.user.tenantId!,
      userId: session.user.id,
      type: 'ACCOUNT_CREATED',
      data: {
        accountId: account.id,
        account,
      },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error: any) {
    console.error('Error creating account:', error)
    return NextResponse.json(
      { error: 'Failed to create account', details: error.message },
      { status: 500 }
    )
  }
}

