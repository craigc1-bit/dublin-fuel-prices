#!/usr/bin/env node
/**
 * Apply geocoded results to dublinStations.ts
 * Run after: node scripts/geocode-stations.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const geocodedPath = join(ROOT, 'src/data/dublinStations.geocoded.json')
try {
  readFileSync(geocodedPath, 'utf-8')
} catch (e) {
  if (e.code === 'ENOENT') {
    console.error('No geocoded file found. Run: node scripts/geocode-stations.mjs first.')
    process.exit(1)
  }
  throw e
}

const geocoded = JSON.parse(readFileSync(geocodedPath, 'utf-8'))

let ts = readFileSync(join(ROOT, 'src/data/dublinStations.ts'), 'utf-8')

function escapeTs(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

// Replace by whole line so addresses containing ")" (e.g. "Dublin Bound)") don't break the regex
const lines = ts.split('\n')
for (const s of geocoded) {
  const newLat = typeof s.lat === 'number' ? s.lat.toFixed(6) : s.lat
  const newLng = typeof s.lng === 'number' ? s.lng.toFixed(6) : s.lng
  const newAddress = (s.address && String(s.address).trim()) || (s.addressResolved || '').split(', ').slice(0, 3).join(', ')
  const newLine = `station('${s.id}', '${escapeTs(s.name)}', '${escapeTs(s.brand)}', '${escapeTs(newAddress)}', '${escapeTs(s.area)}', ${newLat}, ${newLng})`
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*station\s*\(\s*'(\d+)'/)
    if (m && m[1] === s.id) {
      const indent = lines[i].slice(0, lines[i].indexOf('station'))
      lines[i] = indent + newLine
      break
    }
  }
}
ts = lines.join('\n')

writeFileSync(join(ROOT, 'src/data/dublinStations.ts'), ts)
console.log('Updated dublinStations.ts with geocoded coordinates and addresses')
