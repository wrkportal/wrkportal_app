import { FilterCondition } from '@/components/reporting-engine/filter-builder'

/**
 * Apply filters to data
 */
export function applyFilters(data: any[], filters: FilterCondition[]): any[] {
  if (!filters || filters.length === 0) {
    return data
  }

  if (!data || data.length === 0) {
    return data
  }

  // Get all available column names from the first row
  const availableColumns = Object.keys(data[0] || {})
  
  return data.filter(row => {
    // All filters are combined with AND logic
    return filters.every(filter => {
      // Try exact match first, then case-insensitive match
      let fieldValue = row[filter.field]
      let actualFieldName = filter.field
      
      // If not found, try case-insensitive match
      if (fieldValue === undefined) {
        const fieldKey = availableColumns.find(
          key => key.toLowerCase().trim() === filter.field.toLowerCase().trim()
        )
        if (fieldKey) {
          fieldValue = row[fieldKey]
          actualFieldName = fieldKey
        } else {
          // Field not found at all
          console.warn(`Filter field "${filter.field}" not found in data. Available columns:`, availableColumns)
          return false
        }
      }
      
      // Handle null checks
      if (filter.operator === 'is_null') {
        return fieldValue === null || fieldValue === undefined || fieldValue === ''
      }
      
      if (filter.operator === 'is_not_null') {
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== ''
      }

      // Skip if field value is null/undefined for other operators
      if (fieldValue === null || fieldValue === undefined) {
        return false
      }

      const filterValue = filter.value
      const fieldValueStr = String(fieldValue).trim().toLowerCase()
      
      switch (filter.operator) {
        case 'equals':
          return fieldValueStr === String(filterValue).trim().toLowerCase()
        
        case 'not_equals':
          return fieldValueStr !== String(filterValue).trim().toLowerCase()
        
        case 'greater_than':
          return Number(fieldValue) > Number(filterValue)
        
        case 'less_than':
          return Number(fieldValue) < Number(filterValue)
        
        case 'greater_equal':
          return Number(fieldValue) >= Number(filterValue)
        
        case 'less_equal':
          return Number(fieldValue) <= Number(filterValue)
        
        case 'contains':
          return fieldValueStr.includes(String(filterValue).trim().toLowerCase())
        
        case 'starts_with':
          return fieldValueStr.startsWith(String(filterValue).trim().toLowerCase())
        
        case 'ends_with':
          return fieldValueStr.endsWith(String(filterValue).trim().toLowerCase())
        
        case 'in':
          if (!Array.isArray(filterValue) || filterValue.length === 0) return false
          // Check if field value matches any of the filter values (case-insensitive, trimmed)
          const filterValuesLower = filterValue.map(v => String(v).trim().toLowerCase())
          const matches = filterValuesLower.includes(fieldValueStr)
          
          // Debug logging removed - uncomment if needed for debugging
          // if (process.env.NODE_ENV === 'development' && !matches) {
          //   console.log(`Filter "in" check failed:`, {
          //     field: actualFieldName,
          //     fieldValue: fieldValue,
          //     fieldValueStr,
          //     filterValues: filterValue,
          //     filterValuesLower,
          //     matches,
          //   })
          // }
          
          return matches
        
        case 'not_in':
          if (!Array.isArray(filterValue) || filterValue.length === 0) return true
          const notInValuesLower = filterValue.map(v => String(v).trim().toLowerCase())
          return !notInValuesLower.includes(fieldValueStr)
        
        default:
          return true
      }
    })
  })
}

/**
 * Merge dashboard filters with chart filters
 * Dashboard filters override chart filters for the same field
 */
export function mergeFilters(
  chartFilters: FilterCondition[],
  dashboardFilters: FilterCondition[]
): FilterCondition[] {
  if (!dashboardFilters || dashboardFilters.length === 0) {
    return chartFilters || []
  }

  if (!chartFilters || chartFilters.length === 0) {
    return dashboardFilters
  }

  // Create a map of dashboard filters by field
  const dashboardFilterMap = new Map<string, FilterCondition>()
  dashboardFilters.forEach(filter => {
    dashboardFilterMap.set(filter.field, filter)
  })

  // Start with chart filters, but replace any that are overridden by dashboard filters
  const merged: FilterCondition[] = []
  const processedFields = new Set<string>()

  // Add dashboard filters first (they take precedence)
  dashboardFilters.forEach(filter => {
    merged.push(filter)
    processedFields.add(filter.field)
  })

  // Add chart filters that aren't overridden
  chartFilters.forEach(filter => {
    if (!processedFields.has(filter.field)) {
      merged.push(filter)
      processedFields.add(filter.field)
    }
  })

  return merged
}
