/**
 * Database Cleanup Script
 * 
 * This script deletes all data from the database EXCEPT for the user
 * with email: sandeep200680@gmail.com and their associated tenant.
 * 
 * WARNING: This operation is IRREVERSIBLE. Make sure you have a backup
 * if you need to restore data later.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const KEEP_EMAIL = 'sandeep200680@gmail.com'

async function cleanupDatabase() {
  try {
    console.log('🔍 Starting database cleanup...')
    console.log(`📌 Keeping user: ${KEEP_EMAIL}`)
    console.log('')

    // Find the user to keep
    const keepUser = await prisma.user.findUnique({
      where: { email: KEEP_EMAIL },
      include: { tenant: true }
    })

    if (!keepUser) {
      console.error(`❌ User with email ${KEEP_EMAIL} not found!`)
      process.exit(1)
    }

    console.log(`✅ Found user: ${keepUser.name || keepUser.email}`)
    console.log(`✅ Tenant: ${keepUser.tenant.name}`)
    console.log('')

    const keepUserId = keepUser.id
    const keepTenantId = keepUser.tenantId

    // Start transaction
    await prisma.$transaction(async (tx) => {
      console.log('🗑️  Deleting data from other tenants...')

      // Delete all data from OTHER tenants (cascade will handle most relations)
      const deletedTenants = await tx.tenant.deleteMany({
        where: {
          id: { not: keepTenantId }
        }
      })
      console.log(`   Deleted ${deletedTenants.count} other tenants`)

      console.log('')
      console.log('🗑️  Cleaning up data within your tenant...')

      // Now clean up data within the KEPT tenant, including the user's own data
      
      // Delete ALL reporting dashboards (including user's own)
      const deletedDashboards = await tx.reportingDashboard.deleteMany({})
      console.log(`   Deleted ${deletedDashboards.count} reporting dashboards`)

      // Delete ALL reporting files (including user's own)
      const deletedFiles = await tx.reportingFile.deleteMany({
        where: {
          tenantId: keepTenantId
        }
      })
      console.log(`   Deleted ${deletedFiles.count} reporting files`)

      // Delete default layouts not created by the user
      const deletedLayouts = await tx.defaultLayout.deleteMany({
        where: {
          tenantId: keepTenantId,
          createdById: { not: keepUserId }
        }
      })
      console.log(`   Deleted ${deletedLayouts.count} default layouts`)

      // Delete collaborations not created by the user
      const deletedCollabs = await tx.collaboration.deleteMany({
        where: {
          tenantId: keepTenantId,
          createdById: { not: keepUserId }
        }
      })
      console.log(`   Deleted ${deletedCollabs.count} collaborations`)

      // Delete tutorials not created by the user
      const deletedTutorials = await tx.tutorial.deleteMany({
        where: {
          tenantId: keepTenantId,
          createdById: { not: keepUserId }
        }
      })
      console.log(`   Deleted ${deletedTutorials.count} tutorials`)

      // Delete reminders not created by or for the user
      const deletedReminders = await tx.reminder.deleteMany({
        where: {
          tenantId: keepTenantId,
          AND: [
            { userId: { not: keepUserId } },
            { createdById: { not: keepUserId } }
          ]
        }
      })
      console.log(`   Deleted ${deletedReminders.count} reminders`)

      // Delete notifications for other users
      const deletedNotifications = await tx.notification.deleteMany({
        where: {
          tenantId: keepTenantId,
          userId: { not: keepUserId }
        }
      })
      console.log(`   Deleted ${deletedNotifications.count} notifications`)

      // Delete audit logs for other users
      const deletedAuditLogs = await tx.auditLog.deleteMany({
        where: {
          tenantId: keepTenantId,
          userId: { not: keepUserId }
        }
      })
      console.log(`   Deleted ${deletedAuditLogs.count} audit logs`)

      // Delete approvals not requested by the user
      const deletedApprovals = await tx.approval.deleteMany({
        where: {
          tenantId: keepTenantId,
          requestedById: { not: keepUserId }
        }
      })
      console.log(`   Deleted ${deletedApprovals.count} approvals`)

      // Delete goals not owned by the user
      const deletedGoals = await tx.goal.deleteMany({
        where: {
          tenantId: keepTenantId,
          ownerId: { not: keepUserId }
        }
      })
      console.log(`   Deleted ${deletedGoals.count} goals`)

      // Delete projects not managed by the user
      const deletedProjects = await tx.project.deleteMany({
        where: {
          tenantId: keepTenantId,
          managerId: { not: keepUserId }
        }
      })
      console.log(`   Deleted ${deletedProjects.count} projects`)

      // Delete programs not owned by the user
      const deletedPrograms = await tx.program.deleteMany({
        where: {
          tenantId: keepTenantId,
          ownerId: { not: keepUserId }
        }
      })
      console.log(`   Deleted ${deletedPrograms.count} programs`)

      // Delete ALL tasks (including user's own)
      const deletedTasks = await tx.task.deleteMany({
        where: {
          tenantId: keepTenantId
        }
      })
      console.log(`   Deleted ${deletedTasks.count} tasks`)

      // Delete invitations not sent by the user
      const deletedInvitations = await tx.tenantInvitation.deleteMany({
        where: {
          tenantId: keepTenantId,
          invitedById: { not: keepUserId }
        }
      })
      console.log(`   Deleted ${deletedInvitations.count} invitations`)

      // Delete org units
      const deletedOrgUnits = await tx.orgUnit.deleteMany({
        where: {
          tenantId: keepTenantId
        }
      })
      console.log(`   Deleted ${deletedOrgUnits.count} org units`)

      // Finally, delete all other users in this tenant
      const deletedUsers = await tx.user.deleteMany({
        where: {
          tenantId: keepTenantId,
          id: { not: keepUserId }
        }
      })
      console.log(`   Deleted ${deletedUsers.count} other users`)

      console.log('')
      console.log('✨ Cleanup completed successfully!')
    })

    // Get final counts
    const finalStats = await prisma.$transaction([
      prisma.user.count(),
      prisma.tenant.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.goal.count(),
      prisma.notification.count(),
      prisma.reportingFile.count(),
      prisma.reportingDashboard.count(),
    ])

    console.log('')
    console.log('📊 Final Database Stats:')
    console.log(`   Users: ${finalStats[0]}`)
    console.log(`   Tenants: ${finalStats[1]}`)
    console.log(`   Projects: ${finalStats[2]}`)
    console.log(`   Tasks: ${finalStats[3]}`)
    console.log(`   Goals: ${finalStats[4]}`)
    console.log(`   Notifications: ${finalStats[5]}`)
    console.log(`   Reporting Files: ${finalStats[6]}`)
    console.log(`   Reporting Dashboards: ${finalStats[7]}`)
    console.log('')
    console.log('✅ Database cleanup complete!')

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanupDatabase()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

