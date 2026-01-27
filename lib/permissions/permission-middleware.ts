/**
 * Phase 4: Multi-Level Access Control - Permission Middleware
 * 
 * Middleware and helpers for API routes to check permissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  checkResourcePermission,
  checkFunctionPermission,
  logAccessAttempt,
  PermissionCheckOptions,
} from './permission-checker'

export interface PermissionMiddlewareOptions {
  resource?: string
  action?: string
  function?: string
  requireAll?: boolean // If true, both resource and function permissions required
}

/**
 * Get user information from session for permission checks
 */
export async function getUserForPermissionCheck() {
  const session = await auth()
  if (!session?.user) {
    return null
  }

  // Get full user with org unit
  let user
  try {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        tenantId: true,
        orgUnitId: true,
        role: true,
      },
    })
  } catch (error: any) {
    // Handle case where User table or columns might not exist
    if (error.code === 'P2021' || error.code === 'P2022' || 
        error.message?.includes('does not exist') ||
        error.message?.includes('column')) {
      console.warn('User table or column not available for permission check')
      // Return user info from session as fallback
      return {
        userId: session.user.id,
        tenantId: (session.user as any).tenantId || null,
        orgUnitId: null,
        role: (session.user as any).role || null,
      }
    }
    throw error
  }

  if (!user) {
    return null
  }

  return {
    userId: user.id,
    tenantId: user.tenantId,
    orgUnitId: user.orgUnitId,
    role: user.role,
  }
}

/**
 * Middleware to check permissions before API route execution
 */
export async function withPermissionCheck(
  request: NextRequest,
  options: PermissionMiddlewareOptions,
  handler: (req: NextRequest, userInfo: NonNullable<Awaited<ReturnType<typeof getUserForPermissionCheck>>>) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const userInfo = await getUserForPermissionCheck()
    
    if (!userInfo) {
      await logAccessAttempt(
        'unknown',
        'unknown',
        options.resource || 'unknown',
        options.action || 'unknown',
        'DENIED',
        {
          reason: 'User not authenticated',
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        }
      )
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { resource, action, function: func, requireAll } = options

    // Check resource permission if specified
    if (resource && action) {
      const resourceCheck = await checkResourcePermission({
        userId: userInfo.userId,
        tenantId: userInfo.tenantId,
        orgUnitId: userInfo.orgUnitId,
        role: userInfo.role,
        resource,
        action,
      })

      if (!resourceCheck.allowed) {
        await logAccessAttempt(
          userInfo.userId,
          userInfo.tenantId,
          resource,
          action,
          'DENIED',
          {
            reason: resourceCheck.reason,
            ipAddress: request.headers.get('x-forwarded-for') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
            permissionCheck: { source: resourceCheck.source },
          }
        )
        return NextResponse.json(
          { error: 'Forbidden', reason: resourceCheck.reason },
          { status: 403 }
        )
      }

      await logAccessAttempt(
        userInfo.userId,
        userInfo.tenantId,
        resource,
        action,
        'GRANTED',
        {
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
          permissionCheck: { source: resourceCheck.source },
        }
      )
    }

    // Check function permission if specified
    if (func) {
      const functionCheck = await checkFunctionPermission({
        userId: userInfo.userId,
        tenantId: userInfo.tenantId,
        orgUnitId: userInfo.orgUnitId,
        role: userInfo.role,
        function: func,
      })

      if (!functionCheck.allowed) {
        await logAccessAttempt(
          userInfo.userId,
          userInfo.tenantId,
          func,
          'EXECUTE',
          'DENIED',
          {
            reason: functionCheck.reason,
            ipAddress: request.headers.get('x-forwarded-for') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
            permissionCheck: { source: functionCheck.source },
          }
        )
        return NextResponse.json(
          { error: 'Forbidden', reason: functionCheck.reason },
          { status: 403 }
        )
      }

      await logAccessAttempt(
        userInfo.userId,
        userInfo.tenantId,
        func,
        'EXECUTE',
        'GRANTED',
        {
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
          permissionCheck: { source: functionCheck.source },
        }
      )
    }

    // If requireAll is true, both checks must pass
    if (requireAll && resource && action && func) {
      // Both checks already passed above
    }

    // Execute the handler
    return await handler(request, userInfo)
  } catch (error: any) {
    console.error('Permission check error:', error)
    return NextResponse.json(
      { error: 'Permission check failed', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Helper to check if user has permission (returns boolean)
 */
export async function hasPermission(
  userId: string,
  tenantId: string,
  options: {
    resource?: string
    action?: string
    function?: string
    orgUnitId?: string | null
    role: any
  }
): Promise<boolean> {
  if (options.resource && options.action) {
    const result = await checkResourcePermission({
      userId,
      tenantId,
      orgUnitId: options.orgUnitId,
      role: options.role,
      resource: options.resource,
      action: options.action,
    })
    return result.allowed
  }

  if (options.function) {
    const result = await checkFunctionPermission({
      userId,
      tenantId,
      orgUnitId: options.orgUnitId,
      role: options.role,
      function: options.function,
    })
    return result.allowed
  }

  return false
}

