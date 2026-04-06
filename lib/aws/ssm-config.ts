/**
 * AWS SSM Parameter Store Configuration
 *
 * Maps environment variables to SSM parameter paths.
 * Used by ECS Task Definition to inject secrets at runtime.
 *
 * SSM Path Convention: /wrkportal/{environment}/{category}/{key}
 * Example: /wrkportal/production/db/connection-string
 */

export const SSM_PARAMETER_PATHS = {
  // Database
  DATABASE_URL: '/wrkportal/production/db/connection-string',

  // Auth
  NEXTAUTH_SECRET: '/wrkportal/production/auth/nextauth-secret',
  GOOGLE_CLIENT_ID: '/wrkportal/production/auth/google-client-id',
  GOOGLE_CLIENT_SECRET: '/wrkportal/production/auth/google-client-secret',

  // AWS Credentials (for S3, Bedrock, SES from within ECS)
  // Note: Prefer IAM Task Roles over access keys where possible
  AWS_ACCESS_KEY_ID: '/wrkportal/production/aws/access-key-id',
  AWS_SECRET_ACCESS_KEY: '/wrkportal/production/aws/secret-access-key',

  // Redis
  REDIS_URL: '/wrkportal/production/cache/redis-url',

  // Email (SES)
  SMTP_USER: '/wrkportal/production/email/smtp-user',
  SMTP_PASS: '/wrkportal/production/email/smtp-pass',

  // Encryption
  ENCRYPTION_MASTER_KEY: '/wrkportal/production/security/encryption-master-key',
  INTEGRATION_ENCRYPTION_KEY: '/wrkportal/production/security/integration-encryption-key',
  REPORTING_STUDIO_ENCRYPTION_KEY: '/wrkportal/production/security/reporting-encryption-key',

  // Stripe
  STRIPE_SECRET_KEY: '/wrkportal/production/stripe/secret-key',
  STRIPE_WEBHOOK_SECRET: '/wrkportal/production/stripe/webhook-secret',

  // Cron
  CRON_SECRET: '/wrkportal/production/cron/secret',

  // Integrations
  SLACK_BOT_TOKEN: '/wrkportal/production/integrations/slack-bot-token',
  SLACK_SIGNING_SECRET: '/wrkportal/production/integrations/slack-signing-secret',
  MICROSOFT_CLIENT_ID: '/wrkportal/production/integrations/microsoft-client-id',
  MICROSOFT_CLIENT_SECRET: '/wrkportal/production/integrations/microsoft-client-secret',
  SALESFORCE_CLIENT_ID: '/wrkportal/production/integrations/salesforce-client-id',
  SALESFORCE_CLIENT_SECRET: '/wrkportal/production/integrations/salesforce-client-secret',
  HUBSPOT_API_KEY: '/wrkportal/production/integrations/hubspot-api-key',
} as const

export type SSMParameterKey = keyof typeof SSM_PARAMETER_PATHS
