import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// GET - List documentation
// Note: This could integrate with documentation systems or use a custom model
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'it', action: 'READ' },
    async (request, userInfo) => {
      try {
        // TODO: Create Documentation model or integrate with external systems
        // For now, return placeholder structure
        // Documentation could come from:
        // - Custom Documentation model
        // - Wiki systems (Confluence, Notion)
        // - Markdown files in repository
        // - External documentation platforms

        const documentation: any[] = []

        return NextResponse.json({
          documentation,
        })
      } catch (error) {
        console.error('Error fetching documentation:', error)
        return NextResponse.json(
          { error: 'Failed to fetch documentation' },
          { status: 500 }
        )
      }
    }
  )
}

