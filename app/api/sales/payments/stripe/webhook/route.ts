import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/sales/payments/stripe/webhook
 * Handles Stripe webhook events for payment processing
 * 
 * To enable:
 * 1. Configure webhook endpoint in Stripe Dashboard
 * 2. Add STRIPE_WEBHOOK_SECRET to .env
 * 3. Uncomment the Stripe webhook verification code below
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Uncomment below when Stripe is installed and configured
    /*
    const Stripe = require('stripe')
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      )
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const invoiceId = session.metadata?.invoiceId
      const tenantId = session.metadata?.tenantId

      if (invoiceId && tenantId) {
        // Record the payment
        await prisma.invoicePayment.create({
          data: {
            invoiceId: invoiceId,
            amount: session.amount_total / 100, // Convert from cents
            paymentDate: new Date(),
            paymentMethod: 'CREDIT_CARD',
            paymentReference: session.id,
            notes: `Stripe payment: ${session.id}`,
            createdById: session.metadata?.userId || 'system', // You may want to store user ID in metadata
          },
        })

        // Update invoice status
        const invoice = await prisma.invoice.findUnique({
          where: { id: invoiceId },
          include: { payments: true },
        })

        if (invoice) {
          const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0) + (session.amount_total / 100)
          const invoiceTotal = Number(invoice.totalAmount)

          let newStatus = invoice.status
          if (totalPaid >= invoiceTotal) {
            newStatus = 'PAID'
          } else if (totalPaid > 0) {
            newStatus = 'PARTIALLY_PAID'
          }

          await prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: newStatus },
          })
        }
      }
    }

    return NextResponse.json({ received: true })
    */

    // Placeholder response
    return NextResponse.json(
      {
        error: 'Stripe webhook not enabled',
        message: 'Webhook handling requires Stripe SDK and configuration',
      },
      { status: 501 }
    )
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error.message },
      { status: 500 }
    )
  }
}

