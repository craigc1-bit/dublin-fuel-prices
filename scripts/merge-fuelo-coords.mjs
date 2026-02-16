#!/usr/bin/env node
/**
 * Merge Fuelo exact coordinates into dublinStations.geocoded.json.
 * Run after: node scripts/fetch-fuelo-coords.mjs
 * Updates geocoded file in place; then run: node scripts/apply-geocoded.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const geocodedPath = join(ROOT, 'src/data/dublinStations.geocoded.json')
const fueloPath = join(ROOT, 'src/data/fuelo-coords.json')

let geocoded, fuelo
try {
  geocoded = JSON.parse(readFileSync(geocodedPath, 'utf-8'))
} catch (e) {
  if (e.code === 'ENOENT') {
    console.error('No dublinStations.geocoded.json. Run: node scripts/geocode-stations.mjs first.')
    process.exit(1)
  }
  throw e
}
try {
  fuelo = JSON.parse(readFileSync(fueloPath, 'utf-8'))
} catch (e) {
  if (e.code === 'ENOENT') {
    console.error('No fuelo-coords.json. Run: node scripts/fetch-fuelo-coords.mjs first.')
    process.exit(1)
  }
  throw e
}

if (geocoded.length !== fuelo.length) {
  console.warn(`Length mismatch: geocoded ${geocoded.length}, fuelo ${fuelo.length}. Using min length.`)
}

let updated = 0
for (let i = 0; i < Math.min(geocoded.length, fuelo.length); i++) {
  const f = fuelo[i]
  if (f != null && typeof f.lat === 'number' && typeof f.lng === 'number') {
    geocoded[i].lat = f.lat
    geocoded[i].lng = f.lng
    updated++
  }
}

writeFileSync(geocodedPath, JSON.stringify(geocoded, null, 2))
console.log(`Merged Fuelo coordinates: ${updated}/${geocoded.length} stations updated.`)
console.log('Run: node scripts/apply-geocoded.mjs to update dublinStations.ts')
