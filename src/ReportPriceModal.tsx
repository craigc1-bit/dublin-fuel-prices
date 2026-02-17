import { useState, useRef } from 'react'
import type { FuelStation } from './types'
import { fuelLabels } from './fuelLabels'
import { submitReport } from './api/reports'
import { isSupabaseConfigured } from './lib/supabase'
import './ReportPriceModal.css'

interface ReportPriceModalProps {
  /** Pre-selected station when opening from a card; null when opening from "Report a price" in header. */
  station: FuelStation | null
  stations: FuelStation[]
  onClose: () => void
  onSuccess: () => void
}

const FUEL_KEYS = ['petrol', 'diesel', 'premiumPetrol', 'premiumDiesel'] as const

export function ReportPriceModal({ station: initialStation, stations, onClose, onSuccess }: ReportPriceModalProps) {
  const [stationId, setStationId] = useState(initialStation?.id ?? stations[0]?.id ?? '')
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)

  // Soft hint if price looks unusual (optional photo helps verify)
  const enteredPrices = [prices.petrol, prices.diesel, prices.premiumPetrol, prices.premiumDiesel]
    .map((v) => (v?.trim() ? parseFloat(v.replace(',', '.')) : NaN))
    .filter((n) => Number.isFinite(n))
  const isOutlier = enteredPrices.some((p) => p < 1.2 || p > 2.4)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setStatus('error')
      setErrorMessage('Please choose an image (e.g. photo of the pump or price board).')
      return
    }
    setPhotoFile(file)
    const url = URL.createObjectURL(file)
    setPhotoPreview(url)
    setStatus('idle')
    setErrorMessage('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = (key: string) => {
      const v = prices[key]?.trim()
      if (!v) return undefined
      const n = parseFloat(v.replace(',', '.'))
      return Number.isFinite(n) ? n : undefined
    }
    const petrol = num('petrol')
    const diesel = num('diesel')
    const premiumPetrol = num('premiumPetrol')
    const premiumDiesel = num('premiumDiesel')
    if (!petrol && !diesel && !premiumPetrol && !premiumDiesel) {
      setStatus('error')
      setErrorMessage('Enter at least one price.')
      return
    }
    if (!stationId) {
      setStatus('error')
      setErrorMessage('Select a station.')
      return
    }

    setStatus('submitting')
    setErrorMessage('')
    const result = await submitReport({
      stationId,
      petrol,
      diesel,
      premiumPetrol,
      premiumDiesel,
      ...(photoFile && { photoFile }),
    })

    if (result.ok) {
      setStatus('success')
      onSuccess()
      setTimeout(() => onClose(), 1500)
    } else {
      setStatus('error')
      setErrorMessage(result.error)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="report-modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
      <div className="report-modal">
        <div className="report-modal-header">
          <h2 id="report-modal-title">Report price</h2>
          <p className="report-modal-subtitle">Report what you see at the pump. Adding a photo helps others trust your report (optional).</p>
          <button type="button" className="report-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {!isSupabaseConfigured && (
          <p className="report-modal-demo">
            Demo mode: reports are saved in this browser only. Add Supabase to enable photo upload and sync across devices.
          </p>
        )}

        <form onSubmit={handleSubmit} className="report-modal-form">
          <div className="form-group">
            <label htmlFor="report-station">Station *</label>
            <select
              id="report-station"
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              required
            >
              <option value="">Select station</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name}, {s.area}</option>
              ))}
            </select>
          </div>

          <div className="form-group form-prices">
            <span className="form-label">Prices (€/L) — enter at least one</span>
            <div className="price-inputs">
              {FUEL_KEYS.map((key) => (
                <div key={key} className="price-input-row">
                  <label htmlFor={`price-${key}`}>{fuelLabels[key]}</label>
                  <input
                    id={`price-${key}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 1.599"
                    value={prices[key] ?? ''}
                    onChange={(e) => setPrices((p) => ({ ...p, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label id="report-photo-label">Photo of pump or price board (optional)</label>
            <p className="form-hint">Add a photo so others can verify.</p>
            <input
              ref={cameraInputRef}
              id="report-photo-camera"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="report-photo-input report-photo-input--hidden"
              aria-labelledby="report-photo-label"
            />
            <input
              ref={libraryInputRef}
              id="report-photo-library"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="report-photo-input report-photo-input--hidden"
              aria-labelledby="report-photo-label"
            />
            {photoPreview && (
              <div className="report-photo-preview">
                <img src={photoPreview} alt="Preview of pump/price" />
                <button
                  type="button"
                  className="report-photo-remove"
                  onClick={() => {
                    setPhotoFile(null)
                    if (photoPreview) URL.revokeObjectURL(photoPreview)
                    setPhotoPreview(null)
                    cameraInputRef.current && (cameraInputRef.current.value = '')
                    libraryInputRef.current && (libraryInputRef.current.value = '')
                  }}
                >
                  Remove photo
                </button>
              </div>
            )}
            {!photoPreview && (
              <div className="report-photo-triggers">
                <button
                  type="button"
                  className="report-photo-trigger"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  📷 Take photo
                </button>
                <button
                  type="button"
                  className="report-photo-trigger"
                  onClick={() => libraryInputRef.current?.click()}
                >
                  🖼️ Choose from library
                </button>
              </div>
            )}
            {isOutlier && !photoPreview && (
              <p className="form-hint form-hint--soft">This price is outside the usual range. Adding a photo helps others verify it.</p>
            )}
          </div>

          {status === 'error' && <p className="form-error" role="alert">{errorMessage}</p>}
          {status === 'success' && <p className="form-success" role="status">Thanks! Your report was saved.</p>}

          <div className="report-modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
