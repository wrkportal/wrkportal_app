import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Restrict access to PLATFORM_OWNER only
        if (session.user.role !== 'PLATFORM_OWNER') {
            return NextResponse.json({ 
                error: 'Access denied. Only platform owners can access system database tables.' 
            }, { status: 403 })
        }

        const tenantId = session.user.tenantId

        // Get all table names from Prisma models
        // We'll manually list the main tables that are useful for reporting
        // Note: Prisma client uses lowercase singular for model names
        const tables = [
            {
                id: 'user',
                name: 'Users',
                description: 'User accounts and profiles',
                type: 'database_table',
                icon: 'users',
            },
            {
                id: 'project',
                name: 'Projects',
                description: 'All projects in the organization',
                type: 'database_table',
                icon: 'folder',
            },
            {
                id: 'task',
                name: 'Tasks',
                description: 'Project tasks and assignments',
                type: 'database_table',
                icon: 'check-square',
            },
            {
                id: 'timesheet',
                name: 'Timesheets',
                description: 'Time tracking entries',
                type: 'database_table',
                icon: 'clock',
            },
            {
                id: 'goal',
                name: 'Goals (OKRs)',
                description: 'Objectives and Key Results',
                type: 'database_table',
                icon: 'target',
            },
            {
                id: 'keyResult',
                name: 'Key Results',
                description: 'Key Results for OKRs',
                type: 'database_table',
                icon: 'target',
            },
            {
                id: 'program',
                name: 'Programs',
                description: 'Program management',
                type: 'database_table',
                icon: 'layers',
            },
            {
                id: 'skill',
                name: 'Skills',
                description: 'Skills and competencies',
                type: 'database_table',
                icon: 'award',
            },
            {
                id: 'approval',
                name: 'Approvals',
                description: 'Approval workflows',
                type: 'database_table',
                icon: 'check-circle',
            },
            {
                id: 'auditLog',
                name: 'Audit Logs',
                description: 'System audit trail',
                type: 'database_table',
                icon: 'file-text',
            },
            {
                id: 'notification',
                name: 'Notifications',
                description: 'User notifications',
                type: 'database_table',
                icon: 'bell',
            },
            {
                id: 'risk',
                name: 'Risks',
                description: 'Project risks',
                type: 'database_table',
                icon: 'alert-triangle',
            },
            {
                id: 'issue',
                name: 'Issues',
                description: 'Project issues',
                type: 'database_table',
                icon: 'alert-circle',
            },
        ]

        // Get row counts for each table (only for tenant's data)
        const tablesWithCounts = await Promise.all(
            tables.map(async (table) => {
                try {
                    let count = 0
                    
                    // Use type assertion to access dynamic model names
                    const model = (prisma as any)[table.id]
                    
                    if (model && typeof model.count === 'function') {
                        // Count records for this tenant
                        count = await model.count({
                            where: { tenantId }
                        })
                    }

                    return {
                        ...table,
                        rowCount: count,
                    }
                } catch (error) {
                    console.error(`Error counting ${table.id}:`, error)
                    return {
                        ...table,
                        rowCount: 0,
                    }
                }
            })
        )

        return NextResponse.json({
            tables: tablesWithCounts,
        })
    } catch (error) {
        console.error('Error fetching database tables:', error)
        return NextResponse.json(
            { error: 'Failed to fetch database tables' },
            { status: 500 }
        )
    }
}

