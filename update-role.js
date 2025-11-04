const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updatePlatformOwner() {
  try {
    console.log('Updating user role to PLATFORM_OWNER...')
    
    const result = await prisma.user.updateMany({
      where: {
        email: 'sandeep200680@gmail.com'
      },
      data: {
        role: 'PLATFORM_OWNER'
      }
    })
    
    console.log(`✅ Updated ${result.count} user(s)`)
    
    // Verify
    const user = await prisma.user.findUnique({
      where: { email: 'sandeep200680@gmail.com' },
      select: { email: true, role: true }
    })
    
    console.log('Current user data:', user)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

updatePlatformOwner()

