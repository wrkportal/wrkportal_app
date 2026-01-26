import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Security: User MUST exist in DB (created in OAuth signIn callback)
    // If session.user.id exists, use it; otherwise try email
    let user = null

    // Base select fields (always available)
    const baseSelect = {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      tenantId: true,
      avatar: true,
      timezone: true,
      locale: true,
      landingPage: true,
      primaryWorkflowType: true,
      phone: true,
      location: true,
      department: true,
      assistantName: true,
      voiceSampleUrl: true,
      status: true,
      lastLogin: true,
      emailVerified: true,
      createdAt: true,
    }

    if (session.user.id) {
      // Query by ID (most reliable)
      // Try with allowedSections first, fallback if column doesn't exist
      try {
        user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            ...baseSelect,
            allowedSections: true,
          },
        })
      } catch (error: any) {
        // If column doesn't exist, query without it
        if (error.code === 'P2022' || error.message?.includes('does not exist')) {
          console.warn('[ME] allowedSections column not found, querying without it')
          user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: baseSelect,
          })
          // Add null for allowedSections to maintain API contract
          if (user) {
            (user as any).allowedSections = null
          }
        } else {
          throw error
        }
      }
    } else if (session.user.email) {
      // Fallback: query by email (shouldn't happen if signIn callback worked)
      try {
        user = await prisma.user.findUnique({
          where: { email: session.user.email.toLowerCase() },
          select: {
            ...baseSelect,
            allowedSections: true,
          },
        })
      } catch (error: any) {
        // If column doesn't exist, query without it
        if (error.code === 'P2022' || error.message?.includes('does not exist')) {
          console.warn('[ME] allowedSections column not found, querying without it')
          user = await prisma.user.findUnique({
            where: { email: session.user.email.toLowerCase() },
            select: baseSelect,
          })
          // Add null for allowedSections to maintain API contract
          if (user) {
            (user as any).allowedSections = null
          }
        } else {
          throw error
        }
      }
    }

    // Security: If user doesn't exist, return 404
    // User should have been created in OAuth signIn callback
    if (!user) {
      console.error('[ME] ❌ User not found in DB - should have been created in signIn callback:', session.user.email)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error('[ME] Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
