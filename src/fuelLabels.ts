import type { FuelType } from './types'

/** Display labels for fuel types (no octane number). */
export const fuelLabels: Record<FuelType, string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  premiumPetrol: 'Premium petrol',
  premiumDiesel: 'Premium diesel',
}

export function formatPrice(price: number): string {
  return `€${price.toFixed(3)}`
}

export function formatLastUpdated(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  if (diffHours >= 24) return `${Math.floor(diffHours / 24)}d ago`
  if (diffHours > 0) return `${diffHours}h ${diffMins}m ago`
  if (diffMins > 0) return `${diffMins}m ago`
  return 'Just now'
}
