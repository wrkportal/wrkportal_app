/**
 * Infrastructure Routing Utilities
 * 
 * Routes database connections and infrastructure based on user tier.
 * Supports tier-based infrastructure (Supabase Free, Neon.tech, AWS Aurora).
 */

import { getUserInfrastructure, getUserTier } from '@/lib/utils/tier-utils'

export type InfrastructureProvider = 'supabase-free' | 'neon' | 'aws-aurora'

/**
 * Get the database connection string based on user tier
 */
export async function getDatabaseConnectionString(userId: string): Promise<string | null> {
  const infrastructure = await getUserInfrastructure(userId)
  
  // Get database URLs from environment variables based on infrastructure type
  switch (infrastructure) {
    case 'supabase-free':
      return process.env.DATABASE_URL_SUPABASE_FREE || process.env.DATABASE_URL || null
    case 'neon':
      return process.env.DATABASE_URL_NEON || process.env.DATABASE_URL || null
    case 'aws-aurora':
      return process.env.DATABASE_URL_AURORA || process.env.DATABASE_URL || null
    default:
      return process.env.DATABASE_URL || null
  }
}

/**
 * Get the storage provider based on user tier
 */
export async function getStorageProvider(userId: string): Promise<'supabase-storage' | 's3'> {
  const tier = await getUserTier(userId)
  
  // Free tier uses Supabase Storage, others use S3
  if (tier === 'free') {
    return 'supabase-storage'
  }
  
  return 's3'
}

/**
 * Get the hosting provider based on user tier
 */
export async function getHostingProvider(userId: string): Promise<'vercel' | 'aws-amplify'> {
  const tier = await getUserTier(userId)
  
  // Free tier uses Vercel, others use AWS Amplify
  if (tier === 'free') {
    return 'vercel'
  }
  
  return 'aws-amplify'
}

/**
 * Get infrastructure configuration for a user
 */
export async function getUserInfrastructureConfig(userId: string) {
  const infrastructure = await getUserInfrastructure(userId)
  const storageProvider = await getStorageProvider(userId)
  const hostingProvider = await getHostingProvider(userId)
  const databaseUrl = await getDatabaseConnectionString(userId)
  
  return {
    infrastructure,
    storageProvider,
    hostingProvider,
    databaseUrl,
  }
}
