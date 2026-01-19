/**
 * AI Revenue Forecasting Service
 * ML-powered revenue forecasting with confidence intervals
 */

import { extractStructuredData } from '../../ai-service'
import { SALES_PROMPTS } from '../../prompts-sales'

export interface RevenueForecast {
  period: string // e.g., "2024-Q1", "2024-01"
  forecastType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  bestCase: number
  likely: number
  worstCase: number
  confidence: number // 0-100
  reasoning: string
  factors: {
    factor: string
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
    description: string
  }[]
}

export interface HistoricalData {
  period: string
  actualRevenue: number
  wonDeals: number
  pipelineValue: number
}

interface ForecastInput {
  historicalData: HistoricalData[]
  currentPipeline: {
    totalValue: number
    weightedValue: number
    byStage: {
      stage: string
      count: number
      value: number
      weightedValue: number
    }[]
  }
  periods: string[] // e.g., ["2024-01", "2024-02", "2024-03"]
  forecastType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
}

export async function forecastRevenue(input: ForecastInput): Promise<RevenueForecast[]> {
  const forecastSummary = `
Revenue Forecasting Analysis:

**Historical Performance:**
${input.historicalData.map(h => `- ${h.period}: $${h.actualRevenue.toLocaleString()} (${h.wonDeals} deals, Pipeline: $${h.pipelineValue.toLocaleString()})`).join('\n')}

**Current Pipeline:**
- Total Pipeline Value: $${input.currentPipeline.totalValue.toLocaleString()}
- Weighted Pipeline Value: $${input.currentPipeline.weightedValue.toLocaleString()}
- Pipeline by Stage:
${input.currentPipeline.byStage.map(s => `  - ${s.stage}: ${s.count} deals, $${s.value.toLocaleString()} (weighted: $${s.weightedValue.toLocaleString()})`).join('\n')}

**Forecast Periods:** ${input.periods.join(', ')}
**Forecast Type:** ${input.forecastType}

Analyze historical patterns, current pipeline, and typical conversion rates to forecast revenue for each period.
`

  const schema = `{
  "forecasts": [{
    "period": "string",
    "bestCase": number,
    "likely": number,
    "worstCase": number,
    "confidence": number (0-100),
    "reasoning": "string",
    "factors": [{
      "factor": "string",
      "impact": "POSITIVE | NEGATIVE | NEUTRAL",
      "description": "string"
    }]
  }]
}`

  try {
    const result = await extractStructuredData<any>(forecastSummary, schema, SALES_PROMPTS.REVENUE_FORECASTER)

    return result.forecasts.map((f: any) => ({
      period: f.period,
      forecastType: input.forecastType,
      bestCase: Math.round(f.bestCase),
      likely: Math.round(f.likely),
      worstCase: Math.round(f.worstCase),
      confidence: Math.round(f.confidence),
      reasoning: f.reasoning,
      factors: f.factors || [],
    }))
  } catch (error) {
    console.error('Error forecasting revenue:', error)
    throw new Error('Failed to forecast revenue')
  }
}

