'use client'
import { useEffect, useRef } from 'react'
import type { Airport, Lang } from '@/data/airports'

type Props = {
  origin: Airport
  destination: Airport
  lang: Lang
}

export default function RouteMapInner({ origin, destination, lang }: Props) {
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)

  useEffect(() => {
    if (!divRef.current) return

    // Dynamically import leaflet (client-only, avoids SSR)
    import('leaflet').then(L => {
      // Destroy previous instance to avoid duplicate map errors
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove()
        mapRef.current = null
      }

      const map = L.map(divRef.current!, { zoomControl: true, attributionControl: true })
      mapRef.current = map

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        { attribution: '© <a href="https://openstreetmap.org">OSM</a> © <a href="https://carto.com">CARTO</a>' }
      ).addTo(map)

      const mkOrigin = L.divIcon({
        className: '',
        html: '<div style="width:13px;height:13px;border-radius:50%;background:#EA580C;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(234,88,12,.5)"></div>',
        iconSize: [13, 13], iconAnchor: [6, 6],
      })
      const mkDest = L.divIcon({
        className: '',
        html: '<div style="width:13px;height:13px;border-radius:50%;background:#1E293B;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>',
        iconSize: [13, 13], iconAnchor: [6, 6],
      })

      L.marker([origin.lat, origin.lng], { icon: mkOrigin })
        .addTo(map)
        .bindPopup(`<b>${origin.code}</b><br>${origin.name[lang] || origin.name.en}`)

      L.marker([destination.lat, destination.lng], { icon: mkDest })
        .addTo(map)
        .bindPopup(`<b>${destination.code}</b><br>${destination.name[lang] || destination.name.en}`)

      L.polyline(
        [[origin.lat, origin.lng], [destination.lat, destination.lng]],
        { color: '#EA580C', weight: 2.5, dashArray: '7 5', opacity: 0.75 }
      ).addTo(map)

      map.fitBounds(
        L.latLngBounds([origin.lat, origin.lng], [destination.lat, destination.lng]),
        { padding: [48, 48] }
      )
    })

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove()
        mapRef.current = null
      }
    }
  }, [origin, destination, lang])

  return <div ref={divRef} style={{ width: '100%', height: '100%' }} />
}
