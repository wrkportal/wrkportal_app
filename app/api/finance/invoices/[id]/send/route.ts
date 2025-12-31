import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST /api/finance/invoices/[id]/send - Send invoice to client
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const userRole = (session.user as any).role
    const allowedRoles = ['FINANCE_CONTROLLER', 'ORG_ADMIN', 'TENANT_SUPER_ADMIN', 'PROJECT_MANAGER']
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        tenantId: (session.user as any).tenantId,
      },
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
        lineItems: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Only send invoices that are in DRAFT or SENT status
    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
      return NextResponse.json(
        { error: `Cannot send invoice with status: ${invoice.status}` },
        { status: 400 }
      )
    }

    // Update invoice status to SENT
    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
        lineItems: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // TODO: In production, integrate with email service to send invoice PDF
    // For now, we just update the status
    // Example: await sendInvoiceEmail(invoice, pdfBuffer)

    return NextResponse.json({
      invoice: updated,
      message: 'Invoice sent successfully',
      // In production, include email delivery status
      emailSent: false, // Placeholder
    })
  } catch (error: any) {
    console.error('Error sending invoice:', error)
    return NextResponse.json(
      { error: 'Failed to send invoice', details: error.message },
      { status: 500 }
    )
  }
}

