import { historicalRainfall, seasonLabel } from '../data/historicalRainfall'

export interface HistoricalSeasonSelection {
  year: number
  onChange: (year: number) => void
}

export function HistoricalSeasonSelect({ year, onChange }: HistoricalSeasonSelection) {
  if (historicalRainfall.seasons.length < 2) return null
  return (
    <label className="page-context season-select">
      Historical season
      <select value={year} onChange={(event) => onChange(Number(event.currentTarget.value))}>
        {[...historicalRainfall.seasons].reverse().map(({ startYear }) => (
          <option key={startYear} value={startYear}>{seasonLabel(startYear)}</option>
        ))}
      </select>
    </label>
  )
}
