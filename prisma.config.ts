import type { Config } from 'prisma'

export default {
  datasource: {
    url: process.env.DATABASE_URL,
  },
} satisfies Config
