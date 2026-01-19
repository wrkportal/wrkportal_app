/**
 * Infrastructure Routing Utilities
 * 
 * Routes database connections and infrastructure based on user tier.
 * Hybrid approach: Use Neon.tech initially, migrate to AWS Aurora when ready.
 */

import { getUserInfrastructure, getUserTier } from '@/lib/utils/tier-utils'

export type InfrastructureProvider = 'neon' | 'aws-aurora'

/**
 * Get the database connection string based on configuration
 * Phase 1: Uses Neon.tech (via DATABASE_URL)
 * Phase 2: Migrate to AWS Aurora (via DATABASE_URL_AURORA) when ready
 */
export async function getDatabaseConnectionString(userId: string): Promise<string | null> {
  // Check if we should use Aurora (when INFRASTRUCTURE_MODE=aws)
  // Otherwise, use Neon.tech (current setup)
  const infrastructureMode = process.env.INFRASTRUCTURE_MODE || 'neon'
  
  if (infrastructureMode === 'aws' && process.env.DATABASE_URL_AURORA) {
    return process.env.DATABASE_URL_AURORA
  }
  
  // Default to Neon.tech (current DATABASE_URL)
  return process.env.DATABASE_URL || null
}

/**
 * Get the storage provider based on configuration
 * Phase 1: Uses local file system (free)
 * Phase 2: Migrate to AWS S3 when ready
 */
export async function getStorageProvider(userId: string): Promise<'local' | 's3'> {
  // Check if we should use S3 (when INFRASTRUCTURE_MODE=aws)
  const infrastructureMode = process.env.INFRASTRUCTURE_MODE || 'neon'
  
  if (infrastructureMode === 'aws' && process.env.S3_BUCKET_NAME) {
    return 's3'
  }
  
  // Default to local file system (free, for initial phase)
  return 'local'
}

/**
 * Get the hosting provider based on configuration
 * Phase 1: Uses Vercel (free tier)
 * Phase 2: Migrate to AWS Amplify when ready
 */
export async function getHostingProvider(userId: string): Promise<'vercel' | 'aws-amplify'> {
  // Check if we should use Amplify (when INFRASTRUCTURE_MODE=aws)
  const infrastructureMode = process.env.INFRASTRUCTURE_MODE || 'neon'
  
  if (infrastructureMode === 'aws') {
    return 'aws-amplify'
  }
  
  // Default to Vercel (free tier, for initial phase)
  return 'vercel'
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
