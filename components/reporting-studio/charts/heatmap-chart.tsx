'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { ChartConfig, ChartDataPoint, DEFAULT_COLORS } from '@/lib/reporting-studio/chart-types'

interface HeatmapChartProps {
  config: ChartConfig
  data: ChartDataPoint[]
}

export function HeatmapChart({ config, data }: HeatmapChartProps) {
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

    if (!config.xAxis?.field || !config.yAxis?.field || !config.series?.[0]?.field) {
      return
    }

    const xField = config.xAxis.field
    const yField = config.yAxis.field
    const valueField = config.series[0].field

    // Extract unique x and y categories
    const xCategories = Array.from(new Set(data.map(d => String(d[xField]))))
    const yCategories = Array.from(new Set(data.map(d => String(d[yField])))).reverse()

    // Create scales
    const xScale = d3.scaleBand()
      .domain(xCategories)
      .range([0, innerWidth])
      .padding(0.05)

    const yScale = d3.scaleBand()
      .domain(yCategories)
      .range([0, innerHeight])
      .padding(0.05)

    // Color scale
    const values = data.map(d => Number(d[valueField]) || 0)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)

    const colorScale = config.colorScale === 'diverging'
      ? d3.scaleSequential(d3.interpolateRdBu).domain([maxValue, minValue])
      : d3.scaleSequential(d3.interpolateBlues).domain([minValue, maxValue])

    // Create a map for quick value lookup
    const dataMap = new Map<string, number>()
    data.forEach(d => {
      const key = `${d[xField]}_${d[yField]}`
      dataMap.set(key, Number(d[valueField]) || 0)
    })

    // Draw cells
    yCategories.forEach(yCat => {
      xCategories.forEach(xCat => {
        const key = `${xCat}_${yCat}`
        const value = dataMap.get(key) || 0

        g.append('rect')
          .attr('x', xScale(xCat)!)
          .attr('y', yScale(yCat)!)
          .attr('width', xScale.bandwidth())
          .attr('height', yScale.bandwidth())
          .attr('fill', colorScale(value))
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .append('title')
          .text(`${xCat} × ${yCat}: ${value}`)
      })
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

    if (config.yAxis.label) {
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -50)
        .attr('x', -innerHeight / 2)
        .style('text-anchor', 'middle')
        .text(config.yAxis.label)
    }

    // Add legend
    const legendWidth = 200
    const legendHeight = 20
    const legendScale = d3.scaleLinear()
      .domain([minValue, maxValue])
      .range([0, legendWidth])

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)

    const legend = g.append('g')
      .attr('transform', `translate(${innerWidth - legendWidth}, ${innerHeight + 30})`)

    const legendGradient = legend.append('defs')
      .append('linearGradient')
      .attr('id', 'heatmap-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%')

    const numStops = 10
    for (let i = 0; i <= numStops; i++) {
      const value = minValue + (maxValue - minValue) * (i / numStops)
      legendGradient.append('stop')
        .attr('offset', `${(i / numStops) * 100}%`)
        .attr('stop-color', colorScale(value))
    }

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#heatmap-gradient)')

    legend.append('g')
      .attr('transform', `translate(0,${legendHeight})`)
      .call(legendAxis)

  }, [config, data])

  return <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
}

