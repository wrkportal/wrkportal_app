import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/sales/payments/stripe/create-session
 * Creates a Stripe checkout session for invoice payment
 * 
 * Note: This endpoint requires Stripe SDK and API keys to be configured
 * To enable:
 * 1. Install: npm install stripe
 * 2. Add STRIPE_SECRET_KEY to .env
 * 3. Add STRIPE_PUBLISHABLE_KEY to .env (for frontend)
 * 4. Uncomment the Stripe code below
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { invoiceId, amount, currency = 'USD' } = body

    if (!invoiceId || !amount) {
      return NextResponse.json(
        { error: 'invoiceId and amount are required' },
        { status: 400 }
      )
    }

    // Verify invoice exists and belongs to tenant
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId: session.user.tenantId!,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Check if payment gateway is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json(
        { 
          error: 'Payment gateway not configured',
          message: 'Stripe API key not found. Please configure STRIPE_SECRET_KEY in environment variables.',
          instructions: [
            '1. Sign up for Stripe account at https://stripe.com',
            '2. Get your API keys from Stripe Dashboard',
            '3. Add STRIPE_SECRET_KEY to your .env file',
            '4. Add STRIPE_PUBLISHABLE_KEY to your .env file (for frontend)',
            '5. Install Stripe SDK: npm install stripe',
            '6. Restart the server'
          ]
        },
        { status: 503 }
      )
    }

    // Uncomment below when Stripe is installed and configured
    /*
    const Stripe = require('stripe')
    const stripe = new Stripe(stripeKey)

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
              description: invoice.subject || `Payment for invoice ${invoice.invoiceNumber}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/sales-dashboard/invoices?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/sales-dashboard/invoices?payment=cancelled`,
      metadata: {
        invoiceId: invoiceId,
        tenantId: session.user.tenantId!,
      },
    })

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    })
    */

    // Placeholder response when Stripe is not configured
    return NextResponse.json(
      {
        error: 'Stripe integration not enabled',
        message: 'Payment gateway integration requires Stripe SDK installation',
        instructions: [
          '1. Install Stripe: npm install stripe',
          '2. Add STRIPE_SECRET_KEY to .env',
          '3. Add STRIPE_PUBLISHABLE_KEY to .env',
          '4. Uncomment Stripe code in /api/sales/payments/stripe/create-session/route.ts',
          '5. Restart the server'
        ]
      },
      { status: 501 }
    )
  } catch (error: any) {
    console.error('Error creating payment session:', error)
    return NextResponse.json(
      { error: 'Failed to create payment session', details: error.message },
      { status: 500 }
    )
  }
}

