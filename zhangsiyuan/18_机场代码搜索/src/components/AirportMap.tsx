'use client'
import { useEffect, useRef } from 'react'
import type { Airport } from '@/lib/types'

interface Props {
  airport: Airport
}

export default function AirportMap({ airport }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)
  const markerRef = useRef<unknown>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let L: typeof import('leaflet')
    let map: import('leaflet').Map

    const init = async () => {
      L = (await import('leaflet')).default

      // Fix default marker icon path for Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (mapRef.current) {
        ;(mapRef.current as import('leaflet').Map).remove()
      }

      map = L.map(containerRef.current!, {
        center: [airport.lat, airport.lon],
        zoom: 10,
        zoomControl: true,
        attributionControl: true,
      })

      // CartoDB Dark Matter — free, no API key, dark style matching app theme
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map)

      const customIcon = L.divIcon({
        className: '',
        html: `<div class="map-marker"><span>✈</span></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -22],
      })

      const marker = L.marker([airport.lat, airport.lon], { icon: customIcon }).addTo(map)
      marker.bindPopup(
        `<div class="map-popup"><strong>${airport.iata}</strong> · ${airport.icao}<br/>${airport.name}<br/>${airport.city}, ${airport.country}</div>`,
        { maxWidth: 260 }
      ).openPopup()

      mapRef.current = map
      markerRef.current = marker
    }

    init()

    return () => {
      if (mapRef.current) {
        ;(mapRef.current as import('leaflet').Map).remove()
        mapRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airport.iata])

  return <div ref={containerRef} className="leaflet-map" />
}
