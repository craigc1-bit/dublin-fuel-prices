import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { FuelStation, PriceReport } from './types'
import { fuelLabels, formatPrice } from './fuelLabels'
import 'leaflet/dist/leaflet.css'
import './StationMap.css'

const DUBLIN_CENTER: L.LatLngTuple = [53.35, -6.26]
const DEFAULT_ZOOM = 11

function FitBounds({ stations, centerStationId, onCenterUsed }: { stations: FuelStation[]; centerStationId: string | null; onCenterUsed: () => void }) {
  const map = useMap()
  const skipNextFit = useRef(false)
  useEffect(() => {
    if (stations.length === 0) return
    if (centerStationId) {
      const station = stations.find((s) => s.id === centerStationId)
      if (station) {
        map.setView([station.lat, station.lng], 15)
        skipNextFit.current = true
        onCenterUsed()
      }
      return
    }
    if (skipNextFit.current) {
      skipNextFit.current = false
      return
    }
    if (stations.length === 1) {
      map.setView([stations[0].lat, stations[0].lng], 14)
      return
    }
    const bounds = L.latLngBounds(stations.map((s) => [s.lat, s.lng] as L.LatLngTuple))
    map.fitBounds(bounds.pad(0.15))
  }, [map, stations, centerStationId, onCenterUsed])
  return null
}

const markerIcon = L.divIcon({
  className: 'station-marker',
  html: '<span aria-hidden>⛽</span>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

interface StationMapProps {
  stations: FuelStation[]
  reportsByStation: Record<string, PriceReport>
  centerStationId?: string | null
  onCenterUsed?: () => void
  onReportClick: (station: FuelStation) => void
}

export function StationMap({ stations, reportsByStation, centerStationId = null, onCenterUsed = () => {}, onReportClick }: StationMapProps) {
  return (
    <div className="station-map-wrap">
      <MapContainer
        center={DUBLIN_CENTER}
        zoom={DEFAULT_ZOOM}
        className="station-map"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds stations={stations} centerStationId={centerStationId ?? null} onCenterUsed={onCenterUsed} />
        {stations.map((station) => {
          const report = reportsByStation[station.id]
          const prices = report
            ? {
                petrol: report.petrol,
                diesel: report.diesel,
                premiumPetrol: report.premiumPetrol,
                premiumDiesel: report.premiumDiesel,
              }
            : station.prices
          const entries = (Object.entries(prices) as [keyof typeof prices, number][]).filter(
            ([, v]) => v != null
          )
          const priceValues = entries.map(([, v]) => v)
          const isUnusualPrice = priceValues.some((p) => p < 1.2 || p > 2.4)
          const showUnusualNotice = isUnusualPrice && (!report || !report.photoUrl)

          return (
            <Marker
              key={station.id}
              position={[station.lat, station.lng]}
              icon={markerIcon}
            >
              <Popup>
                <div className="map-popup">
                  <strong className="map-popup-name">{station.name}</strong>
                  <span className="map-popup-brand">{station.brand}</span>
                  <p className="map-popup-address">{station.address}</p>
                  {report && (
                    <span className="map-popup-badge">
                      {report.photoUrl ? 'Photo confirmed' : 'Community report'}
                    </span>
                  )}
                  <dl className="map-popup-prices">
                    {entries.map(([key, value]) => (
                      <div key={key} className="map-popup-price-row">
                        <dt>{fuelLabels[key as keyof typeof fuelLabels]}</dt>
                        <dd>{formatPrice(value)}/L</dd>
                      </div>
                    ))}
                  </dl>
                  {showUnusualNotice && (
                    <p className="map-popup-unusual">Unusual price — not photo confirmed</p>
                  )}
                  <button
                    type="button"
                    className="map-popup-report-btn"
                    onClick={() => onReportClick(station)}
                  >
                    Report price
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
