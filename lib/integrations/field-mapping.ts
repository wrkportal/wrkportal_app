/**
 * Field Mapping Service
 * 
 * Manages field mappings between external systems and our internal data models
 */

import { prisma } from '@/lib/prisma'

export interface FieldMapping {
  id: string
  integrationId: string
  sourceField: string
  targetField: string
  mappingType: 'DIRECT' | 'TRANSFORM' | 'LOOKUP' | 'CONCATENATE' | 'CALCULATED' | 'DEFAULT'
  transformation?: any
  isActive: boolean
}

export interface TransformationRule {
  type: 'format' | 'case' | 'split' | 'join' | 'lookup' | 'formula' | 'default'
  config: any
}

/**
 * Get all field mappings for an integration
 */
export async function getFieldMappings(integrationId: string, tenantId: string): Promise<FieldMapping[]> {
  const mappings = await prisma.integrationFieldMapping.findMany({
    where: {
      integrationId,
      tenantId,
    },
    orderBy: {
      targetField: 'asc',
    },
  })

  return mappings.map((m: any) => ({
    id: m.id,
    integrationId: m.integrationId,
    sourceField: m.sourceField,
    targetField: m.targetField,
    mappingType: m.mappingType as any,
    transformation: m.transformation as any,
    isActive: m.isActive,
  }))
}

/**
 * Create or update a field mapping
 */
export async function upsertFieldMapping(
  integrationId: string,
  tenantId: string,
  sourceField: string,
  targetField: string,
  mappingType: FieldMapping['mappingType'],
  transformation?: TransformationRule,
  isActive: boolean = true
): Promise<FieldMapping> {
  const existing = await prisma.integrationFieldMapping.findFirst({
    where: {
      integrationId,
      tenantId,
      sourceField,
      targetField,
    },
  })

  const mapping = existing
    ? await prisma.integrationFieldMapping.update({
        where: { id: existing.id },
        data: {
          mappingType: mappingType as any,
          transformation: transformation as any,
          isActive,
          updatedAt: new Date(),
        },
      })
    : await prisma.integrationFieldMapping.create({
        data: {
          integrationId,
          tenantId,
          sourceField,
          targetField,
          mappingType: mappingType as any,
          transformation: transformation as any,
          isActive,
        },
      })

  return {
    id: mapping.id,
    integrationId: mapping.integrationId,
    sourceField: mapping.sourceField,
    targetField: mapping.targetField,
    mappingType: mapping.mappingType as any,
    transformation: mapping.transformation as any,
    isActive: mapping.isActive,
  }
}

/**
 * Delete a field mapping
 */
export async function deleteFieldMapping(mappingId: string, tenantId: string): Promise<void> {
  await prisma.integrationFieldMapping.deleteMany({
    where: {
      id: mappingId,
      tenantId,
    },
  })
}

/**
 * Apply field mappings to transform data from external system to internal format
 */
export async function applyFieldMappings(
  integrationId: string,
  tenantId: string,
  externalData: Record<string, any>,
  direction: 'FROM_EXTERNAL' | 'TO_EXTERNAL'
): Promise<Record<string, any>> {
  const mappings = await getFieldMappings(integrationId, tenantId)
  const activeMappings = mappings.filter(m => m.isActive)

  const result: Record<string, any> = {}

  if (direction === 'FROM_EXTERNAL') {
    // Map from external system to our system
    for (const mapping of activeMappings) {
      const sourceValue = externalData[mapping.sourceField]
      
      if (sourceValue === undefined || sourceValue === null) {
        continue
      }

      result[mapping.targetField] = applyTransformation(
        sourceValue,
        mapping.mappingType,
        mapping.transformation,
        externalData
      )
    }
  } else {
    // Map from our system to external system (reverse mapping)
    for (const mapping of activeMappings) {
      const sourceValue = externalData[mapping.targetField]
      
      if (sourceValue === undefined || sourceValue === null) {
        continue
      }

      result[mapping.sourceField] = applyTransformation(
        sourceValue,
        mapping.mappingType,
        mapping.transformation,
        externalData,
        true // reverse
      )
    }
  }

  return result
}

/**
 * Apply transformation to a field value
 */
function applyTransformation(
  value: any,
  mappingType: FieldMapping['mappingType'],
  transformation: TransformationRule | undefined,
  allData: Record<string, any>,
  reverse: boolean = false
): any {
  if (!transformation && mappingType === 'DIRECT') {
    return value
  }

  switch (mappingType) {
    case 'DIRECT':
      return value

    case 'TRANSFORM':
      if (!transformation) return value
      
      switch (transformation.type) {
        case 'format':
          // Format transformation (e.g., date format, number format)
          if (transformation.config.format === 'date') {
            return new Date(value).toISOString()
          }
          if (transformation.config.format === 'uppercase') {
            return String(value).toUpperCase()
          }
          if (transformation.config.format === 'lowercase') {
            return String(value).toLowerCase()
          }
          return value

        case 'case':
          // Case transformation
          if (transformation.config.case === 'upper') {
            return String(value).toUpperCase()
          }
          if (transformation.config.case === 'lower') {
            return String(value).toLowerCase()
          }
          if (transformation.config.case === 'title') {
            return String(value).replace(/\w\S*/g, (txt) => 
              txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            )
          }
          return value

        default:
          return value
      }

    case 'CONCATENATE':
      if (!transformation || !transformation.config.fields) return value
      
      // Concatenate multiple fields
      const fields = transformation.config.fields as string[]
      const separator = transformation.config.separator || ' '
      const values = fields.map(field => allData[field] || '').filter(v => v)
      return values.join(separator)

    case 'LOOKUP':
      if (!transformation || !transformation.config.lookupTable) return value
      
      // Lookup value from another source
      // This would need to be implemented based on your lookup requirements
      return value

    case 'CALCULATED':
      if (!transformation || !transformation.config.formula) return value
      
      // Calculate value using formula
      // Simple formula evaluation (in production, use a proper formula parser)
      try {
        const formula = transformation.config.formula as string
        // Replace field references with actual values
        let evaluated = formula
        for (const [key, val] of Object.entries(allData)) {
          evaluated = evaluated.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val || 0))
        }
        // Evaluate (in production, use a safe evaluator)
        return eval(evaluated) // eslint-disable-line no-eval
      } catch {
        return value
      }

    case 'DEFAULT':
      if (value === undefined || value === null || value === '') {
        return transformation?.config?.defaultValue || ''
      }
      return value

    default:
      return value
  }
}

/**
 * Get available fields for a given integration type
 */
export function getAvailableFields(integrationType: string, direction: 'FROM_EXTERNAL' | 'TO_EXTERNAL'): string[] {
  // Define available fields based on integration type
  const fieldMap: Record<string, Record<string, string[]>> = {
    salesforce: {
      FROM_EXTERNAL: ['Id', 'FirstName', 'LastName', 'Email', 'Company', 'Phone', 'Title', 'Industry', 'LeadSource', 'Status'],
      TO_EXTERNAL: ['id', 'firstName', 'lastName', 'email', 'company', 'phone', 'title', 'industry', 'leadSource', 'status'],
    },
    hubspot: {
      FROM_EXTERNAL: ['vid', 'firstname', 'lastname', 'email', 'company', 'phone', 'jobtitle'],
      TO_EXTERNAL: ['id', 'firstName', 'lastName', 'email', 'company', 'phone', 'title'],
    },
    dynamics: {
      FROM_EXTERNAL: ['leadid', 'firstname', 'lastname', 'emailaddress1', 'companyname', 'telephone1', 'jobtitle', 'leadsourcecode'],
      TO_EXTERNAL: ['id', 'firstName', 'lastName', 'email', 'company', 'phone', 'title', 'leadSource'],
    },
    'microsoft-dynamics': {
      FROM_EXTERNAL: ['leadid', 'firstname', 'lastname', 'emailaddress1', 'companyname', 'telephone1', 'jobtitle', 'leadsourcecode'],
      TO_EXTERNAL: ['id', 'firstName', 'lastName', 'email', 'company', 'phone', 'title', 'leadSource'],
    },
  }

  const provider = integrationType.toLowerCase()
  return fieldMap[provider]?.[direction] || []
}

/**
 * Get target fields for our internal models
 */
export function getTargetFields(entityType: 'lead' | 'contact' | 'opportunity' | 'account'): string[] {
  const fieldMap: Record<string, string[]> = {
    lead: ['firstName', 'lastName', 'email', 'company', 'phone', 'title', 'industry', 'leadSource', 'status'],
    contact: ['firstName', 'lastName', 'email', 'phone', 'mobile', 'title', 'company'],
    opportunity: ['name', 'amount', 'stage', 'closeDate', 'probability', 'source'],
    account: ['name', 'industry', 'website', 'phone', 'address'],
  }

  return fieldMap[entityType] || []
}

