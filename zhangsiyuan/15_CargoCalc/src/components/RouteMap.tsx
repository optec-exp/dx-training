import dynamic from 'next/dynamic'
import type { Airport, Lang } from '@/data/airports'

// SSR を無効にして Leaflet を動的インポート（Leaflet は browser-only API を使用するため）
const RouteMapInner = dynamic(() => import('./RouteMapInner'), {
  ssr: false,
  loading: () => <div className="map-loading">Loading map…</div>,
})

type Props = {
  origin: Airport
  destination: Airport
  lang: Lang
}

export default function RouteMap({ origin, destination, lang }: Props) {
  return (
    <div className="map-wrapper">
      <RouteMapInner origin={origin} destination={destination} lang={lang} />
    </div>
  )
}
