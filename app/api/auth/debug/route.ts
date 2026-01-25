import { NextResponse } from 'next/server'

/**
 * Debug endpoint to check authentication configuration
 * Access at: /api/auth/debug
 * This endpoint is public and does not require authentication
 */
export async function GET() {
  try {
    const checks: Record<string, any> = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    }

    // Dynamically import prisma to avoid issues if it fails to load
    let prisma: any = null
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.prisma
    } catch (error: any) {
      checks.prismaImport = {
        error: true,
        message: error.message,
      }
    }

    // Check environment variables
    checks.envVars = {
    hasAuthSecret: !!process.env.AUTH_SECRET,
    authSecretLength: process.env.AUTH_SECRET?.length || 0,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    googleClientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...' || 'NOT SET',
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    googleClientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...' || 'NOT SET',
  }

    // Test database connection
    checks.database = {
      connected: false,
      error: null,
    }
    
    if (prisma) {
      try {
        await prisma.$queryRaw`SELECT 1 as test`
        checks.database.connected = true
      } catch (error: any) {
        checks.database.connected = false
        checks.database.error = {
          message: error.message,
          code: error.code,
          name: error.name,
        }
      }
    } else {
      checks.database.error = {
        message: 'Prisma client not available',
      }
    }

    // Check if required tables exist
    checks.tables = {
      User: false,
      Tenant: false,
      Account: false,
      Session: false,
      VerificationToken: false,
    }

    if (prisma && checks.database.connected) {
    try {
      // Check User table
      try {
        await prisma.user.findFirst({ take: 1 })
        checks.tables.User = true
      } catch (error: any) {
        checks.tables.User = false
        checks.tables.UserError = error.message
      }

      // Check Tenant table
      try {
        await prisma.tenant.findFirst({ take: 1 })
        checks.tables.Tenant = true
      } catch (error: any) {
        checks.tables.Tenant = false
        checks.tables.TenantError = error.message
      }

      // Check Account table (for OAuth)
      try {
        await (prisma as any).account?.findFirst({ take: 1 })
        checks.tables.Account = true
      } catch (error: any) {
        checks.tables.Account = false
        checks.tables.AccountError = error.message
      }

      // Check Session table
      try {
        await (prisma as any).session?.findFirst({ take: 1 })
        checks.tables.Session = true
      } catch (error: any) {
        checks.tables.Session = false
        checks.tables.SessionError = error.message
      }

      // Check VerificationToken table
      try {
        await (prisma as any).verificationToken?.findFirst({ take: 1 })
        checks.tables.VerificationToken = true
      } catch (error: any) {
        checks.tables.VerificationToken = false
        checks.tables.VerificationTokenError = error.message
      }
    } catch (error: any) {
      checks.tables.error = error.message
    }
  }

    // Check Google OAuth redirect URI
    checks.googleOAuth = {
      expectedRedirectUri: process.env.NEXTAUTH_URL
        ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
        : 'NOT SET (NEXTAUTH_URL missing)',
      note: 'Verify this matches exactly in Google Cloud Console',
    }

    // Overall status
    const allEnvVarsSet =
      checks.envVars.hasAuthSecret &&
      checks.envVars.hasNextAuthUrl &&
      checks.envVars.hasGoogleClientId &&
      checks.envVars.hasGoogleClientSecret &&
      checks.envVars.hasDatabaseUrl

    checks.status = {
      overall: allEnvVarsSet && checks.database.connected ? 'OK' : 'ISSUES FOUND',
      envVars: allEnvVarsSet ? 'OK' : 'MISSING',
      database: checks.database.connected ? 'OK' : 'FAILED',
      tables: Object.values(checks.tables).every((v) => v === true || typeof v === 'string')
        ? 'OK'
        : 'MISSING',
    }

    return NextResponse.json(checks, {
      status: 200, // Always return 200, even if there are issues (so we can see the diagnostic info)
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error: any) {
    // If anything goes wrong, return error info
    return NextResponse.json(
      {
        error: true,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200, // Return 200 so we can see the error
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
