'use client'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const HQ = { name: 'TOKYO ★ HQ', pos: [35.68, 139.69] as [number, number] }

const BRANCHES = [
  { name: 'YANTAI',    pos: [37.54, 121.39] as [number, number] },
  { name: 'SHANGHAI',  pos: [31.23, 121.47] as [number, number] },
  { name: 'HONG KONG', pos: [22.32, 114.17] as [number, number] },
  { name: 'FLORIDA',   pos: [25.77, -80.19] as [number, number] },
  { name: 'SPAIN',     pos: [40.42,  -3.70] as [number, number] },
  { name: 'UK',        pos: [51.51,  -0.13] as [number, number] },
  { name: 'BANGKOK',   pos: [13.76, 100.50] as [number, number] },
]

const hqIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#c8a155;box-shadow:0 0 14px #c8a155,0 0 4px #ffe08a;border:2px solid #ffe08a;"></div>`,
  className: '',
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
})

const branchIcon = L.divIcon({
  html: `<div style="width:8px;height:8px;border-radius:50%;background:#c8a155;box-shadow:0 0 7px rgba(200,161,85,0.8);opacity:0.9;"></div>`,
  className: '',
  iconAnchor: [4, 4],
  popupAnchor: [0, -7],
})

export default function WorldMapInner() {
  return (
    <MapContainer
      center={[30, 25]}
      zoom={2}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      style={{ width: '100%', height: '100%', background: '#030712' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution=""
      />
      {BRANCHES.map((b) => (
        <Polyline
          key={b.name}
          positions={[HQ.pos, b.pos]}
          pathOptions={{ color: '#c8a155', weight: 1, opacity: 0.4, dashArray: '5 6' }}
        />
      ))}
      <Marker position={HQ.pos} icon={hqIcon}>
        <Popup>{HQ.name}</Popup>
      </Marker>
      {BRANCHES.map((b) => (
        <Marker key={b.name} position={b.pos} icon={branchIcon}>
          <Popup>{b.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
