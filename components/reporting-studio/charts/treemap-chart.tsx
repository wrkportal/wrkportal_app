'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { ChartConfig, ChartDataPoint, DEFAULT_COLORS } from '@/lib/reporting-studio/chart-types'

interface TreemapChartProps {
  config: ChartConfig
  data: ChartDataPoint[]
}

export function TreemapChart({ config, data }: TreemapChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = config.width || 800
    const height = config.height || 600
    const margin = { top: 10, right: 10, bottom: 10, left: 10 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    if (!config.categoryField || !config.valueField) {
      return
    }

    const categoryField = config.categoryField
    const valueField = config.valueField

    // Prepare hierarchical data
    const root = d3.hierarchy({
      name: 'root',
      children: data.map(d => ({
        name: String(d[categoryField]),
        value: Number(d[valueField]) || 0,
      })),
    })
      .sum(d => (d as any).value)
      .sort((a, b) => (b.value || 0) - (a.value || 0))

    // Create treemap layout
    const treemap = d3.treemap()
      .size([innerWidth, innerHeight])
      .padding(config.padding || 2)
      .round(true)

    treemap(root)

    const colorScale = d3.scaleOrdinal(DEFAULT_COLORS)

    // Draw cells
    const cell = g.selectAll('g')
      .data(root.leaves())
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.x0},${d.y0})`)

    cell.append('rect')
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', (d, i) => colorScale(i.toString()))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)

    // Add labels
    cell.append('text')
      .attr('x', d => (d.x1 - d.x0) / 2)
      .attr('y', d => (d.y1 - d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .style('font-size', d => {
        const size = Math.min(d.x1 - d.x0, d.y1 - d.y0)
        return `${Math.max(10, size / 10)}px`
      })
      .style('fill', '#fff')
      .style('font-weight', 'bold')
      .text(d => d.data.name)
      .style('display', d => {
        const size = Math.min(d.x1 - d.x0, d.y1 - d.y0)
        return size > 50 ? 'block' : 'none'
      })

    // Add value labels
    cell.filter(d => (d.x1 - d.x0) > 60 && (d.y1 - d.y0) > 30)
      .append('text')
      .attr('x', d => (d.x1 - d.x0) / 2)
      .attr('y', d => (d.y1 - d.y0) / 2 + 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#fff')
      .text(d => (d.value || 0).toLocaleString())

  }, [config, data])

  return <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
}

