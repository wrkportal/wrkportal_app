'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { ChartConfig, ChartDataPoint, DEFAULT_COLORS } from '@/lib/reporting-studio/chart-types'

interface GanttChartProps {
  config: ChartConfig
  data: ChartDataPoint[]
}

export function GanttChart({ config, data }: GanttChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = config.width || 800
    const height = config.height || 600
    const margin = { top: 40, right: 30, bottom: 80, left: 150 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Gantt charts need: task name, start date, end date
    // We'll use xAxis for task name, and expect start/end fields in data
    if (!config.xAxis?.field) {
      return
    }

    const taskField = config.xAxis.field

    // Process data - assume data has 'start' and 'end' or 'duration' fields
    const processedData = data.map((d, i) => {
      const taskName = String(d[taskField])
      let start: Date, end: Date

      if (d.start && d.end) {
        start = d.start instanceof Date ? d.start : new Date(d.start)
        end = d.end instanceof Date ? d.end : new Date(d.end)
      } else if (d.startDate && d.endDate) {
        start = d.startDate instanceof Date ? d.startDate : new Date(d.startDate)
        end = d.endDate instanceof Date ? d.endDate : new Date(d.endDate)
      } else if (d.start && d.duration) {
        start = d.start instanceof Date ? d.start : new Date(d.start)
        end = new Date(start.getTime() + Number(d.duration) * 24 * 60 * 60 * 1000)
      } else {
        // Default: use index-based dates
        const baseDate = new Date()
        start = new Date(baseDate.getTime() + i * 7 * 24 * 60 * 60 * 1000)
        end = new Date(start.getTime() + 5 * 24 * 60 * 60 * 1000)
      }

      return {
        task: taskName,
        start,
        end,
      }
    })

    // Scales
    const yScale = d3.scaleBand()
      .domain(processedData.map(d => d.task))
      .range([0, innerHeight])
      .padding(0.2)

    const allDates = processedData.flatMap(d => [d.start, d.end])
    const minDate = d3.min(allDates) || new Date()
    const maxDate = d3.max(allDates) || new Date()

    const xScale = d3.scaleTime()
      .domain([minDate, maxDate])
      .range([0, innerWidth])

    const taskHeight = config.taskHeight || yScale.bandwidth()
    const colorScale = d3.scaleOrdinal(DEFAULT_COLORS)

    // Draw bars
    processedData.forEach((d, i) => {
      const x = xScale(d.start)
      const width = xScale(d.end) - xScale(d.start)

      g.append('rect')
        .attr('x', x)
        .attr('y', (yScale(d.task) || 0) + (yScale.bandwidth() - taskHeight) / 2)
        .attr('width', width)
        .attr('height', taskHeight)
        .attr('fill', colorScale(i.toString()))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .append('title')
        .text(`${d.task}\n${d.start.toLocaleDateString()} - ${d.end.toLocaleDateString()}`)
    })

    // Draw dependencies (if enabled)
    if (config.showDependencies) {
      // This would require dependency data in the dataset
      // For now, we'll skip this feature
    }

    // Add axes
    const xAxis = d3.axisTop(xScale)
      .ticks(d3.timeDay.every(1))
      .tickFormat(d3.timeFormat('%m/%d'))

    const yAxis = d3.axisLeft(yScale)

    g.append('g')
      .attr('transform', 'translate(0,0)')
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
        .attr('transform', `translate(${innerWidth / 2}, -20)`)
        .style('text-anchor', 'middle')
        .text(config.xAxis.label)
    }

    // Grid lines
    g.selectAll('.grid-line')
      .data(xScale.ticks(d3.timeDay.every(1)))
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')

  }, [config, data])

  return <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
}

