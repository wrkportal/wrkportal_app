import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { Prisma } from '@prisma/client'

// GET - List IT users
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'it', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const search = searchParams.get('search')

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (status && status !== 'all') {
          where.status = status
        }

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ]
        }

        const users = await prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            role: true,
            lastLogin: true,
            createdAt: true,
            orgUnit: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        type UserWithSelected = Prisma.UserGetPayload<{
          select: {
            id: true
            name: true
            email: true
            phone: true
            status: true
            role: true
            lastLogin: true
            createdAt: true
            orgUnit: {
              select: {
                id: true
                name: true
              }
            }
          }
        }>

        const typedUsers: UserWithSelected[] = users as UserWithSelected[]

        // Format users for IT dashboard
        const formattedUsers = typedUsers.map((user: UserWithSelected) => ({
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email || '',
          department: user.orgUnit?.name || 'Unassigned',
          role: user.role || 'USER',
          status: user.status || 'INACTIVE',
          lastLogin: user.lastLogin ? user.lastLogin.toISOString() : 'Never',
          accountCreated: user.createdAt.toISOString().split('T')[0],
          accessLevel: user.role || 'USER',
          phone: user.phone || '',
        }))

        // Calculate stats
        const stats = {
          total: formattedUsers.length,
          active: formattedUsers.filter((u: any) => u.status === 'ACTIVE').length,
          inactive: formattedUsers.filter((u: any) => u.status !== 'ACTIVE').length,
          pending: formattedUsers.filter((u: any) => u.status === 'PENDING').length,
        }

        return NextResponse.json({
          users: formattedUsers,
          stats,
        })
      } catch (error) {
        console.error('Error fetching IT users:', error)
        return NextResponse.json(
          { error: 'Failed to fetch users' },
          { status: 500 }
        )
      }
    }
  )
}

