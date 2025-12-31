/**
 * Example Plugin: Financial Metrics
 *
 * This is an example plugin showing how to create custom functions
 * and syntax for the reporting engine.
 */

import { Plugin, SyntaxRule } from '@/lib/reporting-engine/plugin-system'

const plugin: Plugin = {
  name: 'financial-metrics',
  version: '1.0.0',
  description: 'Financial calculation functions and shortcuts',
  enabled: true,

  functions: [
    {
      name: 'PROFIT_MARGIN',
      syntax: 'PROFIT_MARGIN(revenue, cost)',
      description:
        'Calculate profit margin percentage: ((revenue - cost) / revenue) * 100',
      execute: (revenue: number, cost: number) => {
        if (revenue === 0) return 0
        return ((revenue - cost) / revenue) * 100
      },
      returnType: 'number',
      parameters: [
        {
          name: 'revenue',
          type: 'number',
          required: true,
          description: 'Total revenue',
        },
        {
          name: 'cost',
          type: 'number',
          required: true,
          description: 'Total cost',
        },
      ],
      category: 'financial',
      examples: [
        'PROFIT_MARGIN(1000, 700) → 30',
        'PROFIT_MARGIN(revenue_column, cost_column)',
      ],
    },
    {
      name: 'ROI',
      syntax: 'ROI(investment, return)',
      description:
        'Calculate Return on Investment: ((return - investment) / investment) * 100',
      execute: (investment: number, returnValue: number) => {
        if (investment === 0) return 0
        return ((returnValue - investment) / investment) * 100
      },
      returnType: 'number',
      parameters: [
        {
          name: 'investment',
          type: 'number',
          required: true,
          description: 'Initial investment',
        },
        {
          name: 'return',
          type: 'number',
          required: true,
          description: 'Return value',
        },
      ],
      category: 'financial',
      examples: [
        'ROI(1000, 1500) → 50',
        'ROI(initial_investment, final_value)',
      ],
    },
    {
      name: 'GROWTH_RATE',
      syntax: 'GROWTH_RATE(oldValue, newValue)',
      description:
        'Calculate growth rate percentage: ((newValue - oldValue) / oldValue) * 100',
      execute: (oldValue: number, newValue: number) => {
        if (oldValue === 0) return 0
        return ((newValue - oldValue) / oldValue) * 100
      },
      returnType: 'number',
      parameters: [
        {
          name: 'oldValue',
          type: 'number',
          required: true,
          description: 'Previous value',
        },
        {
          name: 'newValue',
          type: 'number',
          required: true,
          description: 'Current value',
        },
      ],
      category: 'financial',
      examples: [
        'GROWTH_RATE(100, 120) → 20',
        'GROWTH_RATE(last_month_revenue, this_month_revenue)',
      ],
    },
    {
      name: 'BREAK_EVEN',
      syntax: 'BREAK_EVEN(fixedCost, price, variableCost)',
      description:
        'Calculate break-even point: fixedCost / (price - variableCost)',
      execute: (fixedCost: number, price: number, variableCost: number) => {
        const margin = price - variableCost
        if (margin === 0) return Infinity
        return fixedCost / margin
      },
      returnType: 'number',
      parameters: [
        {
          name: 'fixedCost',
          type: 'number',
          required: true,
          description: 'Fixed costs',
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          description: 'Selling price',
        },
        {
          name: 'variableCost',
          type: 'number',
          required: true,
          description: 'Variable cost per unit',
        },
      ],
      category: 'financial',
      examples: [
        'BREAK_EVEN(10000, 100, 60) → 250',
        'BREAK_EVEN(fixed_costs, unit_price, unit_cost)',
      ],
    },
  ],

  syntax: [
    {
      name: 'profit_margin_shortcut',
      pattern: /MARGIN\(([^,]+),\s*([^)]+)\)/g,
      transform: 'PROFIT_MARGIN($1, $2)',
      description: 'Shortcut for profit margin calculation',
    },
    {
      name: 'roi_shortcut',
      pattern: /ROI_PERCENT\(([^,]+),\s*([^)]+)\)/g,
      transform: 'ROI($1, $2)',
      description: 'Shortcut for ROI calculation',
    },
  ],

  hooks: {
    beforeQuery: (query) => {
      // Example: Add default filters for financial queries
      // This is just an example - you can add custom logic here
      return query
    },
    afterQuery: (results) => {
      // Example: Format financial results
      // This is just an example - you can add custom logic here
      return results
    },
  },
}

export default plugin
