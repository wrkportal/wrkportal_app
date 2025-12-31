'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { ChartConfig, ChartDataPoint } from '@/lib/reporting-studio/chart-types'

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css'

interface MapHeatChartProps {
  config: ChartConfig
  data: ChartDataPoint[]
}

// Component to add heat layer using circles (simpler than leaflet.heat)
function HeatLayer({ data }: { data: ChartDataPoint[] }) {
  // Extract coordinates and intensity from data
  const heatPoints = data
    .map(d => {
      const lat = d.latitude || d.lat || d.y
      const lng = d.longitude || d.lng || d.x || d.lon
      const intensity = d.intensity || d.value || d.weight || 1

      if (typeof lat === 'number' && typeof lng === 'number') {
        return {
          position: [lat, lng] as [number, number],
          intensity: Number(intensity) || 1,
        }
      }
      return null
    })
    .filter(Boolean) as Array<{ position: [number, number]; intensity: number }>

  if (heatPoints.length === 0) return null

  const maxIntensity = Math.max(...heatPoints.map(p => p.intensity))

  const getColor = (intensity: number) => {
    const ratio = intensity / maxIntensity
    if (ratio < 0.2) return 'rgba(0, 0, 255, 0.6)' // Blue
    if (ratio < 0.4) return 'rgba(0, 255, 255, 0.6)' // Cyan
    if (ratio < 0.6) return 'rgba(0, 255, 0, 0.6)' // Green
    if (ratio < 0.8) return 'rgba(255, 255, 0, 0.6)' // Yellow
    return 'rgba(255, 0, 0, 0.6)' // Red
  }

  return (
    <>
      {heatPoints.map((point, index) => (
        <CircleMarker
          key={index}
          center={point.position}
          radius={15 + (point.intensity / maxIntensity) * 25}
          pathOptions={{
            fillColor: getColor(point.intensity),
            color: '#fff',
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.6,
          }}
        >
          <Popup>
            <div>
              Intensity: {point.intensity.toLocaleString()}
              <br />
              Coordinates: {point.position[0].toFixed(4)}, {point.position[1].toFixed(4)}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  )
}

export function MapHeatChart({ config, data }: MapHeatChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No geographic data available
      </div>
    )
  }

  // Default center and zoom
  const center: [number, number] = config.mapCenter || [39.8283, -98.5795]
  const zoom = config.mapZoom || 4

  // Calculate center from data if available
  const coordinates = data
    .map(d => {
      const lat = d.latitude || d.lat || d.y
      const lng = d.longitude || d.lng || d.x || d.lon
      if (typeof lat === 'number' && typeof lng === 'number') {
        return [lat, lng] as [number, number]
      }
      return null
    })
    .filter(Boolean) as Array<[number, number]>

  const calculatedCenter: [number, number] =
    coordinates.length > 0
      ? [
          coordinates.reduce((sum, c) => sum + c[0], 0) / coordinates.length,
          coordinates.reduce((sum, c) => sum + c[1], 0) / coordinates.length,
        ]
      : center

  // For Next.js, we need to handle SSR
  if (typeof window === 'undefined') {
    return (
      <div className="flex items-center justify-center h-full">
        Loading map...
      </div>
    )
  }

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
        <HeatLayer data={data} />
      </MapContainer>
    </div>
  )
}

