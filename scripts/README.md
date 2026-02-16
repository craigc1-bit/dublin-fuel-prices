# Scripts

## Fixing station addresses and map positions

Station data is in `src/data/dublinStations.ts`. **Addresses** are kept as full street addresses (not overwritten by geocoding). **Coordinates** come from Open-Meteo (area-level) or, for best accuracy, from Fuelo.net.

### Best accuracy: Fuelo coordinates (exact per-station)

From the project root, with network:

```bash
node scripts/fetch-fuelo-coords.mjs   # ~2 min, 1 request/sec; writes src/data/fuelo-coords.json
node scripts/merge-fuelo-coords.mjs   # merges Fuelo coords into geocoded JSON
node scripts/apply-geocoded.mjs       # updates dublinStations.ts
```

`fetch-fuelo-coords.mjs` scrapes each [Fuelo Dublin province](https://ie.fuelo.net/gasstations/province/753?lang=en) station page for the "Nearby" link coordinates. `apply-geocoded.mjs` preserves original **addresses** and only updates coordinates (and uses whatever is in the geocoded file, including Fuelo data after merge).

### Fallback: Geocode with Open-Meteo (area-level only)

If you don't run the Fuelo scripts, you can still use area-level coordinates:

```bash
node scripts/geocode-stations.mjs     # writes src/data/dublinStations.geocoded.json
node scripts/apply-geocoded.mjs       # updates dublinStations.ts (keeps original addresses)
```

### Manual updates

Edit `src/data/dublinStations.ts` and update any `station(id, name, brand, address, area, lat, lng)` with:

- **address**: Full street and area, e.g. `"Donnybrook Road, Donnybrook, Dublin 4"`.
- **lat, lng**: From Google Maps or [Fuelo station page](https://ie.fuelo.net/gasstation/id/63005?lang=en) ("Nearby" link URL).
