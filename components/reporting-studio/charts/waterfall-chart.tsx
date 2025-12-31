'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { ChartConfig, ChartDataPoint } from '@/lib/reporting-studio/chart-types'

interface WaterfallChartProps {
  config: ChartConfig
  data: ChartDataPoint[]
}

export function WaterfallChart({ config, data }: WaterfallChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = config.width || 800
    const height = config.height || 600
    const margin = { top: 40, right: 30, bottom: 80, left: 80 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    if (!config.xAxis?.field || !config.series?.[0]?.field) {
      return
    }

    const xField = config.xAxis.field
    const valueField = config.series[0].field

    // Calculate cumulative values for waterfall
    let cumulative = 0
    const processedData = data.map((d, i) => {
      const value = Number(d[valueField]) || 0
      const start = cumulative
      cumulative += value
      return {
        label: String(d[xField]),
        value,
        start,
        end: cumulative,
        isTotal: i === data.length - 1, // Last item is usually total
      }
    })

    // Scales
    const xScale = d3.scaleBand()
      .domain(processedData.map(d => d.label))
      .range([0, innerWidth])
      .padding(0.2)

    const maxValue = Math.max(...processedData.map(d => Math.max(d.start, d.end)))
    const minValue = Math.min(...processedData.map(d => Math.min(d.start, d.end)))
    const yScale = d3.scaleLinear()
      .domain([minValue, maxValue])
      .range([innerHeight, 0])

    const positiveColor = config.positiveColor || '#10b981'
    const negativeColor = config.negativeColor || '#ef4444'
    const totalColor = config.totalColor || '#3b82f6'

    // Draw bars
    processedData.forEach((d, i) => {
      const barHeight = Math.abs(yScale(d.start) - yScale(d.end))
      const y = d.value >= 0 ? yScale(d.end) : yScale(d.start)

      const color = d.isTotal ? totalColor : (d.value >= 0 ? positiveColor : negativeColor)

      // Bar
      g.append('rect')
        .attr('x', xScale(d.label)!)
        .attr('y', y)
        .attr('width', xScale.bandwidth())
        .attr('height', barHeight)
        .attr('fill', color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)

      // Connection line (except for first bar)
      if (i > 0) {
        const prevX = (xScale(processedData[i - 1].label) || 0) + xScale.bandwidth()
        const currX = xScale(d.label) || 0

        g.append('line')
          .attr('x1', prevX)
          .attr('x2', currX)
          .attr('y1', yScale(processedData[i - 1].end))
          .attr('y2', yScale(d.start))
          .attr('stroke', '#94a3b8')
          .attr('stroke-width', 2)
      }

      // Value label
      g.append('text')
        .attr('x', (xScale(d.label) || 0) + xScale.bandwidth() / 2)
        .attr('y', y + barHeight / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#fff')
        .text(d.value >= 0 ? `+${d.value.toLocaleString()}` : d.value.toLocaleString())
    })

    // Add axes
    const xAxis = d3.axisBottom(xScale)
    const yAxis = d3.axisLeft(yScale)

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')

    g.append('g').call(yAxis)

    // Add labels
    if (config.xAxis.label) {
      g.append('text')
        .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + 60})`)
        .style('text-anchor', 'middle')
        .text(config.xAxis.label)
    }

    if (config.yAxis?.label) {
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -50)
        .attr('x', -innerHeight / 2)
        .style('text-anchor', 'middle')
        .text(config.yAxis.label)
    }

  }, [config, data])

  return <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
}

