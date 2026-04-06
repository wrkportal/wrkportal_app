/**
 * Infrastructure Routing Utilities
 *
 * All infrastructure runs on AWS:
 * - Database: Aurora Serverless v2 (via DATABASE_URL)
 * - Storage: S3 (via S3_BUCKET_NAME)
 * - Hosting: ECS Fargate behind ALB
 * - Cache: ElastiCache Redis (via REDIS_URL)
 */

/**
 * Get the database connection string (Aurora Serverless v2)
 */
export function getDatabaseConnectionString(): string {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL environment variable is not set')
  return url
}

/**
 * Get the storage provider — always S3
 */
export function getStorageProvider(): 's3' {
  return 's3'
}

/**
 * Get infrastructure configuration
 */
export function getInfrastructureConfig() {
  return {
    database: 'aws-aurora',
    storage: 's3',
    hosting: 'aws-ecs',
    cache: 'aws-elasticache',
    ai: 'aws-bedrock',
    email: 'aws-ses',
    region: process.env.AWS_REGION || 'us-east-1',
  }
}
