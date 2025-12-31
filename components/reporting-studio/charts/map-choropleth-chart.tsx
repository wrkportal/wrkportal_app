'use client'

import dynamic from 'next/dynamic'
import { ChartConfig, ChartDataPoint } from '@/lib/reporting-studio/chart-types'

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false })

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css'

interface MapChoroplethChartProps {
  config: ChartConfig
  data: ChartDataPoint[]
}

export function MapChoroplethChart({ config, data }: MapChoroplethChartProps) {

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

  // For choropleth, we need GeoJSON data and a value field
  // For now, we'll create a simple implementation that works with coordinates
  const locationField = config.locationField || 'location'
  const valueField = config.valueField || config.series?.[0]?.field || 'value'

  // Group data by location (simplified - in production, would match to GeoJSON features)
  const locationData = new Map<string, number>()
  data.forEach(d => {
    const location = String(d[locationField])
    const value = Number(d[valueField]) || 0
    locationData.set(location, (locationData.get(location) || 0) + value)
  })

  // Simple GeoJSON feature collection (in production, this would come from config.geoJsonUrl)
  const geoJsonData = {
    type: 'FeatureCollection',
    features: Array.from(locationData.entries()).map(([name, value], index) => ({
      type: 'Feature',
      properties: {
        name,
        value,
      },
      geometry: {
        type: 'Point',
        coordinates: [center[1] + (Math.random() - 0.5) * 10, center[0] + (Math.random() - 0.5) * 10],
      },
    })),
  }

  // Calculate color based on value
  const values = Array.from(locationData.values())
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)

  const getColor = (value: number) => {
    if (maxValue === minValue) return '#9333ea'
    const ratio = (value - minValue) / (maxValue - minValue)
    if (ratio < 0.33) return '#3b82f6' // Blue
    if (ratio < 0.66) return '#10b981' // Green
    return '#ef4444' // Red
  }

  // Style function for GeoJSON
  const geoJsonStyle = (feature: any) => {
    const value = feature.properties.value || 0
    return {
      fillColor: getColor(value),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7,
    }
  }

  // Create info tooltip
  const onEachFeature = (feature: any, layer: any) => {
    const { name, value } = feature.properties
    layer.bindPopup(`${name}: ${value.toLocaleString()}`)
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoJsonData && (
          <GeoJSON
            data={geoJsonData as any}
            style={geoJsonStyle}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
    </div>
  )
}

