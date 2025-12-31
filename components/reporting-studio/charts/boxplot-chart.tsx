'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { ChartConfig, ChartDataPoint, DEFAULT_COLORS } from '@/lib/reporting-studio/chart-types'

interface BoxplotChartProps {
  config: ChartConfig
  data: ChartDataPoint[]
}

export function BoxplotChart({ config, data }: BoxplotChartProps) {
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

    // Group data by x category
    const grouped = d3.group(data, d => String(d[xField]))
    
    // Calculate box plot statistics for each group
    const boxPlotData = Array.from(grouped, ([category, values]) => {
      const numbers = values.map(v => Number(v[valueField])).filter(n => !isNaN(n)).sort(d3.ascending)
      const q1 = d3.quantile(numbers, 0.25) || 0
      const median = d3.quantile(numbers, 0.5) || 0
      const q3 = d3.quantile(numbers, 0.75) || 0
      const iqr = q3 - q1
      const min = Math.max(d3.min(numbers) || 0, q1 - 1.5 * iqr)
      const max = Math.min(d3.max(numbers) || 0, q3 + 1.5 * iqr)
      const mean = d3.mean(numbers) || 0
      const outliers = numbers.filter(n => n < min || n > max)

      return {
        category,
        q1,
        median,
        q3,
        min,
        max,
        mean,
        outliers,
      }
    })

    // Scales
    const xScale = d3.scaleBand()
      .domain(boxPlotData.map(d => d.category))
      .range([0, innerWidth])
      .padding(0.2)

    const allValues = boxPlotData.flatMap(d => [d.min, d.max])
    const yScale = d3.scaleLinear()
      .domain([d3.min(allValues) || 0, d3.max(allValues) || 100])
      .range([innerHeight, 0])

    const color = DEFAULT_COLORS[0]

    // Draw box plots
    boxPlotData.forEach(d => {
      const x = (xScale(d.category) || 0) + xScale.bandwidth() / 2

      // Whiskers
      g.append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', yScale(d.min))
        .attr('y2', yScale(d.max))
        .attr('stroke', color)
        .attr('stroke-width', 2)

      // Box
      const boxHeight = yScale(d.q1) - yScale(d.q3)
      g.append('rect')
        .attr('x', (xScale(d.category) || 0) + xScale.bandwidth() * 0.25)
        .attr('y', yScale(d.q3))
        .attr('width', xScale.bandwidth() * 0.5)
        .attr('height', boxHeight)
        .attr('fill', color)
        .attr('fill-opacity', 0.5)
        .attr('stroke', color)
        .attr('stroke-width', 2)

      // Median line
      g.append('line')
        .attr('x1', (xScale(d.category) || 0) + xScale.bandwidth() * 0.25)
        .attr('x2', (xScale(d.category) || 0) + xScale.bandwidth() * 0.75)
        .attr('y1', yScale(d.median))
        .attr('y2', yScale(d.median))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)

      // Mean marker (if enabled)
      if (config.showMean) {
        g.append('circle')
          .attr('cx', x)
          .attr('cy', yScale(d.mean))
          .attr('r', 4)
          .attr('fill', '#ef4444')
      }

      // Outliers (if enabled)
      if (config.showOutliers !== false) {
        d.outliers.forEach(outlier => {
          g.append('circle')
            .attr('cx', x)
            .attr('cy', yScale(outlier))
            .attr('r', 3)
            .attr('fill', '#ef4444')
        })
      }
    })

    // Add axes
    const xAxis = d3.axisBottom(xScale)
    const yAxis = d3.axisLeft(yScale)

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)

    g.append('g').call(yAxis)

    // Add labels
    if (config.xAxis.label) {
      g.append('text')
        .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + 50})`)
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

