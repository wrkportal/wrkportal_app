# AI Model Selection UX & Billing Flow

## User Experience Flow

### 1. Initial Plan Selection

**When user selects Professional Plan ($15/month):**
- Default model: **GPT-4o Mini** (included)
- User pays $15 upfront
- Gets 50 queries/month included (GPT-4o Mini)

---

## Where Users Can Change Model

### Option A: Settings Page (Recommended)

**Location**: `app/settings/page.tsx` or `app/settings/ai/page.tsx`

**UI Component:**
```tsx
// components/settings/ai-model-selector.tsx
export function AIModelSelector() {
  const [currentModel, setCurrentModel] = useState('gpt-4o-mini')
  const [availableModels] = useState(['gpt-4o-mini', 'gpt-4o'])
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Model Preferences</CardTitle>
        <CardDescription>
          Choose your default AI model. You can change this anytime.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={currentModel} onValueChange={handleModelChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4o-mini">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">GPT-4o Mini</div>
                  <div className="text-sm text-muted-foreground">
                    Cost-effective, great for most tasks
                  </div>
                </div>
                <Badge variant="secondary">Included</Badge>
              </div>
            </SelectItem>
            <SelectItem value="gpt-4o">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">GPT-4o</div>
                  <div className="text-sm text-muted-foreground">
                    Premium quality, advanced reasoning
                  </div>
                </div>
                <Badge variant="default">$0.50/query</Badge>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="text-sm">
            <strong>Billing:</strong> GPT-4o queries are charged per-use, 
            even within your monthly quota. Charges appear on your next invoice.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Option B: AI Chat Interface

**Location**: In the AI chat component itself

**UI Component:**
```tsx
// components/ai/chat-interface.tsx
export function AIChatInterface() {
  return (
    <div>
      {/* Model selector in chat header */}
      <div className="flex items-center justify-between p-2 border-b">
        <ModelSelector />
        <Badge>50/50 queries used</Badge>
      </div>
      
      {/* Chat messages */}
    </div>
  )
}
```

### Option C: Both (Recommended)

- **Settings Page**: Set default model preference
- **Chat Interface**: Override for individual queries

---

## Billing Model Options

### Option 1: Per-Query Billing (Recommended)

**How It Works:**
- User pays $15/month for Professional plan
- Gets 50 GPT-4o Mini queries included
- If they use GPT-4o: **$0.50 per query** (charged immediately or at end of cycle)
- Charges accumulate and appear on next invoice

**Pros:**
- ✅ Flexible - no plan upgrade needed
- ✅ Pay only for what you use
- ✅ Can switch models anytime

**Cons:**
- ⚠️ Need to track usage and bill separately

**Implementation:**
```typescript
// When user uses GPT-4o query
if (model === 'gpt-4o' && tier === 'professional') {
  // Track usage
  await prisma.aIUsage.create({
    data: {
      tenantId,
      userId,
      model: 'gpt-4o',
      inputTokens,
      outputTokens,
      cost: 0.50, // Fixed per-query cost
      queryType: 'chat',
      billingStatus: 'PENDING', // Will be billed at end of cycle
    },
  })
  
  // Show user notification
  showNotification({
    message: 'GPT-4o query used. $0.50 will be added to your next invoice.',
    type: 'info',
  })
}
```

---

### Option 2: Immediate Charge (Credit Card Required)

**How It Works:**
- User must have payment method on file
- GPT-4o queries charged immediately via Stripe
- $0.50 per query, charged right away

**Pros:**
- ✅ No billing complexity
- ✅ Immediate payment

**Cons:**
- ⚠️ Requires payment method upfront
- ⚠️ May discourage usage
- ⚠️ Multiple small charges

**Implementation:**
```typescript
// When user uses GPT-4o query
if (model === 'gpt-4o' && tier === 'professional') {
  // Charge immediately
  const charge = await stripe.charges.create({
    amount: 50, // $0.50 in cents
    currency: 'usd',
    customer: tenant.stripeCustomerId,
    description: 'GPT-4o query charge',
  })
  
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
}
```

---

### Option 3: Require Plan Upgrade

**How It Works:**
- User must upgrade to Business plan ($25/month) to use GPT-4o
- No per-query charges
- All queries included in plan

**Pros:**
- ✅ Simple billing
- ✅ Predictable costs
- ✅ Encourages upgrades

**Cons:**
- ⚠️ Less flexible
- ⚠️ May lose users who want occasional GPT-4o

**Implementation:**
```typescript
// When user tries to use GPT-4o
if (model === 'gpt-4o' && tier === 'professional') {
  return {
    error: 'GPT-4o requires Business plan upgrade',
    upgradeRequired: true,
    currentPlan: 'professional',
    requiredPlan: 'business',
    upgradeUrl: '/settings/billing/upgrade',
  }
}
```

---

## Recommended Approach: Hybrid Model

### Best User Experience

**1. Default Model Selection (Settings)**
- User sets default model in Settings → AI Preferences
- Can change anytime, no charge for changing preference

**2. Per-Query Billing**
- GPT-4o Mini: Included in plan (within quota)
- GPT-4o: $0.50 per query (billed at end of cycle)
- User sees cost before using GPT-4o

**3. Usage Dashboard**
- Show queries used vs quota
- Show pending charges for GPT-4o queries
- Show estimated monthly cost

**4. In-Chat Model Selection**
- User can choose model per query
- Show cost warning before using GPT-4o
- Confirm before executing expensive query

---

## Implementation Flow

### Step 1: User Changes Model in Settings

```typescript
// app/api/settings/ai-model/route.ts
export async function POST(request: NextRequest) {
  const { model } = await request.json()
  
  // Update user preference
  await prisma.user.update({
    where: { id: userId },
    data: { preferredAIModel: model },
  })
  
  return NextResponse.json({
    success: true,
    message: model === 'gpt-4o' 
      ? 'GPT-4o selected. Queries will be charged $0.50 each.'
      : 'GPT-4o Mini selected. Queries are included in your plan.',
  })
}
```

### Step 2: User Uses AI Chat

```typescript
// app/api/ai/chat/route.ts
export async function POST(request: NextRequest) {
  const { message, model: requestedModel } = await request.json()
  
  // Get user's preferred model or use requested
  const model = requestedModel || user.preferredAIModel || tierDefault
  
  // Check if GPT-4o requires payment
  if (model === 'gpt-4o' && tier === 'professional') {
    // Show cost warning (if not already confirmed)
    if (!request.confirmed) {
      return NextResponse.json({
        requiresConfirmation: true,
        cost: 0.50,
        message: 'This query will cost $0.50. Continue?',
      })
    }
  }
  
  // Execute query
  const response = await generateChatCompletion(messages, { model })
  
  // Track usage and cost
  if (model === 'gpt-4o' && tier === 'professional') {
    await trackAIUsage({
      tenantId,
      userId,
      model: 'gpt-4o',
      cost: 0.50,
      billingStatus: 'PENDING',
    })
  }
  
  return NextResponse.json({ response })
}
```

### Step 3: Monthly Billing

```typescript
// scripts/monthly-billing.ts
async function processMonthlyBilling() {
  const tenants = await prisma.tenant.findMany({
    where: { plan: 'professional' },
  })
  
  for (const tenant of tenants) {
    // Get pending GPT-4o charges
    const pendingCharges = await prisma.aIUsage.findMany({
      where: {
        tenantId: tenant.id,
        model: 'gpt-4o',
        billingStatus: 'PENDING',
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    })
    
    const totalCharges = pendingCharges.reduce((sum, u) => sum + u.cost, 0)
    
    if (totalCharges > 0) {
      // Add to invoice
      await createInvoiceItem({
        tenantId: tenant.id,
        description: `${pendingCharges.length} GPT-4o queries`,
        amount: totalCharges,
        quantity: pendingCharges.length,
      })
      
      // Mark as billed
      await prisma.aIUsage.updateMany({
        where: { id: { in: pendingCharges.map(u => u.id) } },
        data: { billingStatus: 'BILLED' },
      })
    }
  }
}
```

---

## UI Components Needed

### 1. Settings Page Component

**File**: `app/settings/ai/page.tsx`

```tsx
export default function AISettingsPage() {
  return (
    <div>
      <h1>AI Model Preferences</h1>
      <AIModelSelector />
      <UsageDashboard />
      <BillingInfo />
    </div>
  )
}
```

### 2. Chat Interface Model Selector

**File**: `components/ai/model-selector-inline.tsx`

```tsx
export function InlineModelSelector({ onModelChange, currentModel }) {
  return (
    <Select value={currentModel} onValueChange={onModelChange}>
      <SelectItem value="gpt-4o-mini">
        GPT-4o Mini <Badge>Free</Badge>
      </SelectItem>
      <SelectItem value="gpt-4o">
        GPT-4o <Badge>$0.50</Badge>
      </SelectItem>
    </Select>
  )
}
```

### 3. Cost Confirmation Dialog

**File**: `components/ai/cost-confirmation-dialog.tsx`

```tsx
export function CostConfirmationDialog({ open, onConfirm, onCancel, cost }) {
  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Premium Query</DialogTitle>
          <DialogDescription>
            This query will use GPT-4o and cost ${cost}. 
            This will be added to your next invoice.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>Confirm & Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Recommended Billing Flow

### ✅ Recommended: Per-Query Billing (End of Cycle)

**Flow:**
1. User selects Professional plan ($15/month) → Pays $15 upfront
2. Gets 50 GPT-4o Mini queries included
3. User changes model to GPT-4o in Settings → No charge for changing preference
4. User uses GPT-4o query → **$0.50 tracked, charged at end of month**
5. Monthly invoice includes: Base plan ($15) + GPT-4o queries ($0.50 × count)

**Benefits:**
- ✅ Flexible - no plan upgrade needed
- ✅ User sees costs upfront
- ✅ Charges accumulate, billed once monthly
- ✅ Can switch models anytime

---

## Summary

**Where to Change Model:**
- ✅ Settings Page: `app/settings/ai` (default preference)
- ✅ Chat Interface: Per-query override

**Billing Model:**
- ✅ **Recommended**: Per-query billing, charged at end of cycle
- ✅ GPT-4o Mini: Included in $15 plan
- ✅ GPT-4o: $0.50 per query (added to monthly invoice)
- ✅ No charge for changing model preference
- ✅ User sees cost confirmation before expensive queries

**This gives maximum flexibility while keeping billing simple!** 💰
