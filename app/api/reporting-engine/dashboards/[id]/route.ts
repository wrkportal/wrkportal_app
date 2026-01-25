import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET: Get dashboard
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const dashboard = await prisma.dashboard.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        visualizations: {
          include: {
            visualization: {
              include: {
                createdBy: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                query: {
                  include: {
                    dataSource: {
                      select: {
                        id: true,
                        name: true,
                        type: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        sharedWith: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    // Check access
    const hasAccess =
      dashboard.createdById === session.user.id ||
      dashboard.isPublic ||
      dashboard.sharedWith.some((share: any) => share.userId === session.user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ dashboard })
  } catch (error: any) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard', details: error.message },
      { status: 500 }
    )
  }
}

// PUT: Update dashboard
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    // Check if request has body content
    let body: any = {}
    try {
      const text = await request.text()
      if (text && text.trim().length > 0) {
        body = JSON.parse(text)
      }
    } catch (error: any) {
      // If body parsing fails, return error
      console.error('Error parsing request body:', error)
      return NextResponse.json(
        { error: 'Invalid request body', details: error.message },
        { status: 400 }
      )
    }

    const dashboard = await prisma.dashboard.findUnique({
      where: { id },
    })

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    // Check edit access
    const share = await prisma.dashboardShare.findFirst({
      where: {
        dashboardId: id,
        userId: session.user.id,
        permission: { in: ['EDIT', 'ADMIN'] },
      },
    })

    if (dashboard.createdById !== session.user.id && !share) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If setting as default, unset other defaults
    if (body.isDefault) {
      await prisma.dashboard.updateMany({
        where: {
          functionalArea: dashboard.functionalArea,
          createdById: session.user.id,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      })
    }

    const updated = await prisma.dashboard.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        layout: body.layout,
        autoRefresh: body.autoRefresh,
        refreshInterval: body.refreshInterval,
        tags: body.tags,
        isDefault: body.isDefault,
        order: body.order,
        lastRefreshed: body.lastRefreshed ? new Date(body.lastRefreshed) : undefined,
      },
    })

    // If layout has items, update visualization positions in DashboardVisualization table
    // Only update positions for items that are NOT text widgets (text widgets don't have visualizationId)
    if (body.layout?.items && Array.isArray(body.layout.items)) {
      const visualizationItems = body.layout.items.filter((item: any) => !item.type || item.type !== 'text')
      
      if (visualizationItems.length > 0) {
        // Update each visualization position individually
        const positionUpdates = await Promise.allSettled(
          visualizationItems.map(async (item: any) => {
            // First check if the DashboardVisualization exists
            const existing = await prisma.dashboardVisualization.findUnique({
              where: {
                dashboardId_visualizationId: {
                  dashboardId: id,
                  visualizationId: item.id,
                },
              },
            })

            if (existing) {
              // Update the position
              return prisma.dashboardVisualization.update({
                where: {
                  dashboardId_visualizationId: {
                    dashboardId: id,
                    visualizationId: item.id,
                  },
                },
                data: {
                  position: {
                    x: item.x ?? 0,
                    y: item.y ?? 0,
                    w: item.w ?? 6,
                    h: item.h ?? 4,
                  },
                },
              })
            } else {
              console.warn(`DashboardVisualization not found for dashboardId: ${id}, visualizationId: ${item.id}`)
              return null
            }
          })
        )

        // Log any failures but don't fail the request
        positionUpdates.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Error updating visualization position for item ${visualizationItems[index]?.id}:`, result.reason)
          }
        })
      }
    }

    return NextResponse.json({ dashboard: updated })
  } catch (error: any) {
    console.error('Error updating dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to update dashboard', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Delete dashboard
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const dashboard = await prisma.dashboard.findUnique({
      where: { id },
    })

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    // Only creator or admin can delete
    const share = await prisma.dashboardShare.findFirst({
      where: {
        dashboardId: id,
        userId: session.user.id,
        permission: 'ADMIN',
      },
    })

    if (dashboard.createdById !== session.user.id && !share) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.dashboard.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to delete dashboard', details: error.message },
      { status: 500 }
    )
  }
}
