export type FuelType = 'petrol' | 'diesel' | 'premiumPetrol' | 'premiumDiesel'

export interface FuelPrices {
  petrol?: number      // €/L
  diesel?: number
  premiumPetrol?: number
  premiumDiesel?: number
}

export interface FuelStation {
  id: string
  name: string
  brand: string
  address: string
  area: string         // Dublin area/suburb – use for future county expansion
  /** Latitude for map display. */
  lat: number
  /** Longitude for map display. */
  lng: number
  /** Prices in € per litre. Last updated (for demo, simulated). */
  prices: FuelPrices
  lastUpdated: string  // ISO date or display string
}

/** User-submitted price report with optional photo (Waze-style). */
export interface PriceReport {
  id: string
  stationId: string
  petrol?: number
  diesel?: number
  premiumPetrol?: number
  premiumDiesel?: number
  /** URL of uploaded confirmation photo (pump or price board). */
  photoUrl: string | null
  reportedAt: string   // ISO
}

export interface PriceReportInput {
  stationId: string
  petrol?: number
  diesel?: number
  premiumPetrol?: number
  premiumDiesel?: number
  /** Optional: photo of pump/price board helps others trust the report. */
  photoFile?: File | null
}
