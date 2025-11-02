import { prisma } from '@/lib/prisma'

export type NotificationType = 
  | 'MENTION'
  | 'ASSIGNMENT'
  | 'APPROVAL'
  | 'DEADLINE'
  | 'STATUS_CHANGE'
  | 'COMMENT'
  | 'MESSAGE'
  | 'TASK_COMPLETED'
  | 'PROJECT_UPDATE'
  | 'OVERDUE_TASK'

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

interface CreateNotificationParams {
  userId: string
  tenantId: string
  type: NotificationType
  title: string
  message: string
  entityType?: string
  entityId?: string
  priority?: NotificationPriority
}

/**
 * Create a new notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        tenantId: params.tenantId,
        type: params.type,
        title: params.title,
        message: params.message,
        entityType: params.entityType,
        entityId: params.entityId,
        priority: params.priority || 'MEDIUM',
      },
    })
    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

/**
 * Create multiple notifications at once (bulk create)
 */
export async function createManyNotifications(notifications: CreateNotificationParams[]) {
  try {
    const created = await prisma.notification.createMany({
      data: notifications.map(n => ({
        userId: n.userId,
        tenantId: n.tenantId,
        type: n.type,
        title: n.title,
        message: n.message,
        entityType: n.entityType,
        entityId: n.entityId,
        priority: n.priority || 'MEDIUM',
      })),
    })
    return created
  } catch (error) {
    console.error('Error creating notifications:', error)
    return null
  }
}

/**
 * Notify user when assigned to a task
 */
export async function notifyTaskAssignment(params: {
  userId: string
  tenantId: string
  taskId: string
  taskTitle: string
  assignedBy: string
}) {
  return createNotification({
    userId: params.userId,
    tenantId: params.tenantId,
    type: 'ASSIGNMENT',
    title: 'New task assigned',
    message: `You have been assigned to task "${params.taskTitle}"`,
    entityType: 'TASK',
    entityId: params.taskId,
    priority: 'MEDIUM',
  })
}

/**
 * Notify user when mentioned in a comment
 */
export async function notifyMention(params: {
  userId: string
  tenantId: string
  mentionedBy: string
  mentionedByName: string
  entityType: string
  entityId: string
  entityTitle: string
}) {
  return createNotification({
    userId: params.userId,
    tenantId: params.tenantId,
    type: 'MENTION',
    title: `${params.mentionedByName} mentioned you`,
    message: `You were mentioned in a comment on ${params.entityType.toLowerCase()} "${params.entityTitle}"`,
    entityType: params.entityType,
    entityId: params.entityId,
    priority: 'HIGH',
  })
}

/**
 * Notify user when they need to approve something
 */
export async function notifyApprovalNeeded(params: {
  userId: string
  tenantId: string
  approvalType: string
  approvalTitle: string
  entityId: string
}) {
  return createNotification({
    userId: params.userId,
    tenantId: params.tenantId,
    type: 'APPROVAL',
    title: `${params.approvalType} requires approval`,
    message: `"${params.approvalTitle}" is awaiting your approval`,
    entityType: params.approvalType,
    entityId: params.entityId,
    priority: 'HIGH',
  })
}

/**
 * Notify user when task deadline is approaching
 */
export async function notifyDeadline(params: {
  userId: string
  tenantId: string
  taskId: string
  taskTitle: string
  dueDate: Date
}) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = params.dueDate.toDateString() === tomorrow.toDateString()

  return createNotification({
    userId: params.userId,
    tenantId: params.tenantId,
    type: 'DEADLINE',
    title: isTomorrow ? 'Task due tomorrow' : 'Task deadline approaching',
    message: `Task "${params.taskTitle}" is due ${isTomorrow ? 'tomorrow' : 'soon'}`,
    entityType: 'TASK',
    entityId: params.taskId,
    priority: 'MEDIUM',
  })
}

/**
 * Notify user when task is overdue
 */
export async function notifyOverdue(params: {
  userId: string
  tenantId: string
  taskId: string
  taskTitle: string
}) {
  return createNotification({
    userId: params.userId,
    tenantId: params.tenantId,
    type: 'OVERDUE_TASK',
    title: 'Task overdue',
    message: `Task "${params.taskTitle}" is now overdue`,
    entityType: 'TASK',
    entityId: params.taskId,
    priority: 'HIGH',
  })
}

/**
 * Notify user when task status changes
 */
export async function notifyStatusChange(params: {
  userId: string
  tenantId: string
  entityType: string
  entityId: string
  entityTitle: string
  oldStatus: string
  newStatus: string
}) {
  return createNotification({
    userId: params.userId,
    tenantId: params.tenantId,
    type: 'STATUS_CHANGE',
    title: `${params.entityType} status updated`,
    message: `"${params.entityTitle}" status changed from ${params.oldStatus} to ${params.newStatus}`,
    entityType: params.entityType,
    entityId: params.entityId,
    priority: 'LOW',
  })
}

/**
 * Notify user when someone comments on their task
 */
export async function notifyComment(params: {
  userId: string
  tenantId: string
  taskId: string
  taskTitle: string
  commenterName: string
}) {
  return createNotification({
    userId: params.userId,
    tenantId: params.tenantId,
    type: 'COMMENT',
    title: 'New comment on your task',
    message: `${params.commenterName} commented on "${params.taskTitle}"`,
    entityType: 'TASK',
    entityId: params.taskId,
    priority: 'LOW',
  })
}

/**
 * Notify team members when project is updated
 */
export async function notifyProjectUpdate(params: {
  userIds: string[]
  tenantId: string
  projectId: string
  projectName: string
  updateType: string
}) {
  const notifications = params.userIds.map(userId => ({
    userId,
    tenantId: params.tenantId,
    type: 'PROJECT_UPDATE' as NotificationType,
    title: 'Project updated',
    message: `"${params.projectName}" has been updated: ${params.updateType}`,
    entityType: 'PROJECT',
    entityId: params.projectId,
    priority: 'LOW' as NotificationPriority,
  }))

  return createManyNotifications(notifications)
}

