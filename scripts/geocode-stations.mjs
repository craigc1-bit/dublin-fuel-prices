#!/usr/bin/env node
/**
 * Geocode Dublin fuel stations using Open-Meteo Geocoding API (free, no key).
 * Run: node scripts/geocode-stations.mjs
 * Respects 1 req/sec. Writes src/data/dublinStations.geocoded.json
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Load current stations from the TS file by parsing the station() calls
const tsPath = join(ROOT, 'src/data/dublinStations.ts')
let ts = readFileSync(tsPath, 'utf-8')

// Extract station(id, name, brand, address, area, lat, lng) - simple regex
const STATION_RE = /station\s*\(\s*'(\d+)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*([\d.]+),\s*([-\d.]+)\s*\)/g
const stations = []
let m
while ((m = STATION_RE.exec(ts)) !== null) {
  stations.push({
    id: m[1],
    name: m[2],
    brand: m[3],
    address: m[4],
    area: m[5],
    lat: parseFloat(m[6]),
    lng: parseFloat(m[7]),
  })
}

async function geocode(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&countryCode=IE`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const text = await res.text()
  if (!text.trim().startsWith('{')) {
    console.warn('  Geocoding API returned non-JSON. Skipping.')
    return null
  }
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (data.error || !data.results?.length) return null
  const r = data.results[0]
  const lat = parseFloat(r.latitude)
  const lng = parseFloat(r.longitude)
  // Reject results outside Greater Dublin (avoids wrong Goatstown/Ashtown elsewhere in Ireland)
  if (lat < 53.0 || lat > 54.0 || lng < -6.7 || lng > -6.0) return null
  const display = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
  return { lat, lng, display }
}

console.log(`Geocoding ${stations.length} stations (1 request/sec)...`)
const results = []

for (let i = 0; i < stations.length; i++) {
  const s = stations[i]
  // Open-Meteo matches single place names; compound queries often return no results
  let result = null
  try {
    result = await geocode(s.area)
    if (!result) {
      await new Promise((r) => setTimeout(r, 1100))
      result = await geocode('Dublin')
    }
  } catch (err) {
    console.warn(`[${i + 1}/${stations.length}] ${s.name} -> Error: ${err.message}`)
  }
  if (result) {
    results.push({
      ...s,
      lat: result.lat,
      lng: result.lng,
      addressResolved: result.display,
    })
    console.log(`[${i + 1}/${stations.length}] ${s.name} -> ${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}`)
  } else {
    results.push({ ...s, addressResolved: null })
    console.log(`[${i + 1}/${stations.length}] ${s.name} -> no result (kept original)`)
  }
  await new Promise((r) => setTimeout(r, 1100))
}

writeFileSync(join(ROOT, 'src/data/dublinStations.geocoded.json'), JSON.stringify(results, null, 2))
console.log('Wrote src/data/dublinStations.geocoded.json')
console.log('Run: node scripts/apply-geocoded.mjs to update dublinStations.ts')
