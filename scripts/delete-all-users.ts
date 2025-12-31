/**
 * Script to delete all users and related data from the database
 * 
 * WARNING: This will permanently delete ALL users and their related data.
 * Use only for testing/development purposes.
 * 
 * Run with: npx tsx scripts/delete-all-users.ts
 */

import { prisma } from '../lib/prisma'

async function deleteAllUsers() {
  try {
    console.log('🗑️  Starting deletion of all users and related data...\n')

    // Step 1: Delete all verification tokens
    console.log('1. Deleting verification tokens...')
    const deletedTokens = await prisma.verificationToken.deleteMany({})
    console.log(`   ✅ Deleted ${deletedTokens.count} verification tokens\n`)

    // Step 2: Delete all tenant invitations
    console.log('2. Deleting tenant invitations...')
    const deletedInvitations = await prisma.tenantInvitation.deleteMany({})
    console.log(`   ✅ Deleted ${deletedInvitations.count} tenant invitations\n`)

    // Step 3: Delete related records that don't cascade
    console.log('3. Deleting related records that don\'t cascade...')
    
    // Delete tasks first (they reference users as creators/assignees)
    const deletedTasks = await prisma.task.deleteMany({})
    if (deletedTasks.count > 0) {
      console.log(`   ✅ Deleted ${deletedTasks.count} tasks`)
    }
    
    // Delete projects (they reference users as managers)
    const deletedProjects = await prisma.project.deleteMany({})
    if (deletedProjects.count > 0) {
      console.log(`   ✅ Deleted ${deletedProjects.count} projects`)
    }
    
    // Delete programs (they reference users as owners)
    const deletedPrograms = await prisma.program.deleteMany({})
    if (deletedPrograms.count > 0) {
      console.log(`   ✅ Deleted ${deletedPrograms.count} programs`)
    }
    
    // Delete approvals (they reference users)
    const deletedApprovals = await prisma.approval.deleteMany({})
    if (deletedApprovals.count > 0) {
      console.log(`   ✅ Deleted ${deletedApprovals.count} approvals`)
    }

    // Delete goals (they reference users as owners)
    const deletedGoals = await prisma.goal.deleteMany({})
    if (deletedGoals.count > 0) {
      console.log(`   ✅ Deleted ${deletedGoals.count} goals`)
    }

    // Delete collaborations (they reference users as creators)
    const deletedCollaborations = await prisma.collaboration.deleteMany({})
    if (deletedCollaborations.count > 0) {
      console.log(`   ✅ Deleted ${deletedCollaborations.count} collaborations`)
    }

    // Delete tutorials (they reference users as creators)
    const deletedTutorials = await prisma.tutorial.deleteMany({})
    if (deletedTutorials.count > 0) {
      console.log(`   ✅ Deleted ${deletedTutorials.count} tutorials`)
    }

    // Delete default layouts (they reference users as creators)
    const deletedLayouts = await prisma.defaultLayout.deleteMany({})
    if (deletedLayouts.count > 0) {
      console.log(`   ✅ Deleted ${deletedLayouts.count} default layouts`)
    }

    // Delete reporting files (they reference users as uploaders)
    const deletedReportingFiles = await prisma.reportingFile.deleteMany({})
    if (deletedReportingFiles.count > 0) {
      console.log(`   ✅ Deleted ${deletedReportingFiles.count} reporting files`)
    }

    // Delete reporting dashboards (they reference users)
    const deletedDashboards = await prisma.reportingDashboard.deleteMany({})
    if (deletedDashboards.count > 0) {
      console.log(`   ✅ Deleted ${deletedDashboards.count} reporting dashboards`)
    }

    // Delete reminders (they reference users)
    const deletedReminders = await prisma.reminder.deleteMany({})
    if (deletedReminders.count > 0) {
      console.log(`   ✅ Deleted ${deletedReminders.count} reminders`)
    }

    console.log('')

    // Step 4: Delete all users (this will cascade to related tables)
    console.log('4. Deleting all users (and related data via cascade)...')
    
    // First, let's see how many users we have
    const userCount = await prisma.user.count()
    console.log(`   Found ${userCount} users to delete`)

    // Delete all users - this will automatically cascade to:
    // - Accounts
    // - Sessions
    // - UserSkills
    // - ProjectMembers
    // - Tasks (created/assigned)
    // - TaskComments
    // - Timesheets
    // - TimeTrackings
    // - Notifications
    // - AuditLogs
    // - Tutorials
    // - Collaborations
    // - CollaborationMembers/Messages/Files
    // - WorkflowAssignments
    // - Reminders
    // - DefaultLayouts
    // - ReportingFiles
    // - ReportingDashboards
    // - ApprovalApprovers
    // - And more...
    
    const deletedUsers = await prisma.user.deleteMany({})
    console.log(`   ✅ Deleted ${deletedUsers.count} users and their related data\n`)

    // Step 5: Optional - Delete tenants that have no users
    // (Note: This is optional. You might want to keep tenants for testing)
    console.log('4. Checking for empty tenants...')
    const tenants = await prisma.tenant.findMany({
      include: {
        users: {
          select: { id: true }
        }
      }
    })

    const emptyTenants = tenants.filter(t => t.users.length === 0)
    if (emptyTenants.length > 0) {
      console.log(`   Found ${emptyTenants.length} empty tenants`)
      
      // Delete empty tenants - this will cascade to:
      // - OrgUnits
      // - Programs
      // - Projects
      // - Tasks
      // - Notifications
      // - AuditLogs
      // - Tutorials
      // - Collaborations
      // - Reminders
      // - DefaultLayouts
      // - ReportingFiles
      
      const deletedTenants = await prisma.tenant.deleteMany({
        where: {
          id: {
            in: emptyTenants.map(t => t.id)
          }
        }
      })
      console.log(`   ✅ Deleted ${deletedTenants.count} empty tenants\n`)
    } else {
      console.log('   ✅ No empty tenants found\n')
    }

    // Step 6: Clean up any remaining orphaned data
    console.log('5. Cleaning up any remaining orphaned data...')
    
    // Delete any remaining verification tokens (just in case)
    const remainingTokens = await prisma.verificationToken.deleteMany({})
    if (remainingTokens.count > 0) {
      console.log(`   ✅ Deleted ${remainingTokens.count} remaining verification tokens`)
    }

    console.log('\n✅ Successfully deleted all users and related data!')
    console.log('💡 You can now sign up again with any email address.\n')

  } catch (error) {
    console.error('❌ Error deleting users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
deleteAllUsers()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

