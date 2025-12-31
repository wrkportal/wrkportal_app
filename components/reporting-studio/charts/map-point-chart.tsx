'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { ChartConfig, ChartDataPoint, DEFAULT_COLORS } from '@/lib/reporting-studio/chart-types'
import L from 'leaflet'

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false })

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

interface MapPointChartProps {
  config: ChartConfig
  data: ChartDataPoint[]
}

export function MapPointChart({ config, data }: MapPointChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No geographic data available
      </div>
    )
  }

  // Default center and zoom
  const center: [number, number] = config.mapCenter || [39.8283, -98.5795] // Center of USA
  const zoom = config.mapZoom || 4

  // Extract coordinates from data
  // Expects data to have 'latitude' and 'longitude' fields, or 'lat' and 'lng'
  const points = data.map(d => {
    const lat = d.latitude || d.lat || d.y
    const lng = d.longitude || d.lng || d.x || d.lon
    const value = d.value || d.size || 1
    const label = d.label || d.name || `${lat}, ${lng}`

    if (typeof lat === 'number' && typeof lng === 'number') {
      return {
        position: [lat, lng] as [number, number],
        value: Number(value) || 1,
        label: String(label),
        data: d,
      }
    }
    return null
  }).filter(Boolean) as Array<{
    position: [number, number]
    value: number
    label: string
    data: ChartDataPoint
  }>

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No valid geographic coordinates found. Data should have latitude/longitude fields.
      </div>
    )
  }

  // Calculate center from points if not specified
  const calculatedCenter: [number, number] = config.mapCenter || [
    points.reduce((sum, p) => sum + p.position[0], 0) / points.length,
    points.reduce((sum, p) => sum + p.position[1], 0) / points.length,
  ]

  // Calculate value range for sizing
  const values = points.map(p => p.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)

  const getRadius = (value: number) => {
    if (maxValue === minValue) return 10
    const ratio = (value - minValue) / (maxValue - minValue)
    return 5 + ratio * 20 // Radius between 5 and 25
  }

  const colors = config.colors || DEFAULT_COLORS

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={calculatedCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point, index) => (
          <CircleMarker
            key={index}
            center={point.position}
            radius={getRadius(point.value)}
            pathOptions={{
              fillColor: colors[index % colors.length],
              color: '#fff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.7,
            }}
          >
            <Popup>
              <div>
                <strong>{point.label}</strong>
                <br />
                Value: {point.value.toLocaleString()}
                <br />
                Coordinates: {point.position[0].toFixed(4)}, {point.position[1].toFixed(4)}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}

