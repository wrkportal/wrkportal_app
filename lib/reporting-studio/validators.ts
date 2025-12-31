// Validation utilities for Reporting Studio

import { CreateDataSourceRequest, CreateDatasetRequest, CreateVisualizationRequest } from '@/types/reporting-studio'
import { REPORTING_STUDIO_CONFIG } from './constants'

/**
 * Validate data source creation request
 */
export function validateDataSourceRequest(data: CreateDataSourceRequest): { valid: boolean; error?: string } {
  if (!data.name || data.name.trim().length === 0) {
    return { valid: false, error: 'Name is required' }
  }

  if (!data.type) {
    return { valid: false, error: 'Type is required' }
  }

  if (!data.connectionConfig) {
    return { valid: false, error: 'Connection config is required' }
  }

  // Validate connection config based on type
  if (data.type === 'DATABASE') {
    const config = data.connectionConfig as any
    if (!config.host || !config.database || !config.username || !config.password) {
      return { valid: false, error: 'Database connection config is incomplete' }
    }
  } else if (data.type === 'API') {
    const config = data.connectionConfig as any
    if (!config.baseUrl) {
      return { valid: false, error: 'API base URL is required' }
    }
  }

  return { valid: true }
}

/**
 * Validate dataset creation request
 */
export function validateDatasetRequest(data: CreateDatasetRequest): { valid: boolean; error?: string } {
  if (!data.name || data.name.trim().length === 0) {
    return { valid: false, error: 'Name is required' }
  }

  if (!data.type) {
    return { valid: false, error: 'Type is required' }
  }

  // Validate based on type
  if (data.type === 'QUERY' && !data.dataSourceId && !data.query) {
    return { valid: false, error: 'Query type requires either dataSourceId or query' }
  }

  if (data.type === 'FILE' && !data.fileId) {
    return { valid: false, error: 'File type requires fileId' }
  }

  if (data.type === 'API' && !data.dataSourceId) {
    return { valid: false, error: 'API type requires dataSourceId' }
  }

  // Validate refresh schedule if provided
  if (data.refreshSchedule) {
    // TODO: Validate cron expression format
    // For now, just check it's not empty
    if (data.refreshSchedule.trim().length === 0) {
      return { valid: false, error: 'Refresh schedule cannot be empty' }
    }
  }

  return { valid: true }
}

/**
 * Validate visualization creation request
 */
export function validateVisualizationRequest(data: CreateVisualizationRequest): { valid: boolean; error?: string } {
  if (!data.name || data.name.trim().length === 0) {
    return { valid: false, error: 'Name is required' }
  }

  if (!data.type) {
    return { valid: false, error: 'Type is required' }
  }

  if (!data.datasetId) {
    return { valid: false, error: 'Dataset ID is required' }
  }

  if (!data.config) {
    return { valid: false, error: 'Config is required' }
  }

  // Validate chart dimensions if provided
  if (data.width !== undefined && data.width < 100) {
    return { valid: false, error: 'Width must be at least 100 pixels' }
  }

  if (data.height !== undefined && data.height < 100) {
    return { valid: false, error: 'Height must be at least 100 pixels' }
  }

  return { valid: true }
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > REPORTING_STUDIO_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${REPORTING_STUDIO_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  // Check file type
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !REPORTING_STUDIO_CONFIG.ALLOWED_FILE_TYPES.includes(extension)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${REPORTING_STUDIO_CONFIG.ALLOWED_FILE_TYPES.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Validate cron expression (basic validation)
 */
export function validateCronExpression(cron: string): { valid: boolean; error?: string } {
  // Basic cron format validation (5 fields: minute hour day month weekday)
  const cronParts = cron.trim().split(/\s+/)

  if (cronParts.length !== 5) {
    return { valid: false, error: 'Cron expression must have 5 fields' }
  }

  // TODO: Add more sophisticated validation
  // For now, just check basic structure

  return { valid: true }
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page?: number, pageSize?: number): {
  valid: boolean
  error?: string
  page: number
  pageSize: number
} {
  const validPage = Math.max(1, page || 1)
  const validPageSize = Math.min(
    Math.max(1, pageSize || REPORTING_STUDIO_CONFIG.DEFAULT_PAGE_SIZE),
    REPORTING_STUDIO_CONFIG.MAX_PAGE_SIZE
  )

  return {
    valid: true,
    page: validPage,
    pageSize: validPageSize,
  }
}

