# AI Model Selection Implementation

## Code Changes Needed

### 1. Update AI Model Selection

Update `lib/utils/ai-model-selection.ts`:

```typescript
export type AIModel = 
  | 'gpt-4o-mini'      // Professional tier (default), cost-effective
  | 'gpt-4o'          // Business/Enterprise (default), premium
  | 'gpt-3.5-turbo'   // Legacy/fallback
  | 'gpt-4-turbo'     // Alternative premium option

/**
 * Get default AI model for a tier
 */
export function getAIModelForTier(tier: UserTier): AIModel {
  switch (tier) {
    case 'professional':
      // Professional: GPT-4o Mini (cost-effective, 16x cheaper)
      return 'gpt-4o-mini'
    
    case 'business':
    case 'enterprise':
      // Business/Enterprise: GPT-4o (premium quality)
      return 'gpt-4o'
    
    default:
      return 'gpt-4o-mini' // Default to cheaper option
  }
}

/**
 * Get available models for a tier
 */
export function getAvailableModelsForTier(tier: UserTier): AIModel[] {
  switch (tier) {
    case 'professional':
      return ['gpt-4o-mini', 'gpt-4o'] // Can upgrade to GPT-4o
    
    case 'business':
    case 'enterprise':
      return ['gpt-4o', 'gpt-4o-mini'] // Can downgrade to save costs
    
    default:
      return ['gpt-4o-mini']
  }
}

/**
 * Get model cost per 1K tokens (for billing)
 */
export function getModelCostPer1KTokens(model: AIModel, isInput: boolean): number {
  // Azure OpenAI pricing (as of 2024)
  const costs = {
    'gpt-4o-mini': {
      input: 0.00015,  // $0.15 per 1M tokens
      output: 0.0006,  // $0.60 per 1M tokens
    },
    'gpt-4o': {
      input: 0.0025,   // $2.50 per 1M tokens
      output: 0.01,    // $10.00 per 1M tokens
    },
    'gpt-3.5-turbo': {
      input: 0.0005,
      output: 0.0015,
    },
  }
  
  return costs[model]?.[isInput ? 'input' : 'output'] || 0.001
}
```

### 2. Add User Model Preference

Add to `prisma/schema.prisma`:

```prisma
model Tenant {
  // ... existing fields
  
  // AI Model Preferences
  defaultAIModel        String?  // 'gpt-4o-mini' | 'gpt-4o'
  allowModelSelection   Boolean  @default(true)
}

model User {
  // ... existing fields
  
  // Per-user AI preferences
  preferredAIModel      String?  // 'gpt-4o-mini' | 'gpt-4o'
}
```

### 3. Track Usage for Billing

Add usage tracking:

```prisma
model AIUsage {
  id            String   @id @default(cuid())
  tenantId      String
  userId        String
  model         String   // 'gpt-4o-mini' | 'gpt-4o'
  inputTokens   Int
  outputTokens  Int
  cost          Float    // Calculated cost
  queryType     String?  // 'chat' | 'task-assignment' | etc.
  createdAt     DateTime @default(now())
  
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  user          User     @relation(fields: [userId], references: [id])
  
  @@index([tenantId, createdAt])
  @@index([userId, createdAt])
}
```

### 4. Update AI Chat Route

Update `app/api/ai/chat/route.ts` to:
- Check user's preferred model
- Fall back to tier default
- Track usage
- Calculate costs

```typescript
// Get user's preferred model or tier default
const userModel = await getUserPreferredModel(userId) || getAIModelForTier(tier)

// Track usage after query
await trackAIUsage({
  tenantId,
  userId,
  model: userModel,
  inputTokens: response.usage.prompt_tokens,
  outputTokens: response.usage.completion_tokens,
  cost: calculateCost(userModel, response.usage),
})
```

### 5. Add Model Selection UI

Create component for model selection:

```typescript
// components/ai/model-selector.tsx
export function ModelSelector({ currentModel, availableModels, onSelect }) {
  return (
    <Select value={currentModel} onValueChange={onSelect}>
      {availableModels.map(model => (
        <SelectItem key={model} value={model}>
          {model === 'gpt-4o-mini' && 'GPT-4o Mini (Cost-Effective)'}
          {model === 'gpt-4o' && 'GPT-4o (Premium Quality)'}
          <Badge>${getModelCostPer1KTokens(model)}/1K tokens</Badge>
        </SelectItem>
      ))}
    </Select>
  )
}
```

---

## Billing Calculation

### Monthly Billing Logic

```typescript
async function calculateMonthlyAIUsage(tenantId: string, month: Date) {
  const usage = await prisma.aIUsage.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: startOfMonth(month),
        lte: endOfMonth(month),
      },
    },
  })
  
  const totalCost = usage.reduce((sum, u) => sum + u.cost, 0)
  const modelBreakdown = usage.reduce((acc, u) => {
    acc[u.model] = (acc[u.model] || 0) + u.cost
    return acc
  }, {})
  
  return {
    totalCost,
    modelBreakdown,
    totalQueries: usage.length,
    totalTokens: usage.reduce((sum, u) => sum + u.inputTokens + u.outputTokens, 0),
  }
}
```

---

## Environment Variables

Add to `env.template`:

```
# AI Model Configuration
AI_DEFAULT_MODEL_PROFESSIONAL=gpt-4o-mini
AI_DEFAULT_MODEL_BUSINESS=gpt-4o
AI_DEFAULT_MODEL_ENTERPRISE=gpt-4o

# Model Costs (per 1K tokens) - for billing
AI_COST_GPT4O_MINI_INPUT=0.00015
AI_COST_GPT4O_MINI_OUTPUT=0.0006
AI_COST_GPT4O_INPUT=0.0025
AI_COST_GPT4O_OUTPUT=0.01
```

---

## Migration Steps

1. ✅ Update `ai-model-selection.ts` with GPT-4o Mini support
2. ✅ Add model preference to Tenant/User models
3. ✅ Create AIUsage tracking model
4. ✅ Update AI chat route to use preferred model
5. ✅ Add model selection UI component
6. ✅ Implement usage tracking
7. ✅ Add billing calculation logic
8. ✅ Update Azure OpenAI deployment names

---

**This implementation gives users flexibility while optimizing costs!** 💰
