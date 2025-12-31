import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const approveInvoiceSchema = z.object({
  approved: z.boolean(),
  comments: z.string().optional(),
})

// POST /api/finance/invoices/[id]/approve - Approve/reject invoice
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
    const allowedRoles = ['FINANCE_CONTROLLER', 'ORG_ADMIN', 'TENANT_SUPER_ADMIN', 'EXECUTIVE']
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        tenantId: (session.user as any).tenantId,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const body = await request.json()
    const data = approveInvoiceSchema.parse(body)

    // Update invoice
    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        approvedAt: data.approved ? new Date() : null,
        approvedBy: data.approved
          ? {
              connect: { id: (session.user as any).id },
            }
          : undefined,
        status: data.approved ? 'SENT' : invoice.status,
        notes: data.comments ? `${invoice.notes || ''}\n[${new Date().toISOString()}] ${data.comments}`.trim() : invoice.notes,
      },
      include: {
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ invoice: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error approving invoice:', error)
    return NextResponse.json(
      { error: 'Failed to approve invoice', details: error.message },
      { status: 500 }
    )
  }
}

