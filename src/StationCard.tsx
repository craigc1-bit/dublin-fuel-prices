import { useState, useEffect } from 'react'
import type { FuelStation, FuelType, PriceReport } from './types'
import { fuelLabels, formatPrice, formatLastUpdated } from './fuelLabels'
import { usePhotoDisplayUrl } from './usePhotoDisplayUrl'
import './StationCard.css'

interface StationCardProps {
  station: FuelStation
  highlightFuel?: FuelType
  report?: PriceReport | null
  onReportClick: () => void
  onShowOnMap?: () => void
}

export function StationCard({ station, highlightFuel, report, onReportClick, onShowOnMap }: StationCardProps) {
  const photoDisplayUrl = usePhotoDisplayUrl(report?.photoUrl)
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false)
  useEffect(() => {
    setPhotoLoadFailed(false)
  }, [photoDisplayUrl])
  const prices = report
    ? {
        petrol: report.petrol,
        diesel: report.diesel,
        premiumPetrol: report.premiumPetrol,
        premiumDiesel: report.premiumDiesel,
      }
    : station.prices
  const lastUpdated = report?.reportedAt ?? station.lastUpdated
  const entries = (Object.entries(prices) as [keyof typeof prices, number][])
    .filter(([, v]) => v != null)

  const priceValues = entries.map(([, v]) => v)
  const isUnusualPrice = priceValues.some((p) => p < 1.2 || p > 2.4)
  const showUnusualNotice = isUnusualPrice && (!report || !report.photoUrl)

  const { name, brand, address, area } = station

  const handlePhotoClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!photoDisplayUrl || !report?.photoUrl) return
    e.preventDefault()
    try {
      const res = await fetch(photoDisplayUrl, { mode: 'cors' })
      if (!res.ok) throw new Error('Fetch failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      window.open(report.photoUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <article className="station-card">
      <div className="station-card-header">
        <span className="station-brand">{brand}</span>
        <div className="station-badges">
          {report && (
            <span
              className={`station-badge station-badge--reported ${report.photoUrl ? 'station-badge--photo' : ''}`}
              title={report.photoUrl ? 'Price from user report with photo' : 'Price from community report'}
            >
              {report.photoUrl ? '✓ Photo confirmed' : '✓ Community report'}
            </span>
          )}
          <span className="station-area">{area}</span>
        </div>
      </div>
      <h2 className="station-name">{name}</h2>
      <p className="station-address">{address}</p>

      {report?.photoUrl && report.photoUrl !== 'demo' && report.photoUrl.startsWith('http') && photoDisplayUrl && (
        <a
          href={report.photoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`station-report-photo ${photoLoadFailed ? 'station-report-photo--link-only' : ''}`}
          title="View confirmation photo (opens in new tab)"
          onClick={handlePhotoClick}
        >
          {!photoLoadFailed && (
            <img
              src={photoDisplayUrl}
              alt="Price confirmation"
              referrerPolicy="no-referrer"
              onError={() => setPhotoLoadFailed(true)}
            />
          )}
          <span>Photo</span>
        </a>
      )}

      <dl className="station-prices">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className={`price-row ${highlightFuel === key ? 'price-row--highlight' : ''}`}
          >
            <dt>{fuelLabels[key as FuelType]}</dt>
            <dd className="price-value">{formatPrice(value)}<span className="unit">/L</span></dd>
          </div>
        ))}
      </dl>

      {showUnusualNotice && (
        <p className="station-unusual-hint" role="status" title="Price is outside the typical range (about €1.20–€2.40/L). A photo-confirmed report would help verify it.">
          Unusual price — not photo confirmed
        </p>
      )}

      <div className="station-card-footer">
        <p className="station-updated" title={lastUpdated}>
          {report ? 'Reported ' : 'Updated '}{formatLastUpdated(lastUpdated)}
        </p>
        <div className="station-card-actions">
          {onShowOnMap && (
            <button type="button" className="station-map-btn" onClick={onShowOnMap} title="Show on map">
              Show on map
            </button>
          )}
          <button type="button" className="station-report-btn" onClick={onReportClick}>
            Report price
          </button>
        </div>
      </div>
    </article>
  )
}
