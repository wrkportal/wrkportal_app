const { execSync } = require('child_process')

// Skip during Docker build if prisma client is already generated
if (process.env.SKIP_PRISMA_GENERATE === '1') {
  process.exit(0)
}

execSync('prisma generate --schema=prisma/schema.prisma', { stdio: 'inherit' })
