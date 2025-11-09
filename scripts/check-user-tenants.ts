// scripts/check-user-tenants.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Checking users and their tenants...\n');

    // Get all users with their tenant info
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        tenantId: true,
        status: true,
        role: true,
        tenant: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        tenantId: 'asc'
      }
    });

    console.log(`Total users: ${users.length}\n`);

    // Group users by tenant
    const usersByTenant: { [key: string]: any[] } = {};
    users.forEach(user => {
      if (!usersByTenant[user.tenantId]) {
        usersByTenant[user.tenantId] = [];
      }
      usersByTenant[user.tenantId].push(user);
    });

    // Display users grouped by tenant
    for (const [tenantId, tenantUsers] of Object.entries(usersByTenant)) {
      const tenantName = tenantUsers[0]?.tenant?.name || 'Unknown';
      console.log(`\n📁 Tenant: ${tenantName} (${tenantId})`);
      console.log(`   Users: ${tenantUsers.length}`);
      console.log('   ---');
      
      tenantUsers.forEach(user => {
        const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name';
        console.log(`   - ${displayName} (${user.email})`);
        console.log(`     Status: ${user.status}, Role: ${user.role}`);
      });
    }

    // Check for users without tenant
    const usersWithoutTenant = await prisma.user.findMany({
      where: {
        tenantId: null as any
      }
    });

    if (usersWithoutTenant.length > 0) {
      console.log('\n⚠️  Users without tenant:');
      usersWithoutTenant.forEach(user => {
        console.log(`   - ${user.email}`);
      });
    }

  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

