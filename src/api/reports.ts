import type { PriceReport, PriceReportInput } from '../types'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { VITE_SUPABASE_URL } from '../lib/env'

const STORAGE_BUCKET = 'price-confirmation-photos'
const PUBLIC_URL_PREFIX = `${VITE_SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/`
// Match any Supabase-style public URL for our bucket (robust to origin/encoding)
const PUBLIC_URL_REGEX = /\/storage\/v1\/object\/public\/price-confirmation-photos\/(.+?)(?:\?|$)/
const DEMO_STORAGE_KEY = 'dublin-fuel-demo-reports'

/** Supabase price_reports row (no generated types, so we define shape). */
interface PriceReportRow {
  id: string
  station_id: string
  petrol?: number
  diesel?: number
  premium_petrol?: number
  premium_diesel?: number
  photo_url: string | null
  reported_at: string
}

/** Get latest report per station (for merging into UI). */
export async function getLatestReports(): Promise<Record<string, PriceReport>> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('price_reports')
      .select('*')
      .order('reported_at', { ascending: false })

    if (error) {
      console.error('getLatestReports', error)
      return {}
    }

    const byStation: Record<string, PriceReport> = {}
    const rows = (data ?? []) as PriceReportRow[]
    for (const row of rows) {
      if (!byStation[row.station_id]) {
        byStation[row.station_id] = mapRowToReport(row)
      }
    }
    return byStation
  }

  // Demo: read from localStorage
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    const arr = raw ? (JSON.parse(raw) as PriceReport[]) : []
    const byStation: Record<string, PriceReport> = {}
    for (const r of arr) {
      if (!byStation[r.stationId]) byStation[r.stationId] = r
    }
    return byStation
  } catch {
    return {}
  }
}

function mapRowToReport(row: PriceReportRow): PriceReport {
  return {
    id: row.id,
    stationId: row.station_id,
    petrol: row.petrol,
    diesel: row.diesel,
    premiumPetrol: row.premium_petrol,
    premiumDiesel: row.premium_diesel,
    photoUrl: row.photo_url,
    reportedAt: row.reported_at,
  }
}

/** Submit a price report; photo is optional but helps others trust it. */
export async function submitReport(input: PriceReportInput): Promise<{ ok: true; report: PriceReport } | { ok: false; error: string }> {
  if (isSupabaseConfigured && supabase) {
    let photoUrl: string | null = null
    if (input.photoFile) {
      const fileExt = input.photoFile.name.split('.').pop() ?? 'jpg'
      const path = `${input.stationId}/${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, input.photoFile, { upsert: false })

      if (uploadError) {
        return { ok: false, error: uploadError.message }
      }

      const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
      photoUrl = urlData.publicUrl
    }

    const row = {
      station_id: input.stationId,
      petrol: input.petrol ?? null,
      diesel: input.diesel ?? null,
      premium_petrol: input.premiumPetrol ?? null,
      premium_diesel: input.premiumDiesel ?? null,
      photo_url: photoUrl,
    }

    // Supabase client has no generated types for price_reports; row shape matches table
    const { data: insertData, error: insertError } = await supabase
      .from('price_reports')
      .insert(row as never)
      .select('id, reported_at')
      .single()

    if (insertError) {
      return { ok: false, error: insertError.message }
    }

    const inserted = insertData as { id: string; reported_at: string }
    const report: PriceReport = {
      id: inserted.id,
      stationId: input.stationId,
      petrol: input.petrol,
      diesel: input.diesel,
      premiumPetrol: input.premiumPetrol,
      premiumDiesel: input.premiumDiesel,
      photoUrl,
      reportedAt: inserted.reported_at,
    }
    return { ok: true, report }
  }

  // Demo: store in localStorage; we can't persist the image, but record if they added one so badge shows "Photo confirmed"
  const report: PriceReport = {
    id: crypto.randomUUID(),
    stationId: input.stationId,
    petrol: input.petrol,
    diesel: input.diesel,
    premiumPetrol: input.premiumPetrol,
    premiumDiesel: input.premiumDiesel,
    photoUrl: input.photoFile ? 'demo' : null,
    reportedAt: new Date().toISOString(),
  }
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    const arr = raw ? (JSON.parse(raw) as PriceReport[]) : []
    arr.unshift(report)
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(arr))
  } catch (e) {
    return { ok: false, error: 'Failed to save report locally.' }
  }
  return { ok: true, report }
}

/** Get a signed URL for displaying a Supabase storage photo (avoids CORS/referrer issues with public URL). */
export async function getSignedPhotoUrl(photoUrl: string | null): Promise<string | null> {
  if (!photoUrl || !photoUrl.startsWith('http') || !isSupabaseConfigured || !supabase) return photoUrl
  // Prefer exact prefix match; fallback to regex so we still work if origin differs slightly
  let path: string | null = null
  if (VITE_SUPABASE_URL && photoUrl.startsWith(PUBLIC_URL_PREFIX)) {
    path = photoUrl.slice(PUBLIC_URL_PREFIX.length).split('?')[0].trim()
  } else {
    const match = photoUrl.match(PUBLIC_URL_REGEX)
    if (match) {
      try {
        path = decodeURIComponent(match[1].trim())
      } catch {
        path = match[1].trim()
      }
    }
  }
  if (!path) return photoUrl
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 3600)
  if (error) {
    console.warn('getSignedPhotoUrl', error)
    return photoUrl
  }
  return data?.signedUrl ?? photoUrl
}
