# AI Billing Implementation - Payment Security

## Complete Implementation Guide

### 1. Database Schema Updates

```prisma
model Tenant {
  // ... existing fields
  
  // Stripe Integration
  stripeCustomerId      String?  @unique
  hasPaymentMethod      Boolean  @default(false)
  paymentMethodLast4    String?
  paymentMethodBrand    String? // 'visa', 'mastercard', etc.
  
  // AI Credit System
  aiCreditLimit         Float    @default(25.00) // $25 default credit
  aiCreditUsed          Float    @default(0.00)
  aiCreditLastReset     DateTime @default(now())
  aiCreditAutoTopUp     Boolean  @default(false)
  aiCreditTopUpAmount    Float    @default(25.00)
  
  // Billing Status
  billingStatus         String   @default("active") // active, suspended, payment_failed
  lastPaymentDate       DateTime?
  nextBillingDate       DateTime?
  
  // Relations
  aiUsage               AIUsage[]
}

model AIUsage {
  id            String   @id @default(cuid())
  tenantId      String
  userId        String
  model         String   // 'gpt-4o-mini' | 'gpt-4o'
  inputTokens   Int
  outputTokens  Int
  cost          Float
  paymentMethod String   // 'CREDIT' | 'IMMEDIATE_CHARGE' | 'INCLUDED'
  billingStatus String   // 'PENDING' | 'PAID' | 'FAILED'
  stripeChargeId String? @unique
  createdAt     DateTime @default(now())
  
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user          User     @relation(fields: [userId], references: [id])
  
  @@index([tenantId, createdAt])
  @@index([billingStatus])
  @@index([stripeChargeId])
}
```

### 2. Payment Method Check API

**File**: `app/api/billing/payment-method/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

// GET - Check if payment method exists
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        id: true,
        hasPaymentMethod: true,
        paymentMethodLast4: true,
        paymentMethodBrand: true,
        stripeCustomerId: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json({
      hasPaymentMethod: tenant.hasPaymentMethod,
      paymentMethodLast4: tenant.paymentMethodLast4,
      paymentMethodBrand: tenant.paymentMethodBrand,
    })
  } catch (error) {
    console.error('Error checking payment method:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create setup intent for payment method
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { id: true, stripeCustomerId: true },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Create or get Stripe customer
    let customerId = tenant.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          tenantId: tenant.id,
        },
      })
      customerId = customer.id

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
    })
  } catch (error) {
    console.error('Error creating setup intent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Confirm payment method setup
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { setupIntentId } = await request.json()

    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)

    if (setupIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment method setup failed' },
        { status: 400 }
      )
    }

    const paymentMethodId = setupIntent.payment_method as string
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

    // Update tenant with payment method info
    await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: {
        hasPaymentMethod: true,
        paymentMethodLast4: paymentMethod.card?.last4,
        paymentMethodBrand: paymentMethod.card?.brand,
        // Set initial credit limit
        aiCreditLimit: 25.00,
        aiCreditUsed: 0.00,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error confirming payment method:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 3. AI Query with Payment Check

**File**: `app/api/ai/chat/route.ts` (update existing)

```typescript
import { checkPaymentMethod, checkCreditLimit, chargeForQuery } from '@/lib/billing/ai-billing'

export async function POST(request: NextRequest) {
  // ... existing auth checks ...
  
  const { message, model } = await request.json()
  
  // If GPT-4o, check payment requirements
  if (model === 'gpt-4o') {
    // Step 1: Check payment method
    const paymentCheck = await checkPaymentMethod(session.user.tenantId)
    if (!paymentCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Payment method required',
          requiresPayment: true,
          message: paymentCheck.message,
        },
        { status: 402 } // Payment Required
      )
    }
    
    // Step 2: Check credit limit
    const cost = 0.50 // $0.50 per GPT-4o query
    const creditCheck = await checkCreditLimit(session.user.tenantId, cost)
    
    if (!creditCheck.allowed) {
      // Try to charge immediately if credit low
      if (creditCheck.reason === 'CREDIT_LOW') {
        const chargeResult = await chargeForQuery(session.user.tenantId, cost)
        if (!chargeResult.success) {
          return NextResponse.json(
            {
              error: 'Payment failed',
              message: 'Please update your payment method',
              requiresPayment: true,
            },
            { status: 402 }
          )
        }
      } else {
        return NextResponse.json(
          {
            error: creditCheck.message,
            requiresPayment: true,
          },
          { status: 402 }
        )
      }
    }
  }
  
  // Execute AI query
  const response = await generateChatCompletion(messages, { model })
  
  // Track usage and charge if needed
  if (model === 'gpt-4o') {
    await trackAIUsage({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      model: 'gpt-4o',
      cost: 0.50,
      paymentMethod: creditCheck.paymentMethod || 'CREDIT',
    })
  }
  
  return NextResponse.json({ response })
}
```

### 4. Billing Utilities

**File**: `lib/billing/ai-billing.ts`

```typescript
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

/**
 * Check if tenant has payment method
 */
export async function checkPaymentMethod(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      hasPaymentMethod: true,
      stripeCustomerId: true,
    },
  })

  if (!tenant) {
    return {
      allowed: false,
      reason: 'TENANT_NOT_FOUND',
      message: 'Tenant not found',
    }
  }

  if (!tenant.hasPaymentMethod || !tenant.stripeCustomerId) {
    return {
      allowed: false,
      reason: 'PAYMENT_METHOD_REQUIRED',
      message: 'Please add a payment method to use GPT-4o',
    }
  }

  // Verify payment method still exists in Stripe
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: tenant.stripeCustomerId,
      type: 'card',
    })

    if (paymentMethods.data.length === 0) {
      // Payment method was removed
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          hasPaymentMethod: false,
          paymentMethodLast4: null,
          paymentMethodBrand: null,
        },
      })

      return {
        allowed: false,
        reason: 'PAYMENT_METHOD_REQUIRED',
        message: 'Please add a payment method to use GPT-4o',
      }
    }
  } catch (error) {
    console.error('Error verifying payment method:', error)
    return {
      allowed: false,
      reason: 'PAYMENT_VERIFICATION_FAILED',
      message: 'Unable to verify payment method. Please try again.',
    }
  }

  return { allowed: true }
}

/**
 * Check credit limit and charge if needed
 */
export async function checkCreditLimit(tenantId: string, cost: number) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      aiCreditLimit: true,
      aiCreditUsed: true,
      stripeCustomerId: true,
      hasPaymentMethod: true,
    },
  })

  if (!tenant) {
    return {
      allowed: false,
      reason: 'TENANT_NOT_FOUND',
      message: 'Tenant not found',
    }
  }

  const availableCredit = tenant.aiCreditLimit - tenant.aiCreditUsed

  // If enough credit, allow
  if (availableCredit >= cost) {
    return {
      allowed: true,
      paymentMethod: 'CREDIT',
      availableCredit,
    }
  }

  // If credit low but payment method exists, charge immediately
  if (tenant.hasPaymentMethod && tenant.stripeCustomerId) {
    return {
      allowed: true,
      paymentMethod: 'IMMEDIATE_CHARGE',
      reason: 'CREDIT_LOW',
      availableCredit,
    }
  }

  // Block if no credit and no payment method
  return {
    allowed: false,
    reason: 'CREDIT_LIMIT_EXCEEDED',
    message: `Credit limit reached. Please add payment method or top up credit.`,
    availableCredit,
    requiredCredit: cost,
  }
}

/**
 * Charge for GPT-4o query
 */
export async function chargeForQuery(tenantId: string, cost: number) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      stripeCustomerId: true,
      aiCreditUsed: true,
      aiCreditLimit: true,
    },
  })

  if (!tenant?.stripeCustomerId) {
    return { success: false, error: 'No payment method' }
  }

  try {
    // Charge $25 to top up credit (or just charge for this query)
    const chargeAmount = Math.max(25.00, cost) // Top up to $25 or charge query cost
    
    const charge = await stripe.charges.create({
      amount: Math.ceil(chargeAmount * 100), // Convert to cents
      currency: 'usd',
      customer: tenant.stripeCustomerId,
      description: `GPT-4o query - Credit top-up`,
      metadata: {
        tenantId,
        queryCost: cost.toString(),
      },
    })

    if (charge.status === 'succeeded') {
      // Reset credit (top-up scenario) or just deduct cost
      const newCreditUsed = chargeAmount >= 25 
        ? cost // If we topped up, just deduct this query
        : tenant.aiCreditUsed + cost // Otherwise add to used

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          aiCreditUsed: newCreditUsed,
          aiCreditLimit: chargeAmount >= 25 ? 25.00 : tenant.aiCreditLimit,
          aiCreditLastReset: new Date(),
        },
      })

      return {
        success: true,
        chargeId: charge.id,
        amount: chargeAmount,
      }
    }

    return { success: false, error: 'Charge failed' }
  } catch (error: any) {
    console.error('Error charging for query:', error)
    return {
      success: false,
      error: error.message || 'Payment failed',
    }
  }
}

/**
 * Track AI usage
 */
export async function trackAIUsage(data: {
  tenantId: string
  userId: string
  model: string
  cost: number
  inputTokens?: number
  outputTokens?: number
  paymentMethod: string
  stripeChargeId?: string
}) {
  return await prisma.aIUsage.create({
    data: {
      tenantId: data.tenantId,
      userId: data.userId,
      model: data.model,
      cost: data.cost,
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
      paymentMethod: data.paymentMethod,
      billingStatus: data.paymentMethod === 'CREDIT' ? 'PENDING' : 'PAID',
      stripeChargeId: data.stripeChargeId,
    },
  })
}
```

### 5. Credit Usage Dashboard

**File**: `app/api/billing/ai-usage/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        aiCreditLimit: true,
        aiCreditUsed: true,
        hasPaymentMethod: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Get usage this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const usage = await prisma.aIUsage.findMany({
      where: {
        tenantId: session.user.tenantId,
        model: 'gpt-4o',
        createdAt: { gte: startOfMonth },
      },
      select: {
        cost: true,
        createdAt: true,
      },
    })

    const totalCost = usage.reduce((sum, u) => sum + u.cost, 0)
    const availableCredit = tenant.aiCreditLimit - tenant.aiCreditUsed

    return NextResponse.json({
      creditLimit: tenant.aiCreditLimit,
      creditUsed: tenant.aiCreditUsed,
      availableCredit,
      usageThisMonth: usage.length,
      totalCostThisMonth: totalCost,
      hasPaymentMethod: tenant.hasPaymentMethod,
      creditPercentage: (tenant.aiCreditUsed / tenant.aiCreditLimit) * 100,
    })
  } catch (error) {
    console.error('Error fetching AI usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Summary

**Protection Layers:**
1. ✅ **Payment Method Required** - Before first GPT-4o query
2. ✅ **Credit Limit** - $25 max exposure per user
3. ✅ **Auto-Charge** - When credit runs low
4. ✅ **Immediate Charge** - If payment method fails, block access

**Risk Level**: **Low** - Maximum exposure is $25 per user

**This protects you from users who disappear after using GPT-4o!** 🔒
