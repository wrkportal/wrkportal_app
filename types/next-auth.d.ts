import { DefaultSession } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      tenantId: string
      emailVerified?: Date | null
    } & DefaultSession['user']
  }

  interface User {
    role: string
    tenantId: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    tenantId: string
    emailVerified?: Date | null
  }
}
