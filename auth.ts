import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) {
          throw new Error('Invalid credentials')
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        console.log('🔍 Login check - email verification status:', {
          email: user.email,
          emailVerified: user.emailVerified,
          isVerified: !!user.emailVerified,
        })

        if (!user.emailVerified) {
          console.warn('⚠️ Login blocked - email not verified for:', user.email)
          throw new Error('EMAIL_NOT_VERIFIED')
        }

        console.log('✅ Email verified, allowing login for:', user.email)

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          tenantId: user.tenantId,
          emailVerified: user.emailVerified,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user, account, profile }) {
      // Keep default behavior for non-Google
      if (account?.provider !== 'google') return true

      // Google OAuth sign-in handling
      if (profile) {
        console.log('[OAuth] ========== START OAuth signIn callback ==========')

        // SECURITY: Verify OAuth worked
        if (!account.access_token) {
          console.error('[OAuth] ❌ No access_token - OAuth authentication failed')
          return false
        }
        if (!account.id_token) {
          console.error('[OAuth] ❌ No id_token - OAuth authentication failed')
          return false
        }

        const email = (user.email || (profile as any).email) as string | undefined
        if (!email) {
          console.error('[OAuth] ❌ No email provided by Google')
          return false
        }

        // SECURITY: Verify Google says email is verified
        const googleEmailVerified =
          (profile as any).email_verified === true || (profile as any).email_verified === undefined
        if (!googleEmailVerified) {
          console.error('[OAuth] ❌ Email not verified by Google')
          return false
        }

        const emailLower = email.toLowerCase()
        const domain = emailLower.split('@')[1]
        
        // Import domain utilities to check if it's a public domain
        const { isPublicDomain, extractDomain } = await import('@/lib/domain-utils')
        const isPublic = isPublicDomain(emailLower)

        const toVerifyRedirect = (reason: 'new' | 'unverified') => {
          const qs = new URLSearchParams({
            email: emailLower,
            provider: 'google',
            reason,
          })
          // You can change this route if your verify page is different.
          return `/verify-email?${qs.toString()}`
        }

        // Retry helper (your existing helper, unchanged)
        const withRetry = async <T,>(
          operation: () => Promise<T>,
          operationName: string,
          retries = 3,
          delay = 1000
        ): Promise<T> => {
          for (let i = 0; i < retries; i++) {
            try {
              console.log(`[OAuth] ${operationName} - Attempt ${i + 1}/${retries}`)
              const result = await operation()
              console.log(`[OAuth] ${operationName} - ✅ Success`)
              return result
            } catch (error: any) {
              const isConnectionError =
                error?.code === 'P1001' ||
                error?.code === 'P1017' ||
                error?.message?.includes('connection') ||
                error?.message?.includes('timeout')

              console.error(`[OAuth] ${operationName} - ❌ Error (attempt ${i + 1}):`, {
                message: error.message,
                code: error.code,
                isConnectionError,
              })

              if (isConnectionError && i < retries - 1) {
                const waitTime = delay * (i + 1)
                console.log(`[OAuth] ${operationName} - Waiting ${waitTime}ms before retry...`)
                await new Promise((resolve) => setTimeout(resolve, waitTime))
                continue
              }
              throw error
            }
          }
          throw new Error(`${operationName} failed after ${retries} retries`)
        }

        try {
          // STEP 1: DB connection test
          await withRetry(() => prisma.$queryRaw`SELECT 1 as test`, 'Database Connection Test', 3, 1000)

          // STEP 2: Check for pending invitation first
          // This allows Gmail users to join existing tenants via invitation
          let pendingInvitation = null
          try {
            pendingInvitation = await prisma.tenantInvitation.findFirst({
              where: {
                email: emailLower,
                status: 'PENDING',
                expiresAt: { gt: new Date() },
              },
              include: {
                tenant: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            })
          } catch (error: any) {
            console.warn('[OAuth] Could not check for invitations:', error.message)
            // Continue without invitation check if table doesn't exist
          }

          // STEP 3: Get or create tenant
          // SECURITY: Public domains (Gmail, Yahoo, etc.) get separate tenants
          // Corporate domains share a tenant
          // EXCEPTION: If user has a pending invitation, use that tenant
          let tenant = null
          let userRole: 'ORG_ADMIN' | 'TEAM_MEMBER' = 'TEAM_MEMBER'

          if (pendingInvitation) {
            // User has a pending invitation - join the invited tenant
            console.log('[OAuth] Pending invitation found, joining invited tenant:', pendingInvitation.tenant.name)
            tenant = pendingInvitation.tenant
            userRole = pendingInvitation.role as 'ORG_ADMIN' | 'TEAM_MEMBER'
            
            // Mark invitation as accepted (will be done after user creation)
          } else if (isPublic) {
            // Public domain: Each user gets their own tenant (domain = null)
            // This prevents Gmail users from seeing each other's data
            console.log('[OAuth] Public domain detected, creating individual tenant for user')
            tenant = await withRetry(
              async () => {
                const tenantName = `${(profile as any).name || email}'s Organization`
                const tenantId = `cl${Date.now()}${Math.random().toString(36).substring(2, 11)}`

                // Create tenant with domain = null for public emails
                await prisma.$executeRaw`
                  INSERT INTO "Tenant" (id, name, domain, "type", "createdAt", "updatedAt")
                  VALUES (${tenantId}, ${tenantName}, NULL, 'ORGANIZATION', NOW(), NOW())
                `

                const created = await prisma.tenant.findUnique({
                  where: { id: tenantId },
                  select: { id: true, name: true },
                })

                if (!created) throw new Error('Failed to create tenant after insert')
                return created
              },
              'Create Individual Tenant',
              3,
              1000
            )

            userRole = 'ORG_ADMIN'
          } else {
            // Corporate/private domain: Group users by domain
            tenant = await withRetry(
              () =>
                prisma.tenant.findFirst({
                  where: { domain },
                  select: { id: true, name: true },
                }),
              'Find Tenant',
              3,
              1000
            )

            if (!tenant) {
              console.log('[OAuth] Corporate domain tenant not found, creating...')
              tenant = await withRetry(
                async () => {
                  const tenantName = `${domain} Organization`
                  const tenantId = `cl${Date.now()}${Math.random().toString(36).substring(2, 11)}`

                  await prisma.$executeRaw`
                    INSERT INTO "Tenant" (id, name, domain, "type", "createdAt", "updatedAt")
                    VALUES (${tenantId}, ${tenantName}, ${domain}, 'ORGANIZATION', NOW(), NOW())
                    ON CONFLICT (domain) DO NOTHING
                  `

                  const created = await prisma.tenant.findFirst({
                    where: { domain },
                    select: { id: true, name: true },
                  })

                  if (!created) throw new Error('Failed to create or find tenant after insert')
                  return created
                },
                'Create Corporate Tenant',
                3,
                1000
              )

              userRole = 'ORG_ADMIN'
            }
          }

          // STEP 4: Check user
          const existingUser = await withRetry(
            () =>
              prisma.user.findUnique({
                where: { email: emailLower },
              }),
            'Find User',
            3,
            1000
          )

          // ✅ CASE A: Existing user but NOT verified → DO NOT create session
          if (existingUser && !existingUser.emailVerified) {
            console.warn('[OAuth] ⛔ Existing Google user is not verified. Redirecting to verify page:', emailLower)
            // Return redirect URL - NextAuth will block sign-in and redirect to this URL
            return toVerifyRedirect('unverified')
          }

          // ✅ CASE B: Existing user and verified → allow login
          if (existingUser && existingUser.emailVerified) {
            console.log('[OAuth] ✅ Existing verified user. Allowing login:', emailLower)

            // Optional: update profile fields (your previous behavior)
            await withRetry(
              () =>
                prisma.user.update({
                  where: { email: emailLower },
                  data: {
                    name: (profile as any).name || email,
                    firstName:
                      (profile as any).given_name ||
                      (profile as any).name?.split(' ')[0] ||
                      existingUser.firstName,
                    lastName:
                      (profile as any).family_name ||
                      (profile as any).name?.split(' ')[1] ||
                      existingUser.lastName,
                    image: (profile as any).picture || user.image || existingUser.image,
                  },
                }),
              'Update User',
              3,
              1000
            )

            return true
          }

          // ✅ CASE C: New user → create user + send code → DO NOT create session
          console.log('[OAuth] 🆕 New Google user. Creating account and sending verification email:', emailLower)

          const createdUser = await withRetry(
            () =>
              prisma.user.create({
                data: {
                  email: emailLower,
                  name: (profile as any).name || email,
                  firstName: (profile as any).given_name || (profile as any).name?.split(' ')[0] || '',
                  lastName: (profile as any).family_name || (profile as any).name?.split(' ')[1] || '',
                  image: (profile as any).picture || user.image,
                  tenantId: tenant!.id,
                  role: userRole,
                  emailVerified: null, // require verification
                  allowedSections: pendingInvitation?.allowedSections || null, // Use invitation's allowed sections if available
                } as any,
              }),
            'Create User',
            3,
            1000
          )

          // Mark invitation as accepted if user was created via invitation
          if (pendingInvitation) {
            try {
              await prisma.tenantInvitation.update({
                where: { id: pendingInvitation.id },
                data: {
                  status: 'ACCEPTED',
                  acceptedAt: new Date(),
                },
              })
              console.log('[OAuth] ✅ Invitation marked as accepted')

              // Create UserTenantAccess record for cross-tenant access (if table exists)
              try {
                await (prisma as any).userTenantAccess.create({
                  data: {
                    userId: createdUser.id,
                    tenantId: pendingInvitation.tenant.id,
                    role: pendingInvitation.role,
                    allowedSections: pendingInvitation.allowedSections,
                    invitedById: pendingInvitation.invitedById,
                    invitationId: pendingInvitation.id,
                    isActive: true, // This is the tenant they're joining
                  },
                })
                console.log('[OAuth] ✅ UserTenantAccess record created')
              } catch (error: any) {
                // UserTenantAccess table might not exist yet
                if (error.code !== 'P2021' && !error.message?.includes('does not exist')) {
                  console.warn('[OAuth] Could not create UserTenantAccess record:', error.message)
                }
              }
            } catch (error: any) {
              console.warn('[OAuth] Could not mark invitation as accepted:', error.message)
              // Don't fail user creation if invitation update fails
            }
          }

          // Generate + send verification token (your previous behavior)
          try {
            const { randomBytes } = await import('crypto')
            const { sendEmailVerification } = await import('@/lib/email')

            const verificationToken = randomBytes(32).toString('hex')
            const expires = new Date(Date.now() + 48 * 60 * 60 * 1000)

            await prisma.verificationToken.create({
              data: {
                identifier: emailLower,
                token: verificationToken,
                expires,
              },
            })

            await sendEmailVerification(
              emailLower,
              verificationToken,
              createdUser.firstName || createdUser.name || 'User'
            )

            console.log('[OAuth] ✅ Verification email sent to:', emailLower)
          } catch (emailError: any) {
            console.error('[OAuth] ❌ Failed to send verification email:', emailError.message)
            // Keep going: user can resend later
          }

          // ⛔ IMPORTANT: Block sign-in and redirect to verify page
          // Return redirect URL - NextAuth will block sign-in and redirect to this URL
          return toVerifyRedirect('new')
        } catch (error: any) {
          console.error('[OAuth] ========== FAILED - Error in signIn callback ==========')
          console.error('[OAuth] Error details:', {
            message: error.message,
            code: error.code,
            name: error.name,
            email: (user?.email || (profile as any)?.email)?.toString(),
            stack: error.stack,
          })
          return false
        }
      }

      return true
    },

    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        // For OAuth, user MUST exist in DB
        if (user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: {
              id: true,
              email: true,
              role: true,
              tenantId: true,
              emailVerified: true,
            },
          })

          if (dbUser) {
            token.id = dbUser.id
            token.email = dbUser.email
            token.role = dbUser.role
            token.tenantId = dbUser.tenantId
            token.emailVerified = dbUser.emailVerified
          } else {
            console.error('[JWT] ❌ User not found in DB - signup required:', user.email)
          }
        } else {
          token.id = user.id!
          token.email = user.email!
          token.role = (user as any).role
          token.tenantId = (user as any).tenantId
          token.emailVerified = (user as any).emailVerified
        }
      }

      if (trigger === 'update' && session) {
        token = { ...token, ...session }
      }

      return token
    },
  },
})
  