/**
 * Phase 4.2: RLS Rule Builder
 * 
 * Helper utilities for building RLS rule expressions
 */

import { RLSRuleExpression } from './rls-engine'

export class RLSRuleBuilder {
  private expressions: RLSRuleExpression[] = []

  /**
   * Add an equals condition
   */
  equals(field: string, value: any): this {
    this.expressions.push({
      operator: 'equals',
      field,
      value,
    })
    return this
  }

  /**
   * Add a not equals condition
   */
  notEquals(field: string, value: any): this {
    this.expressions.push({
      operator: 'not_equals',
      field,
      value,
    })
    return this
  }

  /**
   * Add an "in" condition
   */
  in(field: string, values: any[]): this {
    this.expressions.push({
      operator: 'in',
      field,
      value: values,
    })
    return this
  }

  /**
   * Add a "not in" condition
   */
  notIn(field: string, values: any[]): this {
    this.expressions.push({
      operator: 'not_in',
      field,
      value: values,
    })
    return this
  }

  /**
   * Add a contains condition
   */
  contains(field: string, value: string): this {
    this.expressions.push({
      operator: 'contains',
      field,
      value,
    })
    return this
  }

  /**
   * Add a greater than condition
   */
  greaterThan(field: string, value: number): this {
    this.expressions.push({
      operator: 'greater_than',
      field,
      value,
    })
    return this
  }

  /**
   * Add a less than condition
   */
  lessThan(field: string, value: number): this {
    this.expressions.push({
      operator: 'less_than',
      field,
      value,
    })
    return this
  }

  /**
   * Add an is null condition
   */
  isNull(field: string): this {
    this.expressions.push({
      operator: 'is_null',
      field,
    })
    return this
  }

  /**
   * Add an is not null condition
   */
  isNotNull(field: string): this {
    this.expressions.push({
      operator: 'is_not_null',
      field,
    })
    return this
  }

  /**
   * Combine expressions with AND
   */
  and(...builders: RLSRuleBuilder[]): this {
    const children = builders.flatMap(b => b.expressions)
    this.expressions.push({
      operator: 'and',
      field: '',
      children,
    })
    return this
  }

  /**
   * Combine expressions with OR
   */
  or(...builders: RLSRuleBuilder[]): this {
    const children = builders.flatMap(b => b.expressions)
    this.expressions.push({
      operator: 'or',
      field: '',
      children,
    })
    return this
  }

  /**
   * Negate an expression
   */
  not(builder: RLSRuleBuilder): this {
    this.expressions.push({
      operator: 'not',
      field: '',
      children: builder.expressions,
    })
    return this
  }

  /**
   * Add a custom function expression
   */
  custom(field: string, customFunction: string): this {
    this.expressions.push({
      operator: 'custom',
      field,
      customFunction,
    })
    return this
  }

  /**
   * Build the final expression
   */
  build(): RLSRuleExpression {
    if (this.expressions.length === 0) {
      throw new Error('Cannot build empty rule')
    }

    if (this.expressions.length === 1) {
      return this.expressions[0]
    }

    // Combine multiple expressions with AND by default
    return {
      operator: 'and',
      field: '',
      children: this.expressions,
    }
  }

  /**
   * Build with OR combination
   */
  buildOr(): RLSRuleExpression {
    if (this.expressions.length === 0) {
      throw new Error('Cannot build empty rule')
    }

    if (this.expressions.length === 1) {
      return this.expressions[0]
    }

    return {
      operator: 'or',
      field: '',
      children: this.expressions,
    }
  }
}

/**
 * Helper function to create a new rule builder
 */
export function createRLSRule(): RLSRuleBuilder {
  return new RLSRuleBuilder()
}

/**
 * Common rule patterns
 */
export const RLSRulePatterns = {
  /**
   * Users can only see their own records
   */
  ownRecords(field: string = 'userId'): RLSRuleExpression {
    return createRLSRule()
      .equals(field, '${userId}')
      .build()
  },

  /**
   * Users can see records from their org unit
   */
  orgUnitRecords(field: string = 'orgUnitId'): RLSRuleExpression {
    return createRLSRule()
      .equals(field, '${orgUnitId}')
      .build()
  },

  /**
   * Users can see records they manage
   */
  managedRecords(field: string = 'managerId'): RLSRuleExpression {
    return createRLSRule()
      .equals(field, '${userId}')
      .build()
  },

  /**
   * Users can see records they created
   */
  createdRecords(field: string = 'createdById'): RLSRuleExpression {
    return createRLSRule()
      .equals(field, '${userId}')
      .build()
  },

  /**
   * Users can see records in their org unit or records they manage
   */
  orgUnitOrManaged(
    orgUnitField: string = 'orgUnitId',
    managerField: string = 'managerId'
  ): RLSRuleExpression {
    const orgUnitBuilder = createRLSRule()
      .equals(orgUnitField, '${orgUnitId}')

    const managedBuilder = createRLSRule()
      .equals(managerField, '${userId}')

    return createRLSRule()
      .or(orgUnitBuilder, managedBuilder)
      .buildOr()
  },

  /**
   * Users can see active records only
   */
  activeRecordsOnly(field: string = 'status', activeValue: any = 'ACTIVE'): RLSRuleExpression {
    return createRLSRule()
      .equals(field, activeValue)
      .build()
  },
}

