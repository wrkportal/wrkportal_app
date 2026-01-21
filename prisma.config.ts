import type { Config } from 'prisma'

export default {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
} satisfies Config
