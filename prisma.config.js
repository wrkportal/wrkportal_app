// Prisma 7 config file
// DATABASE_URL must be set as environment variable
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set')
}

module.exports = {
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
}
