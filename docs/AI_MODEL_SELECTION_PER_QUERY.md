# Per-Query Model Selection

## User Can Choose Model for Every Query ✅

Users have **two ways** to select the AI model:

### 1. Default Preference (Settings)
- Set in Settings → AI Preferences
- Used as default for all queries
- Can change anytime (no charge)

### 2. Per-Query Override (Chat Interface)
- Choose different model for each query
- Overrides default preference
- Shows cost before using GPT-4o

---

## UI Implementation

### Chat Interface with Model Selector

**File**: `components/ai/chat-interface.tsx`

```tsx
'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Zap, DollarSign } from 'lucide-react'

export function AIChatInterface() {
  const [selectedModel, setSelectedModel] = useState<'gpt-4o-mini' | 'gpt-4o'>('gpt-4o-mini')
  const [message, setMessage] = useState('')
  const [showCostWarning, setShowCostWarning] = useState(false)

  const handleModelChange = (model: 'gpt-4o-mini' | 'gpt-4o') => {
    setSelectedModel(model)
    
    // Show cost warning if switching to GPT-4o
    if (model === 'gpt-4o') {
      setShowCostWarning(true)
    } else {
      setShowCostWarning(false)
    }
  }

  const handleSend = async () => {
    // If GPT-4o, show confirmation if not already confirmed
    if (selectedModel === 'gpt-4o' && !showCostWarning) {
      // Show confirmation dialog
      const confirmed = await showCostConfirmation()
      if (!confirmed) return
    }

    // Send query with selected model
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        model: selectedModel, // User's choice for this query
      }),
    })

    // Handle response...
  }

  return (
    <div className="flex flex-col h-full">
      {/* Model Selector in Chat Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o-mini">
                <div className="flex items-center justify-between w-full">
                  <span>GPT-4o Mini</span>
                  <Badge variant="secondary" className="ml-2">Included</Badge>
                </div>
              </SelectItem>
              <SelectItem value="gpt-4o">
                <div className="flex items-center justify-between w-full">
                  <span>GPT-4o</span>
                  <Badge variant="default" className="ml-2">$0.50</Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Cost Indicator */}
          {selectedModel === 'gpt-4o' && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <DollarSign className="h-4 w-4" />
              <span>This query will cost $0.50</span>
            </div>
          )}
        </div>

        {/* Usage Info */}
        <div className="text-sm text-muted-foreground">
          <span>45/50 queries used</span>
        </div>
      </div>

      {/* Cost Warning Alert */}
      {showCostWarning && selectedModel === 'gpt-4o' && (
        <Alert className="m-4 border-amber-200 bg-amber-50">
          <Zap className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Premium Query:</strong> This will use GPT-4o and cost $0.50. 
            This will be added to your next invoice.
          </AlertDescription>
        </Alert>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Messages */}
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!message}>
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## Cost Confirmation Dialog

**File**: `components/ai/cost-confirmation-dialog.tsx`

```tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Zap } from 'lucide-react'

interface CostConfirmationDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  cost: number
  availableCredit?: number
}

export function CostConfirmationDialog({
  open,
  onConfirm,
  onCancel,
  cost,
  availableCredit,
}: CostConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-600" />
            Confirm Premium Query
          </DialogTitle>
          <DialogDescription>
            You're about to use GPT-4o, which has a cost.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Query Cost</p>
              <p className="text-sm text-muted-foreground">
                This query will use GPT-4o
              </p>
            </div>
            <Badge variant="default" className="text-lg">
              ${cost.toFixed(2)}
            </Badge>
          </div>

          {availableCredit !== undefined && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Available Credit</p>
                <p className="text-sm text-muted-foreground">
                  After this query
                </p>
              </div>
              <Badge variant="secondary" className="text-lg">
                ${(availableCredit - cost).toFixed(2)}
              </Badge>
            </div>
          )}

          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Billing:</strong> This charge will be added to your next 
              monthly invoice. You can switch back to GPT-4o Mini anytime to avoid charges.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="gap-2">
            <DollarSign className="h-4 w-4" />
            Confirm & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## API Route Update

**File**: `app/api/ai/chat/route.ts`

```typescript
export async function POST(request: NextRequest) {
  // ... existing auth checks ...
  
  const { message, model: requestedModel } = await request.json()
  
  // Get user's default preference
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferredAIModel: true },
  })
  
  // Use requested model (from UI) or default preference
  const selectedModel = requestedModel || user?.preferredAIModel || 'gpt-4o-mini'
  
  // If GPT-4o, check payment and credit
  if (selectedModel === 'gpt-4o') {
    const paymentCheck = await checkPaymentMethod(session.user.tenantId)
    if (!paymentCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Payment method required',
          requiresPayment: true,
        },
        { status: 402 }
      )
    }
    
    const creditCheck = await checkCreditLimit(session.user.tenantId, 0.50)
    if (!creditCheck.allowed) {
      return NextResponse.json(
        {
          error: creditCheck.message,
          requiresPayment: true,
        },
        { status: 402 }
      )
    }
  }
  
  // Execute query with selected model
  const response = await generateChatCompletion(messages, { 
    model: selectedModel 
  })
  
  // Track usage
  if (selectedModel === 'gpt-4o') {
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

---

## User Experience Flow

### Scenario 1: User Uses GPT-4o Mini (Default)

1. User opens chat → Sees "GPT-4o Mini" selected (from Settings)
2. User types message → Sends
3. Query executes → No charge (included in plan)
4. User can switch to GPT-4o anytime

### Scenario 2: User Switches to GPT-4o for One Query

1. User opens chat → Sees "GPT-4o Mini" selected
2. User clicks model selector → Selects "GPT-4o"
3. Cost warning appears → "$0.50 per query"
4. User types message → Clicks "Send"
5. Confirmation dialog → "This will cost $0.50. Continue?"
6. User confirms → Query executes, $0.50 charged
7. Model selector resets to default (GPT-4o Mini) for next query

### Scenario 3: User Sets GPT-4o as Default

1. User goes to Settings → AI Preferences
2. Changes default to "GPT-4o"
3. Saves preference → No charge (just preference)
4. Next chat query → Uses GPT-4o by default
5. Each query → Shows cost warning, requires confirmation
6. User can still switch to GPT-4o Mini per-query

---

## Model Selector Behavior

### Option A: Reset to Default After Each Query (Recommended)

```tsx
// After query completes
const handleQueryComplete = () => {
  // Reset to user's default preference
  const defaultModel = user.preferredAIModel || 'gpt-4o-mini'
  setSelectedModel(defaultModel)
  setShowCostWarning(false)
}
```

**Pros:**
- ✅ Prevents accidental expensive queries
- ✅ User must consciously choose GPT-4o each time
- ✅ Saves money (defaults to cheaper option)

### Option B: Remember Last Selection

```tsx
// Remember user's last choice
const handleQueryComplete = () => {
  // Keep current selection
  // User can manually change if needed
}
```

**Pros:**
- ✅ Better UX (remembers preference)
- ✅ Faster for users who prefer GPT-4o

**Cons:**
- ⚠️ May lead to accidental expensive queries

---

## Recommended: Reset to Default

**Why:**
- Prevents accidental charges
- User must consciously choose GPT-4o
- Better cost control

**Implementation:**
- Default: User's preference from Settings
- Per-query: Can override
- After query: Resets to default

---

## Summary

✅ **Yes, users can choose model for every query!**

**How:**
1. **Default**: Set in Settings (used as starting point)
2. **Per-Query**: Override in chat interface
3. **Cost Warning**: Shows before GPT-4o queries
4. **Confirmation**: Required for GPT-4o (prevents accidents)
5. **Reset**: Returns to default after each query

**This gives maximum flexibility while preventing accidental charges!** 🎯
