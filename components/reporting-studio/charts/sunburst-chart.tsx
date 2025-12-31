'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { ChartConfig, ChartDataPoint, DEFAULT_COLORS } from '@/lib/reporting-studio/chart-types'

interface SunburstChartProps {
  config: ChartConfig
  data: ChartDataPoint[]
}

export function SunburstChart({ config, data }: SunburstChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = config.width || 800
    const height = config.height || 600
    const radius = Math.min(width, height) / 2 - 40

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`)

    if (!config.categoryField || !config.valueField) {
      return
    }

    const categoryField = config.categoryField
    const valueField = config.valueField

    // Create hierarchical data structure
    // For simplicity, we'll create a flat hierarchy
    const root = d3.hierarchy({
      name: 'root',
      children: data.map(d => ({
        name: String(d[categoryField]),
        value: Number(d[valueField]) || 0,
      })),
    })
      .sum(d => (d as any).value)
      .sort((a, b) => (b.value || 0) - (a.value || 0))

    const innerRadius = config.innerRadius || radius * 0.3
    const partition = d3.partition().size([2 * Math.PI, radius - innerRadius])

    partition(root)

    const arc = d3.arc()
      .startAngle((d: any) => d.x0)
      .endAngle((d: any) => d.x1)
      .innerRadius((d: any) => Math.sqrt(d.y0))
      .outerRadius((d: any) => Math.sqrt(d.y1))

    const colorScale = d3.scaleOrdinal(DEFAULT_COLORS)

    // Draw arcs
    g.selectAll('path')
      .data(root.descendants().filter(d => d.depth))
      .enter()
      .append('path')
      .attr('d', arc as any)
      .attr('fill', (d: any, i) => colorScale(i.toString()))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .append('title')
      .text((d: any) => `${d.data.name}\n${d.value || 0}`)

    // Add labels for larger arcs
    g.selectAll('text')
      .data(root.descendants().filter(d => d.depth && (d.x1 - d.x0) > 0.03))
      .enter()
      .append('text')
      .attr('transform', (d: any) => {
        const x = ((d.x0 + d.x1) / 2) * 180 / Math.PI
        const y = -Math.sqrt((d.y0 + d.y1) / 2)
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`
      })
      .attr('text-anchor', (d: any) => {
        const x = ((d.x0 + d.x1) / 2) * 180 / Math.PI
        return x < 180 ? 'start' : 'end'
      })
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('fill', '#333')
      .text((d: any) => d.data.name)

  }, [config, data])

  return <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
}

