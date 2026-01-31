const { execSync } = require('child_process')

if (process.env.VERCEL || process.env.SKIP_PRISMA_GENERATE === '1') {
  process.exit(0)
}

execSync('prisma generate --schema=prisma/schema.prisma', { stdio: 'inherit' })
