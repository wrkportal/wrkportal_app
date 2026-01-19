# AI Billing Payment Security & Risk Management

## Problem: Payment Risk

**Scenario**: User uses 100 GPT-4o queries ($50), then disappears before paying.

**Risk**: You're left with unpaid charges.

---

## Solutions: Multi-Layer Protection

### Solution 1: Pre-Authorization (Recommended)

**How It Works:**
- Require payment method on file before allowing GPT-4o usage
- Pre-authorize a hold amount (e.g., $10-20)
- Charge immediately or at end of cycle
- If payment fails, block GPT-4o access

**Implementation:**
```typescript
// Before allowing GPT-4o query
async function checkPaymentMethod(userId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { stripeCustomer: true },
  })
  
  if (!tenant.stripeCustomerId || !tenant.hasPaymentMethod) {
    return {
      allowed: false,
      reason: 'PAYMENT_METHOD_REQUIRED',
      message: 'Please add a payment method to use GPT-4o',
    }
  }
  
  // Check if payment method is valid
  const paymentMethod = await stripe.paymentMethods.list({
    customer: tenant.stripeCustomerId,
    type: 'card',
  })
  
  if (paymentMethod.data.length === 0) {
    return {
      allowed: false,
      reason: 'NO_PAYMENT_METHOD',
      message: 'Please add a payment method',
    }
  }
  
  return { allowed: true }
}
```

**Pros:**
- ✅ Payment method guaranteed
- ✅ Can charge immediately if needed
- ✅ Reduces risk significantly

**Cons:**
- ⚠️ Requires Stripe integration
- ⚠️ May reduce GPT-4o usage (friction)

---

### Solution 2: Credit Limit System

**How It Works:**
- Set credit limit per tenant (e.g., $25 for Professional)
- Track usage against limit
- Block GPT-4o when limit reached
- Require payment to increase limit

**Implementation:**
```typescript
// Track credit limit
model Tenant {
  // ... existing fields
  aiCreditLimit      Float     @default(25.00) // $25 credit limit
  aiCreditUsed       Float     @default(0.00)
  aiCreditLastReset  DateTime  @default(now())
}

// Before allowing GPT-4o query
async function checkCreditLimit(tenantId: string, cost: number) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  })
  
  const availableCredit = tenant.aiCreditLimit - tenant.aiCreditUsed
  
  if (availableCredit < cost) {
    return {
      allowed: false,
      reason: 'CREDIT_LIMIT_EXCEEDED',
      message: `Credit limit reached. Please pay outstanding balance to continue.`,
      availableCredit,
      requiredCredit: cost,
    }
  }
  
  return { allowed: true, availableCredit }
}

// After query
await prisma.tenant.update({
  where: { id: tenantId },
  data: {
    aiCreditUsed: { increment: cost },
  },
})
```

**Pros:**
- ✅ Limits exposure
- ✅ Clear spending cap
- ✅ Easy to understand

**Cons:**
- ⚠️ May block legitimate users
- ⚠️ Need to manage credit resets

---

### Solution 3: Immediate Charge (Per Query)

**How It Works:**
- Charge $0.50 immediately when GPT-4o query is used
- No accumulation, no risk
- If payment fails, query is blocked

**Implementation:**
```typescript
// When user uses GPT-4o
async function executeGPT4Query(userId: string, query: string) {
  // Charge immediately
  const charge = await stripe.charges.create({
    amount: 50, // $0.50 in cents
    currency: 'usd',
    customer: tenant.stripeCustomerId,
    description: 'GPT-4o query charge',
    metadata: {
      userId,
      queryType: 'chat',
    },
  })
  
  if (charge.status === 'succeeded') {
    // Execute query
    const response = await generateChatCompletion(messages, { model: 'gpt-4o' })
    
    // Track usage
    await prisma.aIUsage.create({
      data: {
        tenantId,
        userId,
        model: 'gpt-4o',
        cost: 0.50,
        billingStatus: 'PAID',
        stripeChargeId: charge.id,
      },
    })
    
    return response
  } else {
    throw new Error('Payment failed. Please update your payment method.')
  }
}
```

**Pros:**
- ✅ Zero risk (paid upfront)
- ✅ No accumulation
- ✅ Simple billing

**Cons:**
- ⚠️ Many small charges (may annoy users)
- ⚠️ Requires payment method for every query
- ⚠️ Higher Stripe fees (per transaction)

---

### Solution 4: Hybrid Approach (Best Balance)

**How It Works:**
- **Credit limit** (e.g., $25) for GPT-4o usage
- **Pre-authorization** required before first GPT-4o query
- **Immediate charge** when credit limit reached
- **Auto-top-up** option (recharge when low)

**Implementation:**
```typescript
// Step 1: Check payment method (first time)
async function requirePaymentMethod(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  })
  
  if (!tenant.hasPaymentMethod) {
    // Show payment method setup
    return {
      requiresPayment: true,
      message: 'Add payment method to use GPT-4o',
      setupUrl: '/settings/billing/payment-method',
    }
  }
  
  // Set initial credit limit
  if (!tenant.aiCreditLimit) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        aiCreditLimit: 25.00, // $25 initial credit
        aiCreditUsed: 0.00,
      },
    })
  }
  
  return { requiresPayment: false }
}

// Step 2: Check credit before query
async function checkAndCharge(tenantId: string, cost: number) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  })
  
  const availableCredit = tenant.aiCreditLimit - tenant.aiCreditUsed
  
  // If credit available, use it
  if (availableCredit >= cost) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        aiCreditUsed: { increment: cost },
      },
    })
    return { allowed: true, paymentMethod: 'CREDIT' }
  }
  
  // If credit low, charge immediately
  if (availableCredit < cost && tenant.hasPaymentMethod) {
    const charge = await stripe.charges.create({
      amount: Math.ceil(cost * 100), // Convert to cents
      currency: 'usd',
      customer: tenant.stripeCustomerId,
      description: 'GPT-4o query - credit limit reached',
    })
    
    if (charge.status === 'succeeded') {
      // Reset credit and charge
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          aiCreditUsed: 0.00,
          aiCreditLastReset: new Date(),
        },
      })
      
      return { allowed: true, paymentMethod: 'IMMEDIATE_CHARGE' }
    }
  }
  
  // Block if payment fails
  return {
    allowed: false,
    reason: 'PAYMENT_REQUIRED',
    message: 'Please add payment method or pay outstanding balance',
  }
}
```

**Pros:**
- ✅ Limits exposure ($25 max)
- ✅ Smooth UX (credit buffer)
- ✅ Auto-charge when needed
- ✅ Payment method required upfront

**Cons:**
- ⚠️ More complex implementation
- ⚠️ Need to handle edge cases

---

## Recommended: Hybrid Approach

### Implementation Plan

**1. Payment Method Required:**
- Before first GPT-4o query, require payment method
- Store in Stripe Customer
- Mark `hasPaymentMethod = true` in database

**2. Credit Limit System:**
- Professional: $25 credit limit
- Business: $100 credit limit
- Enterprise: $500 credit limit (or unlimited with approval)

**3. Usage Tracking:**
- Track all GPT-4o usage against credit
- Show usage dashboard: "You've used $15 of $25 credit"

**4. Auto-Charge When Low:**
- When credit < $5, charge $25 immediately
- Or require manual top-up
- Block GPT-4o if payment fails

**5. Monthly Billing:**
- At end of month, charge for base plan + any remaining credit used
- Reset credit limit
- If payment fails, suspend account

---

## Database Schema

```prisma
model Tenant {
  // ... existing fields
  
  // Payment & Billing
  stripeCustomerId      String?  @unique
  hasPaymentMethod      Boolean  @default(false)
  paymentMethodLast4    String?
  paymentMethodBrand    String?
  
  // AI Credit System
  aiCreditLimit         Float    @default(25.00)
  aiCreditUsed          Float    @default(0.00)
  aiCreditLastReset     DateTime @default(now())
  aiCreditAutoTopUp     Boolean  @default(false)
  aiCreditTopUpAmount    Float    @default(25.00)
  
  // Billing
  billingStatus         String   @default("active") // active, suspended, cancelled
  lastPaymentDate       DateTime?
  nextBillingDate       DateTime?
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
  stripeChargeId String?
  createdAt     DateTime @default(now())
  
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  user          User     @relation(fields: [userId], references: [id])
  
  @@index([tenantId, createdAt])
  @@index([billingStatus])
}
```

---

## UI Flow

### 1. First GPT-4o Query Attempt

```tsx
// User tries to use GPT-4o
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  body: JSON.stringify({ model: 'gpt-4o', message }),
})

if (response.status === 402) {
  // Payment required
  const data = await response.json()
  
  // Show payment method setup dialog
  <PaymentMethodRequiredDialog
    open={true}
    onComplete={() => retryQuery()}
  />
}
```

### 2. Credit Limit Warning

```tsx
// Show credit usage
<Card>
  <CardHeader>
    <CardTitle>AI Credit Usage</CardTitle>
  </CardHeader>
  <CardContent>
    <Progress value={(used / limit) * 100} />
    <p className="text-sm mt-2">
      ${used.toFixed(2)} of ${limit.toFixed(2)} used
    </p>
    {used / limit > 0.8 && (
      <Alert>
        <AlertTitle>Credit Running Low</AlertTitle>
        <AlertDescription>
          You've used {((used / limit) * 100).toFixed(0)}% of your credit.
          {autoTopUp ? 'We'll auto-charge $25 when credit runs out.' : 'Please top up to continue using GPT-4o.'}
        </AlertDescription>
      </Alert>
    )}
  </CardContent>
</Card>
```

### 3. Payment Method Setup

```tsx
// components/billing/payment-method-setup.tsx
export function PaymentMethodSetup() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Payment Method</CardTitle>
        <CardDescription>
          Required to use GPT-4o. You'll get $25 credit to start.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StripeElements>
          <PaymentElement />
          <Button onClick={handleSubmit}>
            Add Payment Method
          </Button>
        </StripeElements>
      </CardContent>
    </Card>
  )
}
```

---

## Risk Mitigation Summary

| Solution | Risk Level | UX Impact | Implementation |
|----------|-----------|-----------|----------------|
| **Pre-Authorization** | Low | Medium | Medium |
| **Credit Limit** | Medium | Low | Easy |
| **Immediate Charge** | Very Low | High | Easy |
| **Hybrid (Recommended)** | Low | Low | Medium |

---

## Recommended Implementation

### Step 1: Payment Method Required
- Before first GPT-4o query, require payment method
- Use Stripe Elements for secure card collection
- Store customer ID in database

### Step 2: Credit Limit ($25 for Professional)
- Set credit limit based on tier
- Track usage in real-time
- Show usage dashboard

### Step 3: Auto-Charge When Low
- When credit < $5, charge $25 automatically
- Or require manual top-up
- Block GPT-4o if payment fails

### Step 4: Monthly Billing
- Charge base plan + credit used
- Reset credit limit
- Suspend if payment fails

---

## Code Implementation

See `docs/AI_BILLING_IMPLEMENTATION.md` for full code examples.

---

**This hybrid approach limits your risk to $25 per user while maintaining good UX!** 🔒
