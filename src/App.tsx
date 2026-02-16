import { useMemo, useState, useEffect, useCallback } from 'react'
import type { FuelType } from './types'
import { dublinStations } from './data/dublinStations'
import { StationCard } from './StationCard'
import { ReportPriceModal } from './ReportPriceModal'
import { fuelLabels } from './fuelLabels'
import { getLatestReports } from './api/reports'
import { StationMap } from './StationMap'
import './App.css'

type SortBy = 'name' | 'petrol' | 'diesel' | 'area'
type ViewMode = 'list' | 'map'

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [fuelFilter, setFuelFilter] = useState<FuelType | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortBy>('petrol')
  const [areaFilter, setAreaFilter] = useState<string>('')
  const [brandFilter, setBrandFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [mapCenterStationId, setMapCenterStationId] = useState<string | null>(null)
  const [reportsByStation, setReportsByStation] = useState<Record<string, import('./types').PriceReport>>({})
  const [reportModalStation, setReportModalStation] = useState<import('./types').FuelStation | null | undefined>(null)

  const refreshReports = useCallback(async () => {
    const reports = await getLatestReports()
    setReportsByStation(reports)
  }, [])

  useEffect(() => {
    refreshReports()
  }, [refreshReports])

  const areas = useMemo(() => {
    const set = new Set(dublinStations.map((s) => s.area))
    return Array.from(set).sort()
  }, [])

  const brands = useMemo(() => {
    const set = new Set(dublinStations.map((s) => s.brand))
    return Array.from(set).sort()
  }, [])

  const filteredAndSorted = useMemo(() => {
    let list = [...dublinStations]

    if (areaFilter) {
      list = list.filter((s) => s.area === areaFilter)
    }

    if (brandFilter) {
      list = list.filter((s) => s.brand === brandFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.area.toLowerCase().includes(q) ||
          s.brand.toLowerCase().includes(q)
      )
    }

    if (fuelFilter !== 'all') {
      list = list.filter((s) => {
        const report = reportsByStation[s.id]
        const prices = report ? { petrol: report.petrol, diesel: report.diesel, premiumPetrol: report.premiumPetrol, premiumDiesel: report.premiumDiesel } : s.prices
        return prices[fuelFilter] != null
      })
    }

    list.sort((a, b) => {
      const pricesA = reportsByStation[a.id] ?? a.prices
      const pricesB = reportsByStation[b.id] ?? b.prices
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'area') return a.area.localeCompare(b.area)
      if (sortBy === 'petrol') {
        const pa = pricesA.petrol ?? Infinity
        const pb = pricesB.petrol ?? Infinity
        return pa - pb
      }
      if (sortBy === 'diesel') {
        const da = pricesA.diesel ?? Infinity
        const db = pricesB.diesel ?? Infinity
        return da - db
      }
      return 0
    })

    return list
  }, [fuelFilter, sortBy, areaFilter, brandFilter, searchQuery, reportsByStation])

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="header-top">
            <div>
              <h1 className="title">
                <span className="title-icon" aria-hidden>⛽</span>
                Dublin Fuel Prices
              </h1>
              <p className="subtitle">Community-reported prices — report what you see; add a photo when you can so others can verify</p>
            </div>
            <button
              type="button"
              className="header-report-btn"
              onClick={() => setReportModalStation(undefined)}
            >
              Report a price
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <aside className="filters">
          <div className="filter-group view-toggle-group">
            <label>View</label>
            <div className="view-toggle" role="tablist" aria-label="View mode">
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'list'}
                className={viewMode === 'list' ? 'view-toggle-btn is-active' : 'view-toggle-btn'}
                onClick={() => setViewMode('list')}
              >
                List
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'map'}
                className={viewMode === 'map' ? 'view-toggle-btn is-active' : 'view-toggle-btn'}
                onClick={() => setViewMode('map')}
              >
                Map
              </button>
            </div>
          </div>
          <div className="filter-group">
            <label htmlFor="search">Search</label>
            <input
              id="search"
              type="search"
              placeholder="Name, address, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-search"
              aria-label="Search stations by name, address or area"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="brand">Brand</label>
            <select
              id="brand"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
            >
              <option value="">All brands</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="fuel">Fuel type</label>
            <select
              id="fuel"
              value={fuelFilter}
              onChange={(e) => setFuelFilter(e.target.value as FuelType | 'all')}
            >
              <option value="all">All</option>
              {Object.entries(fuelLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="area">Area</label>
            <select
              id="area"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
            >
              <option value="">All areas</option>
              {areas.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="sort">Sort by</label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
            >
              <option value="petrol">Cheapest petrol</option>
              <option value="diesel">Cheapest diesel</option>
              <option value="name">Name</option>
              <option value="area">Area</option>
            </select>
          </div>
        </aside>

        <section className={`stations ${viewMode === 'map' ? 'is-map' : ''}`} aria-label="Fuel stations">
          {viewMode === 'map' ? (
            filteredAndSorted.length === 0 ? (
              <p className="empty">No stations match the current filters.</p>
            ) : (
              <StationMap
                stations={filteredAndSorted}
                reportsByStation={reportsByStation}
                centerStationId={mapCenterStationId}
                onCenterUsed={() => setMapCenterStationId(null)}
                onReportClick={(station) => setReportModalStation(station)}
              />
            )
          ) : filteredAndSorted.length === 0 ? (
            <p className="empty">No stations match the current filters.</p>
          ) : (
            <ul className="station-list">
              {filteredAndSorted.map((station) => (
                <li key={station.id}>
                  <StationCard
                    station={station}
                    highlightFuel={fuelFilter !== 'all' ? fuelFilter : undefined}
                    report={reportsByStation[station.id]}
                    onReportClick={() => setReportModalStation(station)}
                    onShowOnMap={() => {
                      setMapCenterStationId(station.id)
                      setViewMode('map')
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {reportModalStation !== null && (
        <ReportPriceModal
          station={typeof reportModalStation === 'object' ? reportModalStation : null}
          stations={dublinStations}
          onClose={() => setReportModalStation(null)}
          onSuccess={refreshReports}
        />
      )}

      <footer className="footer">
        <p>Base station list is sample data. Prices can be updated by users with photo confirmation. For more stations see <a href="https://pumps.ie" target="_blank" rel="noopener noreferrer">Pumps.ie</a> or <a href="https://petrolprices.ie" target="_blank" rel="noopener noreferrer">PetrolPrices.ie</a>.</p>
      </footer>
    </div>
  )
}

export default App
