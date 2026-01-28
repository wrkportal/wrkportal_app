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
          // CRITICAL: This check must happen BEFORE tenant creation to prevent duplicate tenants
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
            
            if (pendingInvitation) {
              console.log('[OAuth] ✅ Pending invitation found for:', emailLower, 'Tenant:', pendingInvitation.tenant.name)
            } else {
              console.log('[OAuth] No pending invitation found for:', emailLower)
            }
          } catch (error: any) {
            // If TenantInvitation table doesn't exist, log but continue
            // This should not prevent user signup
            if (error.code === 'P2021' || error.message?.includes('does not exist')) {
              console.warn('[OAuth] TenantInvitation table does not exist, skipping invitation check')
            } else {
              console.error('[OAuth] Error checking for invitations:', error.message)
              // Don't throw - continue without invitation check
            }
          }

          // STEP 3: Get or create tenant
          // SECURITY: Public domains (Gmail, Yahoo, etc.) get separate tenants
          // Corporate domains share a tenant
          // CRITICAL: If user has a pending invitation, ALWAYS use that tenant (don't create new one)
          let tenant = null
          let userRole: 'ORG_ADMIN' | 'TEAM_MEMBER' = 'TEAM_MEMBER'

          if (pendingInvitation) {
            // User has a pending invitation - join the invited tenant
            // This takes precedence over public domain check to prevent duplicate tenants
            console.log('[OAuth] ✅ Using invited tenant (invitation takes precedence):', pendingInvitation.tenant.name)
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

            // Check if existing user has a pending invitation (cross-tenant invitation)
            if (pendingInvitation) {
              console.log('[OAuth] Existing user has pending invitation, creating UserTenantAccess record')
              
              try {
                // Mark invitation as accepted
                await prisma.tenantInvitation.update({
                  where: { id: pendingInvitation.id },
                  data: {
                    status: 'ACCEPTED',
                    acceptedAt: new Date(),
                  },
                })
                console.log('[OAuth] ✅ Invitation marked as accepted for existing user')

                // Check if UserTenantAccess record already exists
                let existingAccess = null
                try {
                  existingAccess = await (prisma as any).userTenantAccess.findUnique({
                    where: {
                      userId_tenantId: {
                        userId: existingUser.id,
                        tenantId: pendingInvitation.tenant.id,
                      },
                    },
                  })
                } catch (error: any) {
                  // Table might not exist, continue to create
                  if (error.code !== 'P2021' && !error.message?.includes('does not exist')) {
                    throw error
                  }
                }

                if (!existingAccess) {
                  // Parse allowedSections from invitation if it's a JSON string
                  let allowedSectionsValue = pendingInvitation.allowedSections
                  if (allowedSectionsValue && typeof allowedSectionsValue === 'string') {
                    try {
                      const parsed = JSON.parse(allowedSectionsValue)
                      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.sections)) {
                        allowedSectionsValue = JSON.stringify(parsed.sections)
                      } else if (Array.isArray(parsed)) {
                        allowedSectionsValue = allowedSectionsValue
                      } else {
                        allowedSectionsValue = JSON.stringify([])
                      }
                    } catch (e) {
                      console.warn('[OAuth] Invalid allowedSections format in invitation, using empty array')
                      allowedSectionsValue = JSON.stringify([])
                    }
                  } else if (!allowedSectionsValue) {
                    allowedSectionsValue = JSON.stringify([])
                  }

                  // Create UserTenantAccess record for cross-tenant access
                  await (prisma as any).userTenantAccess.create({
                    data: {
                      userId: existingUser.id,
                      tenantId: pendingInvitation.tenant.id,
                      role: pendingInvitation.role,
                      allowedSections: allowedSectionsValue,
                      invitedById: pendingInvitation.invitedById,
                      invitationId: pendingInvitation.id,
                      isActive: false, // Not the primary tenant
                    },
                  })
                  console.log('[OAuth] ✅ UserTenantAccess record created for existing user:', {
                    userId: existingUser.id,
                    tenantId: pendingInvitation.tenant.id,
                    tenantName: pendingInvitation.tenant.name,
                  })
                } else {
                  console.log('[OAuth] UserTenantAccess record already exists for this user and tenant')
                }
              } catch (error: any) {
                console.error('[OAuth] ❌ Failed to create UserTenantAccess for existing user:', {
                  error: error.message,
                  code: error.code,
                  meta: error.meta,
                  userId: existingUser.id,
                  tenantId: pendingInvitation.tenant.id,
                  invitationId: pendingInvitation.id,
                })
                
                if (error.code === 'P2021' || error.message?.includes('does not exist')) {
                  console.warn('[OAuth] UserTenantAccess table does not exist - this is expected if migration not run')
                } else if (error.code === 'P2002') {
                  console.warn('[OAuth] UserTenantAccess record might already exist:', error.meta)
                } else {
                  console.error('[OAuth] Unexpected error creating UserTenantAccess:', error)
                }
                // Don't fail login if UserTenantAccess creation fails
              }
            }

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
                  // Store allowedSections from invitation if available
                  // Parse JSON string if needed, or use as-is if already parsed
                  allowedSections: pendingInvitation?.allowedSections 
                    ? (typeof pendingInvitation.allowedSections === 'string' 
                        ? pendingInvitation.allowedSections 
                        : JSON.stringify(pendingInvitation.allowedSections))
                    : null,
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
                console.log('[OAuth] Attempting to create UserTenantAccess record:', {
                  userId: createdUser.id,
                  tenantId: pendingInvitation.tenant.id,
                  role: pendingInvitation.role,
                  invitationId: pendingInvitation.id,
                })
                
                // Parse allowedSections from invitation if it's a JSON string
                let allowedSectionsValue = pendingInvitation.allowedSections
                if (allowedSectionsValue && typeof allowedSectionsValue === 'string') {
                  try {
                    // Try to parse - if it's already valid JSON, keep it as string
                    // If it's an object with sections, extract the sections array
                    const parsed = JSON.parse(allowedSectionsValue)
                    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.sections)) {
                      // Store as JSON string with sections array
                      allowedSectionsValue = JSON.stringify(parsed.sections)
                    } else if (Array.isArray(parsed)) {
                      // Already an array, keep as JSON string
                      allowedSectionsValue = allowedSectionsValue
                    } else {
                      // Invalid format, store as empty array
                      allowedSectionsValue = JSON.stringify([])
                    }
                  } catch (e) {
                    // Not valid JSON, treat as empty
                    console.warn('[OAuth] Invalid allowedSections format in invitation, using empty array')
                    allowedSectionsValue = JSON.stringify([])
                  }
                } else if (!allowedSectionsValue) {
                  // No allowedSections specified - store as empty array (no access)
                  allowedSectionsValue = JSON.stringify([])
                }
                
                await (prisma as any).userTenantAccess.create({
                  data: {
                    userId: createdUser.id,
                    tenantId: pendingInvitation.tenant.id,
                    role: pendingInvitation.role,
                    allowedSections: allowedSectionsValue,
                    invitedById: pendingInvitation.invitedById,
                    invitationId: pendingInvitation.id,
                    isActive: true, // This is the tenant they're joining
                  },
                })
                console.log('[OAuth] ✅ UserTenantAccess record created successfully')
              } catch (error: any) {
                // Log all errors to help debug
                console.error('[OAuth] ❌ Failed to create UserTenantAccess record:', {
                  error: error.message,
                  code: error.code,
                  meta: error.meta,
                  userId: createdUser.id,
                  tenantId: pendingInvitation.tenant.id,
                  invitationId: pendingInvitation.id,
                  stack: error.stack,
                })
                
                // UserTenantAccess table might not exist yet, or there might be a constraint issue
                if (error.code === 'P2021' || error.message?.includes('does not exist')) {
                  console.warn('[OAuth] UserTenantAccess table does not exist - this is expected if migration not run')
                } else if (error.code === 'P2002') {
                  // Unique constraint violation - record might already exist
                  console.warn('[OAuth] UserTenantAccess record might already exist:', error.meta)
                } else {
                  // Other error - log it but don't fail user creation
                  console.error('[OAuth] Unexpected error creating UserTenantAccess:', error)
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
  