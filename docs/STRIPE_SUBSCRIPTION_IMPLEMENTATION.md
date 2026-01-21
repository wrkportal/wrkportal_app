# Stripe Subscription Payment Implementation Guide

## Overview

This guide will help you implement subscription payments using Stripe, allowing users to select and pay for subscription plans (Free, Starter, Professional, Business, Enterprise).

## Current State

- ✅ Pricing plans defined in landing page
- ✅ Tier system exists (`lib/utils/tier-utils.ts`)
- ❌ No payment processing for subscriptions
- ✅ Stripe infrastructure exists for invoices (but commented out)

## Implementation Steps

### Step 1: Install Stripe SDK

```bash
npm install stripe @stripe/stripe-js
```

### Step 2: Get Stripe API Keys

1. **Sign up for Stripe:**
   - Go to [stripe.com](https://stripe.com)
   - Create account (free to start)
   - Use test mode first

2. **Get API Keys:**
   - Dashboard → Developers → API keys
   - Copy:
     - **Publishable key** (starts with `pk_test_...` or `pk_live_...`)
     - **Secret key** (starts with `sk_test_...` or `sk_live_...`)

3. **Create Webhook Endpoint:**
   - Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-app.vercel.app/api/subscriptions/webhook`
   - Select events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `checkout.session.completed`
   - Copy **Signing secret** (starts with `whsec_...`)

### Step 3: Add Environment Variables

Add to Vercel Environment Variables:

```
STRIPE_SECRET_KEY=sk_test_... (use sk_live_... in production)
STRIPE_PUBLISHABLE_KEY=pk_test_... (use pk_live_... in production)
STRIPE_WEBHOOK_SECRET=whsec_... (from webhook setup)
```

### Step 4: Update Prisma Schema

Add subscription fields to User model:

```prisma
model User {
  // ... existing fields ...
  
  stripeCustomerId      String?  @unique
  stripeSubscriptionId  String?  @unique
  subscriptionStatus    String?  // active, canceled, past_due, etc.
  subscriptionTier      String?  // free, starter, professional, business, enterprise
  subscriptionStartDate DateTime?
  subscriptionEndDate   DateTime?
}
```

Then run:
```bash
npx prisma migrate dev --name add_subscription_fields
npx prisma generate
```

### Step 5: Create Subscription API Routes

#### A. Create Checkout Session (`app/api/subscriptions/create/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, billingPeriod } = body // 'monthly' or 'yearly'

    // Plan pricing (match your landing page)
    const plans = {
      starter: { monthly: 8, yearly: 76 },
      professional: { monthly: 15, yearly: 144 },
      business: { monthly: 25, yearly: 240 },
      enterprise: { monthly: 50, yearly: 480 },
    }

    const price = plans[planId as keyof typeof plans]?.[billingPeriod as 'monthly' | 'yearly']
    if (!price) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Get or create Stripe customer
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    let customerId = user?.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user?.email || '',
        metadata: {
          userId: session.user.id,
        },
      })
      customerId = customer.id

      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      })
    }

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
              description: `wrkportal.com ${planId} subscription`,
            },
            unit_amount: price * 100, // Convert to cents
            recurring: {
              interval: billingPeriod === 'yearly' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${request.headers.get('origin')}/settings/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/settings/subscription?canceled=true`,
      metadata: {
        userId: session.user.id,
        planId,
        billingPeriod,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
```

#### B. Create Webhook Handler (`app/api/subscriptions/webhook/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const planId = session.metadata?.planId

        if (userId && planId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionTier: planId,
              subscriptionStatus: 'active',
              subscriptionStartDate: new Date(),
            },
          })
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
              subscriptionTier: subscription.metadata?.planId || user.subscriptionTier,
            },
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: 'canceled',
              subscriptionTier: 'free',
              subscriptionEndDate: new Date(),
            },
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
```

### Step 6: Create Subscription Management Page

Create `app/settings/subscription/page.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function SubscriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(false)

  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  const handleSubscribe = async (planId: string, billingPeriod: 'monthly' | 'yearly') => {
    try {
      setLoading(true)
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingPeriod }),
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Subscription error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>Manage your subscription plan</CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
              <CheckCircle2 className="h-5 w-5 text-green-600 inline mr-2" />
              Subscription activated successfully!
            </div>
          )}
          {canceled && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <XCircle className="h-5 w-5 text-yellow-600 inline mr-2" />
              Subscription canceled. No charges were made.
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Current Plan</h3>
              <Badge>{user?.subscriptionTier || 'free'}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {/* Starter Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <CardDescription>$8/user/month</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleSubscribe('starter', 'monthly')}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
                  </Button>
                </CardContent>
              </Card>

              {/* Professional Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Professional</CardTitle>
                  <CardDescription>$15/user/month</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleSubscribe('professional', 'monthly')}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
                  </Button>
                </CardContent>
              </Card>

              {/* Business Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Business</CardTitle>
                  <CardDescription>$25/user/month</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleSubscribe('business', 'monthly')}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Step 7: Update Landing Page to Link to Subscription

Update the "Get Started" buttons in `app/(marketing)/landing/page.tsx` to redirect to subscription page or create checkout session directly.

### Step 8: Test the Flow

1. **Use Stripe Test Mode:**
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any CVC
   - Any ZIP code

2. **Test Scenarios:**
   - Successful subscription
   - Canceled checkout
   - Webhook events
   - Subscription updates

3. **Switch to Live Mode:**
   - Only after thorough testing
   - Update environment variables with live keys
   - Update webhook endpoint in Stripe dashboard

---

## Important Notes

1. **Webhook Security:** Always verify webhook signatures
2. **Idempotency:** Handle duplicate webhook events
3. **Error Handling:** Log all payment errors
4. **User Experience:** Show clear success/error messages
5. **Testing:** Always test in Stripe test mode first

---

## Next Steps After Implementation

1. Add subscription cancellation flow
2. Add upgrade/downgrade functionality
3. Add billing history page
4. Add invoice download
5. Add payment method management
6. Set up email notifications for subscription events
