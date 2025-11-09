/**
 * Delete all notifications from database
 * 
 * This script removes all notification entries.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteNotifications() {
  try {
    console.log('🗑️  Deleting notifications...')

    const result = await prisma.notification.deleteMany({})

    console.log(`✅ Deleted ${result.count} notification(s)`)

  } catch (error) {
    console.error('❌ Error deleting notifications:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the deletion
deleteNotifications()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

