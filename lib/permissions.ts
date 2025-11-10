import { UserRole, WorkspaceType, GroupRole } from '@/types'

/**
 * Permission helper functions for workspace types
 * Handles both ORGANIZATION (enterprise) and GROUP (lightweight) workspaces
 */

// Permission actions
export type PermissionAction = 
  | 'READ' 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'APPROVE' 
  | 'EXPORT' 
  | 'CONFIGURE'

// Resources that can be accessed
export type Resource = 
  | 'projects'
  | 'tasks'
  | 'users'
  | 'teams'
  | 'portfolios'
  | 'programs'
  | 'reports'
  | 'settings'
  | 'risks'
  | 'issues'
  | 'changes'
  | 'resources'
  | 'gates'

/**
 * Get permissions based on workspace type and user role
 */
export function getPermissions(
  workspaceType: WorkspaceType,
  role?: UserRole,
  groupRole?: GroupRole
): Record<Resource, PermissionAction[]> {
  if (workspaceType === WorkspaceType.ORGANIZATION) {
    return getEnterprisePermissions(role || UserRole.TEAM_MEMBER)
  } else {
    return getGroupPermissions(groupRole || GroupRole.MEMBER)
  }
}

/**
 * Check if user has permission for a specific action on a resource
 */
export function hasPermission(
  workspaceType: WorkspaceType,
  resource: Resource,
  action: PermissionAction,
  role?: UserRole,
  groupRole?: GroupRole
): boolean {
  const permissions = getPermissions(workspaceType, role, groupRole)
  return permissions[resource]?.includes(action) || permissions['*' as Resource]?.includes(action)
}

/**
 * Enterprise (ORGANIZATION) permissions - Full role-based system
 */
function getEnterprisePermissions(role: UserRole): Record<Resource, PermissionAction[]> {
  const permissions: Record<string, PermissionAction[]> = {}

  switch (role) {
    case UserRole.PLATFORM_OWNER:
    case UserRole.TENANT_SUPER_ADMIN:
      // Full access to everything
      permissions['*'] = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT', 'CONFIGURE']
      break

    case UserRole.ORG_ADMIN:
      permissions.users = ['READ', 'CREATE', 'UPDATE', 'DELETE']
      permissions.teams = ['READ', 'CREATE', 'UPDATE', 'DELETE']
      permissions.projects = ['READ', 'CREATE', 'UPDATE']
      permissions.tasks = ['READ', 'CREATE', 'UPDATE']
      permissions.settings = ['READ', 'CONFIGURE']
      permissions.reports = ['READ', 'EXPORT']
      break

    case UserRole.PMO_LEAD:
      permissions.portfolios = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE']
      permissions.programs = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE']
      permissions.projects = ['READ', 'CREATE', 'UPDATE', 'APPROVE']
      permissions.tasks = ['READ', 'CREATE', 'UPDATE']
      permissions.reports = ['READ', 'CREATE', 'EXPORT']
      permissions.gates = ['READ', 'APPROVE']
      permissions.risks = ['READ', 'CREATE', 'UPDATE']
      permissions.issues = ['READ', 'CREATE', 'UPDATE']
      break

    case UserRole.PROJECT_MANAGER:
      permissions.projects = ['READ', 'CREATE', 'UPDATE']
      permissions.tasks = ['READ', 'CREATE', 'UPDATE', 'DELETE']
      permissions.risks = ['READ', 'CREATE', 'UPDATE', 'DELETE']
      permissions.issues = ['READ', 'CREATE', 'UPDATE', 'DELETE']
      permissions.changes = ['READ', 'CREATE', 'UPDATE']
      permissions.resources = ['READ']
      permissions.reports = ['READ', 'CREATE', 'EXPORT']
      permissions.teams = ['READ']
      break

    case UserRole.TEAM_MEMBER:
      permissions.projects = ['READ']
      permissions.tasks = ['READ', 'CREATE', 'UPDATE']
      permissions.risks = ['READ']
      permissions.issues = ['READ', 'CREATE']
      permissions.reports = ['READ']
      break

    case UserRole.EXECUTIVE:
      permissions.portfolios = ['READ']
      permissions.programs = ['READ']
      permissions.projects = ['READ']
      permissions.reports = ['READ', 'EXPORT']
      permissions.gates = ['READ', 'APPROVE']
      break

    case UserRole.RESOURCE_MANAGER:
      permissions.projects = ['READ']
      permissions.users = ['READ']
      permissions.teams = ['READ', 'UPDATE']
      permissions.resources = ['READ', 'CREATE', 'UPDATE', 'DELETE']
      permissions.reports = ['READ', 'EXPORT']
      break

    case UserRole.FINANCE_CONTROLLER:
      permissions.projects = ['READ']
      permissions.tasks = ['READ']
      permissions.reports = ['READ', 'EXPORT']
      permissions.resources = ['READ']
      break

    case UserRole.CLIENT_STAKEHOLDER:
      permissions.projects = ['READ']
      permissions.tasks = ['READ']
      permissions.reports = ['READ']
      permissions.gates = ['READ', 'APPROVE']
      break

    case UserRole.COMPLIANCE_AUDITOR:
      permissions.projects = ['READ']
      permissions.reports = ['READ', 'EXPORT']
      permissions.settings = ['READ']
      break

    case UserRole.INTEGRATION_ADMIN:
      permissions.settings = ['READ', 'CONFIGURE']
      permissions.reports = ['READ']
      break

    default:
      // Default to TEAM_MEMBER permissions
      permissions.projects = ['READ']
      permissions.tasks = ['READ', 'CREATE', 'UPDATE']
      break
  }

  return permissions as Record<Resource, PermissionAction[]>
}

/**
 * Group permissions - Simplified 4-role system
 */
function getGroupPermissions(role: GroupRole): Record<Resource, PermissionAction[]> {
  const permissions: Record<string, PermissionAction[]> = {}

  switch (role) {
    case GroupRole.OWNER:
      // Owner has full control
      permissions['*'] = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT', 'CONFIGURE']
      break

    case GroupRole.ADMIN:
      // Admin can manage most things except critical settings
      permissions.projects = ['READ', 'CREATE', 'UPDATE', 'DELETE']
      permissions.tasks = ['READ', 'CREATE', 'UPDATE', 'DELETE']
      permissions.users = ['READ', 'CREATE', 'DELETE']
      permissions.teams = ['READ', 'CREATE', 'UPDATE']
      permissions.reports = ['READ', 'CREATE', 'EXPORT']
      permissions.risks = ['READ', 'CREATE', 'UPDATE', 'DELETE']
      permissions.issues = ['READ', 'CREATE', 'UPDATE', 'DELETE']
      break

    case GroupRole.MEMBER:
      // Member can collaborate and contribute
      permissions.projects = ['READ', 'CREATE', 'UPDATE']
      permissions.tasks = ['READ', 'CREATE', 'UPDATE']
      permissions.users = ['READ']
      permissions.teams = ['READ']
      permissions.reports = ['READ', 'CREATE']
      permissions.risks = ['READ', 'CREATE', 'UPDATE']
      permissions.issues = ['READ', 'CREATE', 'UPDATE']
      break

    case GroupRole.GUEST:
      // Guest has read-only access
      permissions.projects = ['READ']
      permissions.tasks = ['READ']
      permissions.users = ['READ']
      permissions.teams = ['READ']
      permissions.reports = ['READ']
      permissions.risks = ['READ']
      permissions.issues = ['READ']
      break

    default:
      // Default to MEMBER permissions
      permissions.projects = ['READ', 'UPDATE']
      permissions.tasks = ['READ', 'CREATE', 'UPDATE']
      break
  }

  return permissions as Record<Resource, PermissionAction[]>
}

/**
 * Get available roles for a workspace type
 */
export function getAvailableRoles(workspaceType: WorkspaceType): Array<{ value: string; label: string; description: string }> {
  if (workspaceType === WorkspaceType.ORGANIZATION) {
    return [
      { value: UserRole.ORG_ADMIN, label: 'Organization Admin', description: 'Manage users, teams, and organization settings' },
      { value: UserRole.PMO_LEAD, label: 'PMO Lead', description: 'Oversee portfolios, programs, and project governance' },
      { value: UserRole.PROJECT_MANAGER, label: 'Project Manager', description: 'Manage projects, tasks, and team assignments' },
      { value: UserRole.TEAM_MEMBER, label: 'Team Member', description: 'Work on assigned tasks and projects' },
      { value: UserRole.EXECUTIVE, label: 'Executive', description: 'View dashboards and approve strategic decisions' },
      { value: UserRole.RESOURCE_MANAGER, label: 'Resource Manager', description: 'Manage resource allocation and capacity' },
      { value: UserRole.FINANCE_CONTROLLER, label: 'Finance Controller', description: 'Track budgets, costs, and financial reports' },
      { value: UserRole.CLIENT_STAKEHOLDER, label: 'Client/Stakeholder', description: 'View progress and provide approvals' },
      { value: UserRole.COMPLIANCE_AUDITOR, label: 'Compliance Auditor', description: 'Access audit logs and compliance reports' },
      { value: UserRole.INTEGRATION_ADMIN, label: 'Integration Admin', description: 'Configure SSO, APIs, and integrations' },
    ]
  } else {
    return [
      { value: GroupRole.OWNER, label: 'Owner', description: 'Full control over the group and all settings' },
      { value: GroupRole.ADMIN, label: 'Admin', description: 'Manage members and group content' },
      { value: GroupRole.MEMBER, label: 'Member', description: 'Collaborate on projects and tasks' },
      { value: GroupRole.GUEST, label: 'Guest', description: 'View-only access to group content' },
    ]
  }
}

/**
 * Check if a role can invite users
 */
export function canInviteUsers(
  workspaceType: WorkspaceType,
  role?: UserRole,
  groupRole?: GroupRole
): boolean {
  if (workspaceType === WorkspaceType.ORGANIZATION) {
    return [
      UserRole.PLATFORM_OWNER,
      UserRole.TENANT_SUPER_ADMIN,
      UserRole.ORG_ADMIN,
    ].includes(role || UserRole.TEAM_MEMBER)
  } else {
    return [
      GroupRole.OWNER,
      GroupRole.ADMIN,
    ].includes(groupRole || GroupRole.MEMBER)
  }
}

/**
 * Get the display name for a role
 */
export function getRoleDisplayName(
  workspaceType: WorkspaceType,
  role?: UserRole,
  groupRole?: GroupRole
): string {
  if (workspaceType === WorkspaceType.ORGANIZATION && role) {
    const roleMap: Record<UserRole, string> = {
      [UserRole.PLATFORM_OWNER]: 'Platform Owner',
      [UserRole.TENANT_SUPER_ADMIN]: 'Super Admin',
      [UserRole.ORG_ADMIN]: 'Organization Admin',
      [UserRole.PMO_LEAD]: 'PMO Lead',
      [UserRole.PROJECT_MANAGER]: 'Project Manager',
      [UserRole.TEAM_MEMBER]: 'Team Member',
      [UserRole.EXECUTIVE]: 'Executive',
      [UserRole.RESOURCE_MANAGER]: 'Resource Manager',
      [UserRole.FINANCE_CONTROLLER]: 'Finance Controller',
      [UserRole.CLIENT_STAKEHOLDER]: 'Client/Stakeholder',
      [UserRole.COMPLIANCE_AUDITOR]: 'Compliance Auditor',
      [UserRole.INTEGRATION_ADMIN]: 'Integration Admin',
    }
    return roleMap[role] || 'Team Member'
  } else if (workspaceType === WorkspaceType.GROUP && groupRole) {
    const groupRoleMap: Record<GroupRole, string> = {
      [GroupRole.OWNER]: 'Owner',
      [GroupRole.ADMIN]: 'Admin',
      [GroupRole.MEMBER]: 'Member',
      [GroupRole.GUEST]: 'Guest',
    }
    return groupRoleMap[groupRole] || 'Member'
  }
  return 'Member'
}

