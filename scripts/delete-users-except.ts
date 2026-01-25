/**
 * Delete All Users Except One
 * 
 * This script deletes all users from the database EXCEPT for
 * sandeep200680@gmail.com
 * 
 * WARNING: This operation is IRREVERSIBLE. Make sure you have a backup
 * if you need to restore data later.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const KEEP_EMAIL = 'sandeep200680@gmail.com'

async function deleteUsersExcept() {
  try {
    console.log('🔍 Starting user deletion...')
    console.log(`📌 Keeping user: ${KEEP_EMAIL}`)
    console.log('')

    // Find the user to keep
    const keepUser = await prisma.user.findUnique({
      where: { email: KEEP_EMAIL },
      include: { tenant: true }
    })

    if (!keepUser) {
      console.error(`❌ User with email ${KEEP_EMAIL} not found!`)
      console.error('   Please make sure the user exists before running this script.')
      process.exit(1)
    }

    console.log(`✅ Found user: ${keepUser.name || keepUser.email}`)
    console.log(`✅ User ID: ${keepUser.id}`)
    console.log(`✅ Tenant: ${keepUser.tenant.name} (ID: ${keepUser.tenantId})`)
    console.log('')

    // Get count of users before deletion
    const totalUsers = await prisma.user.count()
    console.log(`📊 Total users in database: ${totalUsers}`)
    console.log('')

    // Get all users to delete (except the one to keep)
    const usersToDelete = await prisma.user.findMany({
      where: {
        email: {
          not: KEEP_EMAIL
        }
      },
      select: {
        id: true,
        email: true
      }
    })

    console.log(`🗑️  Found ${usersToDelete.length} user(s) to delete`)
    console.log('')

    if (usersToDelete.length === 0) {
      console.log('✅ No users to delete. All done!')
      return
    }

    // Delete related data for all users to delete first
    type UserToDelete = typeof usersToDelete[0];
    const userIdsToDelete = usersToDelete.map((u: UserToDelete) => u.id)
    
    console.log('🗑️  Cleaning up related data...')
    
    // Delete collaborations created by these users
    const deletedCollabs = await prisma.collaboration.deleteMany({
      where: { createdById: { in: userIdsToDelete } }
    })
    console.log(`   Deleted ${deletedCollabs.count} collaborations`)
    
    // Delete tutorials created by these users
    const deletedTutorials = await prisma.tutorial.deleteMany({
      where: { createdById: { in: userIdsToDelete } }
    })
    console.log(`   Deleted ${deletedTutorials.count} tutorials`)
    
    // Delete reminders created by or for these users
    const deletedReminders = await prisma.reminder.deleteMany({
      where: {
        OR: [
          { createdById: { in: userIdsToDelete } },
          { userId: { in: userIdsToDelete } }
        ]
      }
    })
    console.log(`   Deleted ${deletedReminders.count} reminders`)
    
    // Delete default layouts created by these users
    const deletedLayouts = await prisma.defaultLayout.deleteMany({
      where: { createdById: { in: userIdsToDelete } }
    })
    console.log(`   Deleted ${deletedLayouts.count} default layouts`)
    
    // Delete reporting files uploaded by these users
    const deletedFiles = await prisma.reportingFile.deleteMany({
      where: { uploadedBy: { in: userIdsToDelete } }
    })
    console.log(`   Deleted ${deletedFiles.count} reporting files`)
    
    // Delete reporting dashboards created/updated by these users
    const deletedDashboards = await prisma.reportingDashboard.deleteMany({
      where: {
        OR: [
          { createdBy: { in: userIdsToDelete } },
          { updatedBy: { in: userIdsToDelete } }
        ]
      }
    })
    console.log(`   Deleted ${deletedDashboards.count} reporting dashboards`)
    
    // Delete approvals requested by these users
    const deletedApprovals = await prisma.approval.deleteMany({
      where: { requestedById: { in: userIdsToDelete } }
    })
    console.log(`   Deleted ${deletedApprovals.count} approvals`)
    
    // Delete goals owned by these users
    const deletedGoals = await prisma.goal.deleteMany({
      where: { ownerId: { in: userIdsToDelete } }
    })
    console.log(`   Deleted ${deletedGoals.count} goals`)
    
    // Delete programs owned by these users
    const deletedPrograms = await prisma.program.deleteMany({
      where: { ownerId: { in: userIdsToDelete } }
    })
    console.log(`   Deleted ${deletedPrograms.count} programs`)
    
    // Delete projects managed or created by these users
    const deletedProjects = await prisma.project.deleteMany({
      where: {
        OR: [
          { managerId: { in: userIdsToDelete } },
          { createdById: { in: userIdsToDelete } }
        ]
      }
    })
    console.log(`   Deleted ${deletedProjects.count} projects`)
    
    // Delete invitations sent by these users
    const deletedInvitations = await prisma.tenantInvitation.deleteMany({
      where: { invitedById: { in: userIdsToDelete } }
    })
    console.log(`   Deleted ${deletedInvitations.count} invitations`)
    
    console.log('')
    console.log('🗑️  Deleting users...')
    
    // Now delete the users
    const result = await prisma.user.deleteMany({
      where: {
        id: { in: userIdsToDelete }
      }
    })

    console.log(`   ✅ Deleted ${result.count} user(s)`)
    console.log('')

    // Verify final count
    const remainingUsers = await prisma.user.count()
    console.log(`✅ Remaining users: ${remainingUsers}`)
    
    if (remainingUsers === 1) {
      const remainingUser = await prisma.user.findUnique({
        where: { email: KEEP_EMAIL }
      })
      console.log(`✅ Remaining user: ${remainingUser?.email}`)
      console.log('')
      console.log('✨ User deletion completed successfully!')
    } else {
      console.warn(`⚠️  Warning: Expected 1 user remaining, but found ${remainingUsers}`)
    }

  } catch (error) {
    console.error('❌ Error during user deletion:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the deletion
deleteUsersExcept()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

