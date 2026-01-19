/**
 * AI Model Selection by Tier
 * 
 * Selects the appropriate AI model based on user tier.
 * - Free/Starter: No AI access
 * - Professional: GPT-3.5-turbo (cost-effective)
 * - Business: GPT-4 Turbo (premium, higher quality)
 * - Enterprise: GPT-4 Turbo (premium)
 */

import { getUserTier, type UserTier } from './tier-utils'

export type AIModel = 
  | 'gpt-3.5-turbo'      // Professional tier
  | 'gpt-4o'            // Default/fallback
  | 'gpt-4-turbo'       // Business/Enterprise tier (premium)
  | 'gpt-4o-mini'       // Optional: cheaper alternative

/**
 * Get AI model for a user's tier
 */
export async function getAIModelForUser(userId: string): Promise<AIModel> {
  const tier = await getUserTier(userId)
  return getAIModelForTier(tier)
}

/**
 * Get AI model for a tier
 */
export function getAIModelForTier(tier: UserTier): AIModel {
  switch (tier) {
    case 'free':
    case 'starter':
      // No AI access for free/starter (but return default model for code consistency)
      // This should not be called if AI is disabled (check canUseAI first)
      return 'gpt-3.5-turbo'
    
    case 'professional':
      // Professional: GPT-3.5-turbo (cost-effective)
      return 'gpt-3.5-turbo'
    
    case 'business':
    case 'enterprise':
      // Business/Enterprise: GPT-4 Turbo (premium, higher quality)
      return 'gpt-4-turbo'
    
    default:
      // Default to GPT-4o (fallback)
      return 'gpt-4o'
  }
}

/**
 * Get AI model configuration (model, temperature, maxTokens) based on tier
 */
export async function getAIConfigForUser(userId: string): Promise<{
  model: AIModel
  temperature: number
  maxTokens: number
  usePremiumModel: boolean
}> {
  const tier = await getUserTier(userId)
  const model = getAIModelForTier(tier)
  
  // Configuration based on tier
  switch (tier) {
    case 'professional':
      return {
        model,
        temperature: 0.7,
        maxTokens: 2000,
        usePremiumModel: false, // GPT-3.5-turbo
      }
    
    case 'business':
    case 'enterprise':
      return {
        model,
        temperature: 0.7,
        maxTokens: 4000, // Higher token limit for premium models
        usePremiumModel: true, // GPT-4 Turbo
      }
    
    default:
      return {
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 2000,
        usePremiumModel: false,
      }
  }
}

/**
 * Check if user's tier has access to premium AI models (GPT-4 Turbo)
 */
export async function hasPremiumAIModel(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId)
  return tier === 'business' || tier === 'enterprise'
}
