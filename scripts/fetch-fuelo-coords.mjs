#!/usr/bin/env node
/**
 * Fetch exact coordinates from Fuelo.net station pages (Dublin province 753).
 * Each station page has a "Nearby" link: /gasstations/bycoords/lat/lng
 * Run: node scripts/fetch-fuelo-coords.mjs
 * Writes src/data/fuelo-coords.json (array in same order as dublinStations).
 * Then run: node scripts/merge-fuelo-coords.mjs && node scripts/apply-geocoded.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const PROVINCE_URL = 'https://ie.fuelo.net/gasstations/province/753?lang=en'
const ID_RE = /gasstation\/id\/(\d+)/g
const COORDS_RE = /bycoords\/([0-9.]+)\/([-0-9.]+)/

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { Accept: 'text/html', 'User-Agent': 'DublinFuelPrices/1.0' },
  })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.text()
}

const provinceHtml = await fetchText(PROVINCE_URL)
const fueloIds = [...provinceHtml.matchAll(ID_RE)].map((m) => m[1])
const uniqueIds = [...new Set(fueloIds)]
console.log(`Found ${uniqueIds.length} stations on Fuelo province page. Fetching coordinates (1/sec)...`)

const results = []
for (let i = 0; i < uniqueIds.length; i++) {
  const fid = uniqueIds[i]
  try {
    const html = await fetchText(`https://ie.fuelo.net/gasstation/id/${fid}?lang=en`)
    const m = html.match(COORDS_RE)
    if (m) {
      const lat = parseFloat(m[1])
      const lng = parseFloat(m[2])
      results.push({ fueloId: fid, lat, lng })
      console.log(`[${i + 1}/${uniqueIds.length}] ${fid} -> ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } else {
      results.push({ fueloId: fid, lat: null, lng: null })
      console.log(`[${i + 1}/${uniqueIds.length}] ${fid} -> no coords on page`)
    }
  } catch (err) {
    results.push({ fueloId: fid, lat: null, lng: null })
    console.warn(`[${i + 1}/${uniqueIds.length}] ${fid} -> ${err.message}`)
  }
  await new Promise((r) => setTimeout(r, 1100))
}

const outPath = join(ROOT, 'src/data/fuelo-coords.json')
writeFileSync(outPath, JSON.stringify(results, null, 2))
console.log(`Wrote ${outPath}`)
console.log('Next: node scripts/merge-fuelo-coords.mjs && node scripts/apply-geocoded.mjs')
