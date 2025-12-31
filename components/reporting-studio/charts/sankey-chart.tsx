'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { ChartConfig, ChartDataPoint, DEFAULT_COLORS } from '@/lib/reporting-studio/chart-types'

interface SankeyChartProps {
  config: ChartConfig
  data: ChartDataPoint[]
}

interface SankeyNode {
  name: string
}

interface SankeyLink {
  source: number
  target: number
  value: number
}

export function SankeyChart({ config, data }: SankeyChartProps) {
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

    // Sankey diagrams need source, target, and value fields
    // For now, we'll use xAxis as source, yAxis as target, and first series as value
    if (!config.xAxis?.field || !config.yAxis?.field || !config.series?.[0]?.field) {
      return
    }

    const sourceField = config.xAxis.field
    const targetField = config.yAxis.field
    const valueField = config.series[0].field

    // Extract unique nodes
    const sourceNodes = Array.from(new Set(data.map(d => String(d[sourceField]))))
    const targetNodes = Array.from(new Set(data.map(d => String(d[targetField]))))
    const allNodes = Array.from(new Set([...sourceNodes, ...targetNodes]))

    // Create node map
    const nodes: SankeyNode[] = allNodes.map(name => ({ name }))

    // Create links
    const links: SankeyLink[] = data.map(d => ({
      source: allNodes.indexOf(String(d[sourceField])),
      target: allNodes.indexOf(String(d[targetField])),
      value: Number(d[valueField]) || 0,
    }))

    // Simple Sankey layout (manual positioning)
    // Group nodes into two columns (sources and targets)
    const sourceIndices = links.map(l => l.source)
    const targetIndices = links.map(l => l.target)
    const uniqueSources = Array.from(new Set(sourceIndices))
    const uniqueTargets = Array.from(new Set(targetIndices))

    const nodeWidth = config.nodeWidth || 15
    const nodePadding = config.nodePadding || 10
    const columnWidth = innerWidth / 3

    // Position nodes
    const layoutNodes = nodes.map((node, i) => {
      const isSource = uniqueSources.includes(i)
      const columnIndex = isSource ? 0 : 2
      const nodeList = isSource ? uniqueSources : uniqueTargets
      const nodeIndex = nodeList.indexOf(i)
      const nodeHeight = (innerHeight - (nodeList.length - 1) * nodePadding) / nodeList.length

      return {
        ...node,
        x0: columnWidth * columnIndex,
        x1: columnWidth * columnIndex + nodeWidth,
        y0: nodeIndex * (nodeHeight + nodePadding),
        y1: nodeIndex * (nodeHeight + nodePadding) + nodeHeight,
        index: i,
      }
    })

    // Create layout links with curved paths
    const layoutLinks = links.map(link => {
      const source = layoutNodes[link.source]
      const target = layoutNodes[link.target]
      return {
        ...link,
        source,
        target,
        width: Math.max(1, link.value / 10), // Scale link width
      }
    })

    // Color scale
    const colorScale = d3.scaleOrdinal(DEFAULT_COLORS)

    // Draw links with curved paths
    const link = g.append('g')
      .selectAll('path')
      .data(layoutLinks)
      .enter()
      .append('path')
      .attr('d', (d: any) => {
        const sourceX = d.source.x1
        const sourceY = (d.source.y0 + d.source.y1) / 2
        const targetX = d.target.x0
        const targetY = (d.target.y0 + d.target.y1) / 2
        const midX = (sourceX + targetX) / 2

        return `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`
      })
      .attr('stroke', (d: any) => {
        const sourceIndex = (d.source as any).index
        return colorScale(sourceIndex.toString())
      })
      .attr('stroke-width', (d: any) => Math.max(1, d.width))
      .attr('fill', 'none')
      .attr('opacity', 0.5)

    // Draw nodes
    const node = g.append('g')
      .selectAll('rect')
      .data(layoutNodes)
      .enter()
      .append('rect')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('fill', (d: any, i) => colorScale(i.toString()))

    // Add labels
    node.append('title')
      .text((d: any) => `${d.name}\n${d.value || 0}`)

    g.append('g')
      .selectAll('text')
      .data(layoutNodes)
      .enter()
      .append('text')
      .attr('x', (d: any) => d.x0 < innerWidth / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', (d: any) => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => d.x0 < innerWidth / 2 ? 'start' : 'end')
      .text((d: any) => d.name)
      .style('font-size', '12px')
      .style('fill', '#333')

  }, [config, data])

  return <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
}

