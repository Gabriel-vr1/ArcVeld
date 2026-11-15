import { imergLabel, imergRainfall } from '../data/imergRainfall'
import { referenceYear } from '../data/researchReference'
import type { RainfallSource } from '../data/scenario'

export interface RainfallSourceSelection {
  source: RainfallSource
  onSourceChange: (source: RainfallSource) => void
}

export function RainfallSourceSelect({ source, onSourceChange, year, compact = false }: RainfallSourceSelection & { year: number; compact?: boolean }) {
  const available = year === referenceYear && Boolean(imergRainfall.days)
  const option = available ? (compact ? 'GPM IMERG V07' : imergLabel)
    : imergRainfall.days ? (compact ? 'IMERG · 2022/23 only' : 'GPM IMERG · 2022/23 only')
      : 'GPM IMERG unavailable'
  return (
    <label className="page-context season-select">
      Rainfall source
      <select value={source} onChange={(event) => {
        onSourceChange(event.currentTarget.value === 'imerg' && available ? 'imerg' : 'power')
      }}>
        <option value="power">NASA POWER</option>
        <option value="imerg" disabled={!available}>{option}</option>
      </select>
    </label>
  )
}
