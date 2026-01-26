import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, UserRole } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isHydrated: boolean
  setUser: (user: User | null) => void
  setHydrated: (hydrated: boolean) => void
  logout: () => void
  hasPermission: (resource: string, action: string) => boolean
  hasRole: (role: UserRole | UserRole[]) => boolean
}

// Role-based screen access mapping
const roleScreenAccess: Record<UserRole, number[]> = {
  [UserRole.TENANT_SUPER_ADMIN]: [1, 15, 18, 19, 20, 21, 22],
  [UserRole.ORG_ADMIN]: [1, 3, 5, 6, 7, 8, 9, 12, 15, 18, 19],
  [UserRole.PMO_LEAD]: [1, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15],
  [UserRole.PROJECT_MANAGER]: [1, 2, 3, 4, 7, 8, 9, 11, 12, 13, 14, 15, 17],
  [UserRole.TEAM_MEMBER]: [1, 2, 3, 4, 8, 11, 12],
  [UserRole.EXECUTIVE]: [1, 6, 7, 8, 14, 15],
  [UserRole.RESOURCE_MANAGER]: [1, 3, 5, 9, 10, 12, 15],
  [UserRole.FINANCE_CONTROLLER]: [1, 3, 4, 11, 12, 15, 16],
  [UserRole.CLIENT_STAKEHOLDER]: [1, 3, 4, 12, 15],
  [UserRole.COMPLIANCE_AUDITOR]: [1, 15, 22],
  [UserRole.INTEGRATION_ADMIN]: [1, 17, 19, 20, 21, 22],
  [UserRole.PLATFORM_OWNER]: [1, 15, 18, 19, 20, 21, 22], // Same as TENANT_SUPER_ADMIN
}

// Permission matrix per role
const rolePermissions: Record<UserRole, Record<string, string[]>> = {
  [UserRole.TENANT_SUPER_ADMIN]: {
    '*': [
      'READ',
      'CREATE',
      'UPDATE',
      'DELETE',
      'APPROVE',
      'EXPORT',
      'CONFIGURE',
    ],
  },
  [UserRole.ORG_ADMIN]: {
    users: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
    teams: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
    projects: ['READ', 'CREATE', 'UPDATE'],
    settings: ['READ', 'CONFIGURE'],
  },
  [UserRole.PMO_LEAD]: {
    portfolios: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'],
    programs: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'],
    projects: ['READ', 'CREATE', 'UPDATE', 'APPROVE'],
    reports: ['READ', 'CREATE', 'EXPORT'],
    gates: ['READ', 'APPROVE'],
  },
  [UserRole.PROJECT_MANAGER]: {
    projects: ['READ', 'CREATE', 'UPDATE'],
    tasks: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
    risks: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
    issues: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
    changes: ['READ', 'CREATE', 'UPDATE'],
    resources: ['READ'],
    reports: ['READ', 'CREATE', 'EXPORT'],
  },
  [UserRole.TEAM_MEMBER]: {
    tasks: ['READ', 'UPDATE'],
    timesheets: ['READ', 'CREATE', 'UPDATE'],
    comments: ['READ', 'CREATE'],
  },
  [UserRole.EXECUTIVE]: {
    portfolios: ['READ'],
    programs: ['READ'],
    projects: ['READ'],
    reports: ['READ', 'EXPORT'],
    dashboards: ['READ'],
    changes: ['APPROVE'],
  },
  [UserRole.RESOURCE_MANAGER]: {
    resources: ['READ', 'CREATE', 'UPDATE'],
    bookings: ['READ', 'CREATE', 'UPDATE', 'APPROVE'],
    capacity: ['READ', 'CONFIGURE'],
    skills: ['READ', 'UPDATE'],
  },
  [UserRole.FINANCE_CONTROLLER]: {
    budgets: ['READ', 'CREATE', 'UPDATE', 'APPROVE'],
    costs: ['READ', 'CREATE', 'UPDATE'],
    timesheets: ['READ', 'APPROVE'],
    rates: ['READ', 'CONFIGURE'],
    invoices: ['READ', 'CREATE', 'EXPORT'],
  },
  [UserRole.CLIENT_STAKEHOLDER]: {
    projects: ['READ'],
    reports: ['READ'],
    changes: ['APPROVE'],
    comments: ['READ', 'CREATE'],
  },
  [UserRole.COMPLIANCE_AUDITOR]: {
    'audit-logs': ['READ', 'EXPORT'],
    reports: ['READ', 'EXPORT'],
    '*': ['READ'],
  },
  [UserRole.INTEGRATION_ADMIN]: {
    integrations: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'CONFIGURE'],
    webhooks: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
    'api-keys': ['READ', 'CREATE', 'DELETE'],
  },
  [UserRole.PLATFORM_OWNER]: {
    '*': [
      'READ',
      'CREATE',
      'UPDATE',
      'DELETE',
      'APPROVE',
      'EXPORT',
      'CONFIGURE',
    ],
  },
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isHydrated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),

      logout: () => {
        set({ user: null, isAuthenticated: false })
        // Note: The actual NextAuth signOut will be called from the component
        // This just clears the local state
      },

      hasPermission: (resource, action) => {
        const { user } = get()
        if (!user) return false

        const permissions = rolePermissions[user.role]
        if (!permissions) return false

        // Check wildcard permission
        if (permissions['*']?.includes(action)) return true

        // Check specific resource permission
        return permissions[resource]?.includes(action) || false
      },

      hasRole: (role) => {
        const { user } = get()
        if (!user) return false

        if (Array.isArray(role)) {
          return role.includes(user.role)
        }
        return user.role === role
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)

// Fetch authenticated user from API with cache busting
export async function fetchAuthenticatedUser(forceRefresh = false): Promise<User | null> {
  try {
    // Add cache busting parameter to ensure fresh data
    const cacheBuster = forceRefresh ? `?t=${Date.now()}` : ''
    const response = await fetch(`/api/user/me${cacheBuster}`, {
      cache: 'no-store', // Prevent caching
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      
      if (data.user) {
        return data.user
      }
      
      console.warn('[AuthStore] No user in API response')
      return null
    }
    
    // Handle 401 - user is not authenticated (this is OK, not an error)
    if (response.status === 401) {
      // Try to parse error details if available
      try {
        const data = await response.json()
        if (data.code === 'USER_NOT_FOUND_SIGNUP_REQUIRED') {
          // User has NextAuth session but no DB user - OAuth was blocked
          // Clear the invalid session
          console.warn('[AuthStore] User has NextAuth session but no DB user - signup required')
          try {
            await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' })
          } catch (e) {
            // Ignore signout errors
          }
        }
      } catch (e) {
        // If JSON parsing fails, that's OK - just means user is not logged in
      }
      // 401 is not an error - user is simply not authenticated
      return null
    }
    
    // 404 means user doesn't exist (shouldn't happen if OAuth worked)
    if (response.status === 404) {
      console.error('[AuthStore] User not found - OAuth sign-in may have failed')
      return null
    }
    
    // For other errors, log but don't throw
    console.warn('[AuthStore] Unexpected response status:', response.status)
    return null
  } catch (error) {
    console.error('Error fetching authenticated user:', error)
    return null
  }
}

export function canAccessScreen(role: UserRole, screenId: number): boolean {
  return roleScreenAccess[role]?.includes(screenId) || false
}
