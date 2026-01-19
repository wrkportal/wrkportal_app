# Developer Dashboard Guide

This document explains how each page in the Developer Dashboard works, their features, and how to integrate them with your backend APIs.

## Overview

The Developer Dashboard is a workspace-centric platform designed to be the single operational control room for developer teams throughout the software development lifecycle (SDLC). It provides:

- **Workspace Management**: Organize teams, projects, and environments
- **Sprint Planning**: Track sprints, user stories, and development work
- **Code Repository Management**: Monitor repositories, branches, and commits
- **Pull Request Workflow**: Manage code reviews and merges
- **Deployment Tracking**: Monitor deployments with activity timeline
- **Documentation**: Access technical docs and guides

---

## Page Structure

All pages follow a consistent structure:
- **Stats Cards**: Key metrics at the top
- **Tabs**: Different views/filters for the data
- **Data Tables**: Main content with search and actions
- **Create Dialogs**: Forms to add new items

---

## 1. Development Page (`/developer-dashboard/development`)

### Purpose
Manage workspaces, projects/services, and environments - the core organizational units of the platform.

### Features

#### Workspaces Tab
- **Create Workspace**: Create new organizational units for teams
- **View Workspaces**: List all workspaces with team, project count, and environment info
- **Actions**: View details, edit, configure, or archive workspaces

**Workspace Properties:**
- Name and description
- Team assignment
- Project count
- Environment list (dev, staging, prod)
- Status (active/archived)

#### Projects Tab
- **Create Project**: Add new services, libraries, or infrastructure components
- **View Projects**: List projects with repository links, environment status, and deployment info
- **Actions**: View repository, activity, or configure projects

**Project Properties:**
- Name and type (service/library/infrastructure)
- Repository URL
- Environment associations
- Health status (healthy/degraded/down)
- Last deployment timestamp

#### Environments Tab
- **Create Environment**: Configure new deployment environments
- **View Environments**: List environments with deployment counts and status
- **Actions**: View deployments or configure environments

**Environment Properties:**
- Name and type (dev/staging/prod)
- Associated workspace and project
- Deployment count
- Status (active/inactive)
- Last deployment timestamp

### API Integration Points

```typescript
// Fetch workspaces
GET /api/developer/workspaces

// Create workspace
POST /api/developer/workspaces
Body: { name, description, team }

// Fetch projects
GET /api/developer/projects?workspaceId={id}

// Create project
POST /api/developer/projects
Body: { name, workspaceId, type, repository }

// Fetch environments
GET /api/developer/environments?workspaceId={id}&projectId={id}

// Create environment
POST /api/developer/environments
Body: { name, workspaceId, projectId, type }
```

---

## 2. Sprints Page (`/developer-dashboard/sprints`)

### Purpose
Plan and track sprint progress, user stories, and development work.

### Features

#### Sprints Tab
- **Create Sprint**: Plan new sprints with goals, dates, and capacity
- **View Sprints**: Display sprint cards with progress, velocity, and story completion
- **Sprint Metrics**: Track velocity, capacity, completed stories, and progress percentage

**Sprint Properties:**
- Name and goal
- Start and end dates
- Status (planning/active/completed)
- Velocity and capacity
- Story count and completion

#### User Stories Tab
- **Create Story**: Add user stories to the backlog
- **View Stories**: List stories with status, priority, assignee, and story points
- **Filter by Status**: Backlog, todo, in-progress, review, done

**User Story Properties:**
- Title and description
- Sprint assignment
- Status (backlog/todo/in-progress/review/done)
- Priority (low/medium/high/critical)
- Assignee
- Story points (1, 2, 3, 5, 8, 13)

#### Planning Tab
- **Sprint Planning Tools**: Plan upcoming sprints, estimate capacity, and assign stories
- (Placeholder for future implementation)

### API Integration Points

```typescript
// Fetch sprints
GET /api/developer/sprints?workspaceId={id}&status={status}

// Create sprint
POST /api/developer/sprints
Body: { name, goal, workspaceId, startDate, endDate, capacity }

// Fetch user stories
GET /api/developer/user-stories?sprintId={id}

// Create user story
POST /api/developer/user-stories
Body: { title, description, sprintId, priority, storyPoints, assignee }
```

---

## 3. Repository Page (`/developer-dashboard/repository`)

### Purpose
Manage code repositories, track commits, and monitor branches.

### Features

#### Repositories Tab
- **Add Repository**: Connect new code repositories via URL
- **View Repositories**: List repositories with language, branch info, commit count, and contributors
- **Actions**: View repository details or configure settings

**Repository Properties:**
- Name and description
- Default branch
- Language
- Commit count
- Contributor count
- Size
- Visibility (public/private)
- Repository URL

#### Commits Tab
- **View Commits**: Chronological list of commits with author, branch, and change statistics
- **Commit Details**: Message, hash, files changed, additions, deletions

**Commit Properties:**
- Commit message
- Author
- Branch
- Timestamp
- Files changed count
- Additions and deletions
- Commit hash

#### Branches Tab
- **View Branches**: List all branches with status indicators
- **Branch Status**: Shows ahead/behind counts relative to default branch
- **Protected Branches**: Indicates which branches are protected

**Branch Properties:**
- Branch name
- Repository association
- Last commit timestamp
- Ahead/behind counts
- Protected status

### API Integration Points

```typescript
// Fetch repositories
GET /api/developer/repositories

// Add repository
POST /api/developer/repositories
Body: { url, name }

// Fetch commits
GET /api/developer/commits?repositoryId={id}&branch={branch}

// Fetch branches
GET /api/developer/branches?repositoryId={id}
```

---

## 4. Pull Requests Page (`/developer-dashboard/pull-requests`)

### Purpose
Review and manage pull requests, code reviews, and merge workflows.

### Features

#### Tabs
- **Open**: Pull requests awaiting review
- **Approved**: PRs ready to merge
- **Merged**: Completed PRs
- **All**: All pull requests

#### Pull Request Management
- **View PRs**: List PRs with status, reviewers, and change statistics
- **PR Details**: Title, description, branches, author, reviewers
- **Change Statistics**: Files changed, additions, deletions
- **Review Status**: Approvals, requested changes, comments count

**Pull Request Properties:**
- Title and description
- Author
- Source and target branches
- Status (OPEN/APPROVED/CHANGES_REQUESTED/MERGED)
- Reviewers list
- Approval count
- Requested changes count
- Comments count
- Files changed, additions, deletions
- Created, updated, and merged timestamps

### API Integration Points

```typescript
// Fetch pull requests
GET /api/developer/pull-requests?status={status}&repositoryId={id}

// Create pull request
POST /api/developer/pull-requests
Body: { title, description, sourceBranch, targetBranch, repositoryId }

// Review pull request
POST /api/developer/pull-requests/{id}/review
Body: { action: 'approve' | 'request_changes' | 'comment', comment? }

// Merge pull request
POST /api/developer/pull-requests/{id}/merge
```

---

## 5. Deployments Page (`/developer-dashboard/deployments`)

### Purpose
Track deployments across environments, manage rollbacks, and monitor the activity timeline.

### Features

#### Deployments Tab
- **View Deployments**: List all deployments with environment, version, status, and duration
- **Deployment Details**: Application, version, branch, build number, commit hash
- **Rollback**: Rollback capability for failed or problematic deployments
- **Status Tracking**: SUCCESS, FAILED, IN_PROGRESS, ROLLED_BACK

**Deployment Properties:**
- Environment (Production/Staging/Development)
- Application name
- Version
- Branch
- Status
- Deployed by (user)
- Deployment timestamp
- Duration
- Build number
- Commit hash
- Rollback availability

#### Activity Timeline Tab (Critical Feature)
- **Chronological Log**: Append-only timeline of all system events
- **Event Types**:
  - **Code Changes**: Commits and code modifications
  - **Pipeline Executions**: CI/CD pipeline runs
  - **Deployments**: Deployment events
  - **Config Changes**: Configuration updates
  - **Alerts**: System alerts
  - **Incidents**: Incident detection and resolution
  - **Manual Actions**: User-initiated actions (rollbacks, etc.)

**Timeline Event Properties:**
- Event type
- Timestamp (chronological order)
- Actor (user or system)
- Action description
- Target (application/service)
- Environment (if applicable)
- Status (if applicable)
- Metadata (JSON object with event-specific data)

**Use Cases:**
- **Incident Investigation**: Trace events leading to an incident
- **Auditing**: Complete audit trail of all changes
- **Root Cause Analysis**: Understand what happened before a failure
- **Compliance**: Meet compliance requirements with full change history

#### Environments Tab
- **Environment Management**: Configure and manage deployment environments
- (Placeholder for future implementation)

### API Integration Points

```typescript
// Fetch deployments
GET /api/developer/deployments?environment={env}&application={app}&status={status}

// Create deployment
POST /api/developer/deployments
Body: { environment, application, version, branch, buildNumber, commitHash }

// Rollback deployment
POST /api/developer/deployments/{id}/rollback

// Fetch activity timeline
GET /api/developer/timeline?startDate={date}&endDate={date}&type={type}&target={target}

// Add timeline event (typically done by system/webhooks)
POST /api/developer/timeline/events
Body: { type, actor, action, description, target, environment?, status?, metadata? }
```

---

## 6. Documentation Page (`/developer-dashboard/documentation`)

### Purpose
Access and manage developer documentation, API references, and technical guides.

### Features

#### Tabs
- **All**: All documentation
- **API**: API reference documentation
- **Guides**: How-to guides
- **Reference**: Reference documentation
- **Tutorials**: Step-by-step tutorials
- **Architecture**: System architecture docs

#### Documentation Management
- **Create Doc**: Add new documentation pages
- **View Docs**: List documentation with category, author, views, and tags
- **Search**: Search by title, description, or tags
- **Actions**: View, edit, download, or delete documentation

**Documentation Properties:**
- Title and description
- Category (api/guide/reference/tutorial/architecture)
- Author
- Updated timestamp
- View count
- Tags array
- URL (optional link to external doc)

### API Integration Points

```typescript
// Fetch documentation
GET /api/developer/documentation?category={category}&search={query}

// Create documentation
POST /api/developer/documentation
Body: { title, description, category, tags, url? }

// Update documentation
PUT /api/developer/documentation/{id}
Body: { title, description, category, tags, url? }

// Delete documentation
DELETE /api/developer/documentation/{id}
```

---

## Common Patterns

### Empty States
All pages show appropriate empty states when no data is available, with clear calls-to-action to create the first item.

### Loading States
All pages handle loading states while fetching data from APIs.

### Error Handling
All API calls include error handling with console logging. In production, you should add user-facing error messages.

### Search Functionality
Most pages include search functionality to filter data by name, description, or other relevant fields.

### Form Validation
Create dialogs include form validation (e.g., required name field) before submission.

---

## Integration Checklist

To integrate the Developer Dashboard with your backend:

1. **Create API Endpoints**: Implement all API endpoints listed above
2. **Replace Mock Data**: Update `fetchData` functions in each page to call your APIs
3. **Handle Authentication**: Ensure API calls include authentication tokens
4. **Error Handling**: Add user-facing error messages and retry logic
5. **Real-time Updates**: Consider adding WebSocket support for live updates
6. **Pagination**: Add pagination for large datasets
7. **Filtering**: Implement server-side filtering and sorting
8. **Activity Timeline**: Set up webhooks/events to populate the timeline automatically

---

## Activity Timeline Implementation

The Activity Timeline is a critical feature that should be populated automatically:

1. **Code Changes**: Hook into your Git provider's webhooks
2. **Pipeline Executions**: Integrate with your CI/CD system (Jenkins, GitHub Actions, etc.)
3. **Deployments**: Log events when deployments start/complete/fail
4. **Config Changes**: Track configuration file changes
5. **Alerts/Incidents**: Integrate with monitoring systems
6. **Manual Actions**: Log user actions (rollbacks, manual deployments, etc.)

The timeline should be:
- **Chronological**: Events sorted by timestamp (newest first in UI)
- **Append-only**: Events cannot be deleted or modified
- **Comprehensive**: All significant system changes should be logged
- **Searchable**: Support filtering by type, target, environment, date range

---

## Next Steps

1. Review each page's functionality and requirements
2. Design your database schema to support all entities
3. Implement API endpoints following the patterns above
4. Replace mock data with real API calls
5. Add authentication and authorization
6. Implement the Activity Timeline webhook system
7. Add real-time updates where needed
8. Test all workflows end-to-end

---

## Support

For questions or issues with the Developer Dashboard, refer to the main project documentation or contact the development team.
