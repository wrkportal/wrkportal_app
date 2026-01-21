import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

// Lazy initialization of Stripe client to avoid build errors when API key is missing
function getStripeClient(): Stripe | null {
  const apiKey = process.env.STRIPE_SECRET_KEY
  if (!apiKey) {
    return null
  }
  return new Stripe(apiKey, {
    apiVersion: '2024-11-20.acacia',
  })
}

// Plan pricing configuration (matches landing page)
const PLAN_PRICING = {
  starter: { monthly: 8, yearly: 76 },
  professional: { monthly: 15, yearly: 144 },
  business: { monthly: 25, yearly: 240 },
  enterprise: { monthly: 50, yearly: 480 },
} as const

type PlanId = keyof typeof PLAN_PRICING
type BillingPeriod = 'monthly' | 'yearly'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, billingPeriod }: { planId: PlanId; billingPeriod: BillingPeriod } = body

    // Validate plan
    if (!planId || !PLAN_PRICING[planId]) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    if (!billingPeriod || (billingPeriod !== 'monthly' && billingPeriod !== 'yearly')) {
      return NextResponse.json({ error: 'Invalid billing period' }, { status: 400 })
    }

    // Get user
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get Stripe client
    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json(
        {
          error: 'Payment gateway not configured',
          message: 'Stripe API key not found. Please configure STRIPE_SECRET_KEY in environment variables.',
        },
        { status: 503 }
      )
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: session.user.id,
          tenantId: user.tenantId,
        },
      })
      customerId = customer.id

      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Get price
    const price = PLAN_PRICING[planId][billingPeriod]
    const priceInCents = Math.round(price * 100)

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
              description: `wrkportal.com ${planId} subscription - ${billingPeriod} billing`,
            },
            unit_amount: priceInCents,
            recurring: {
              interval: billingPeriod === 'yearly' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${request.headers.get('origin') || process.env.NEXTAUTH_URL}/settings/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin') || process.env.NEXTAUTH_URL}/settings/subscription?canceled=true`,
      metadata: {
        userId: session.user.id,
        planId,
        billingPeriod,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          planId,
          billingPeriod,
        },
      },
    })

    return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
