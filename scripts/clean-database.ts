/**
 * Database Cleanup Script
 * 
 * This script cleans the database to prepare for first-time use.
 * It removes all data while preserving the schema and essential configuration.
 * 
 * WARNING: This will delete all data from the database!
 * Only run this in development or when setting up a fresh environment.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper function to safely delete from a model
async function safeDelete(modelName: string, deleteFn: () => Promise<any>) {
  try {
    await deleteFn()
    console.log(`✓ Cleared ${modelName}`)
  } catch (error: any) {
    if (
      error?.code === 'P2001' ||
      error?.message?.includes('does not exist') ||
      error?.message?.includes('Unknown model') ||
      error?.message?.includes('model does not exist') ||
      error?.message?.includes('Cannot read properties of undefined')
    ) {
      console.log(`⚠ ${modelName} table not found, skipping`)
    } else {
      throw error
    }
  }
}

async function cleanDatabase() {
  console.log('Starting database cleanup...')

  try {
    // Delete all data in reverse order of dependencies
    // Start with child tables and work up to parent tables

    // Task-related (delete in order: comments, time tracking, then tasks)
    await safeDelete('task comments', () => prisma.taskComment.deleteMany({}))
    await safeDelete('time tracking records', () => prisma.timeTracking.deleteMany({}))
    await safeDelete('tasks', () => prisma.task.deleteMany({}))

    // Collaboration
    await safeDelete('collaboration files', () => prisma.collaborationFile.deleteMany({}))
    await safeDelete('collaboration messages', () => prisma.collaborationMessage.deleteMany({}))
    await safeDelete('collaboration members', () => prisma.collaborationMember.deleteMany({}))
    await safeDelete('collaborations', () => prisma.collaboration.deleteMany({}))

    // Calls
    await safeDelete('call participants', () => prisma.callParticipant.deleteMany({}))
    await safeDelete('calls', () => prisma.call.deleteMany({}))

    // Sales
    await safeDelete('sales activities', () => (prisma as any).salesActivity?.deleteMany({}) || Promise.resolve())
    await safeDelete('sales quotes', () => (prisma as any).salesQuote?.deleteMany({}) || Promise.resolve())
    await safeDelete('sales orders', () => (prisma as any).salesOrder?.deleteMany({}) || Promise.resolve())
    await safeDelete('sales opportunities', () => (prisma as any).salesOpportunity?.deleteMany({}) || Promise.resolve())
    await safeDelete('sales leads', () => (prisma as any).salesLead?.deleteMany({}) || Promise.resolve())
    await safeDelete('sales contacts', () => (prisma as any).salesContact?.deleteMany({}) || Promise.resolve())
    await safeDelete('sales accounts', () => (prisma as any).salesAccount?.deleteMany({}) || Promise.resolve())

    // Projects
    await safeDelete('project members', () => prisma.projectMember.deleteMany({}))
    await safeDelete('projects', () => prisma.project.deleteMany({}))

    // OKRs
    await safeDelete('OKRs', () => (prisma as any).okr?.deleteMany({}) || Promise.resolve())

    // Notifications
    await safeDelete('notifications', () => prisma.notification.deleteMany({}))

    // Operations (if tables exist)
    await safeDelete('operations inventory items', () => (prisma as any).operationsInventoryItem?.deleteMany({}) || Promise.resolve())
    await safeDelete('operations work orders', () => (prisma as any).operationsWorkOrder?.deleteMany({}) || Promise.resolve())
    await safeDelete('operations trainings', () => (prisma as any).operationsTraining?.deleteMany({}) || Promise.resolve())
    await safeDelete('operations incidents', () => (prisma as any).operationsIncident?.deleteMany({}) || Promise.resolve())

    // IT (if tables exist)
    await safeDelete('IT tickets', () => (prisma as any).iTTicket?.deleteMany({}) || Promise.resolve())
    await safeDelete('IT assets', () => (prisma as any).iTAsset?.deleteMany({}) || Promise.resolve())

    // Recruitment (if tables exist)
    await safeDelete('recruitment candidates', () => (prisma as any).recruitmentCandidate?.deleteMany({}) || Promise.resolve())
    await safeDelete('recruitment jobs', () => (prisma as any).recruitmentJob?.deleteMany({}) || Promise.resolve())

    // Finance (if tables exist)
    await safeDelete('finance invoices', () => (prisma as any).financeInvoice?.deleteMany({}) || Promise.resolve())
    await safeDelete('finance expenses', () => (prisma as any).financeExpense?.deleteMany({}) || Promise.resolve())

    // Widget defaults (keep structure but clear data)
    await safeDelete('widget defaults', () => (prisma as any).widgetDefault?.deleteMany({}) || Promise.resolve())

    console.log('\n✅ Database cleanup completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('   1. Clear browser localStorage to reset widget preferences')
    console.log('   2. Restart your application')
    console.log('   3. Log in to see the welcome messages on all dashboards')

  } catch (error) {
    console.error('❌ Error during database cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanDatabase()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
