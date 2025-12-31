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
    const accountId = searchParams.get('accountId')
    const status = searchParams.get('status')
    const ownerId = searchParams.get('ownerId')
    const search = searchParams.get('search')

    const where: any = {
      tenantId: session.user.tenantId!,
    }

    if (accountId) {
      where.accountId = accountId
    }
    if (status) {
      where.status = status
    }
    if (ownerId) {
      where.ownerId = ownerId
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const contacts = await prisma.salesContact.findMany({
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
        reportsTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            activities: true,
            opportunities: true,
          },
        },
      },
      orderBy: {
        lastName: 'asc',
      },
    })

    return NextResponse.json(contacts)
  } catch (error: any) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts', details: error.message },
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
      firstName,
      lastName,
      email,
      phone,
      mobile,
      title,
      department,
      mailingAddress,
      description,
      ownerId,
      reportsToId,
      leadSource,
    } = body

    const contact = await prisma.salesContact.create({
      data: {
        tenantId: session.user.tenantId!,
        accountId: accountId || null,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        mobile: mobile || null,
        title: title || null,
        department: department || null,
        mailingAddress: mailingAddress || null,
        description: description || null,
        ownerId: ownerId || session.user.id,
        reportsToId: reportsToId || null,
        status: 'ACTIVE',
        leadSource: leadSource || null,
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

    // Automatically capture activity for contact creation
    await AutoActivityCapture.capture({
      tenantId: session.user.tenantId!,
      userId: session.user.id,
      type: 'CONTACT_CREATED',
      data: {
        contactId: contact.id,
        contact,
      },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error: any) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Failed to create contact', details: error.message },
      { status: 500 }
    )
  }
}

