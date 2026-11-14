import { formatNumber, formatSigned } from '../format'
import { compareScenario, type Scenario } from '../data/scenario'
import { historicalRainfall } from '../data/historicalRainfall'
import { imergLabel, imergRainfall } from '../data/imergRainfall'
import { referenceYear } from '../data/researchReference'

export function RainfallSourceComparison({ scenario, year }: { scenario: Scenario; year: number }) {
  if (year !== referenceYear || !historicalRainfall.provenance || !imergRainfall.days) return null
  const power = compareScenario(scenario, year).comparison
  const imerg = compareScenario(scenario, year, 'imerg').comparison
  if (!power || !imerg) return null

  const measures = [
    ['Total precipitation', 'mm', formatNumber(power.totalRainMm), formatNumber(imerg.totalRainMm)],
    ['Earlier exposure', 'mm-equivalent', formatNumber(power.early.dailyExposure), formatNumber(imerg.early.dailyExposure)],
    ['Later exposure', 'mm-equivalent', formatNumber(power.late.dailyExposure), formatNumber(imerg.late.dailyExposure)],
    ['Later minus earlier', 'mm-equivalent', formatSigned(power.dailyDifference), formatSigned(imerg.dailyDifference)],
  ]

  return (
    <section className="workspace-panel baseline-panel" aria-labelledby="source-comparison-title">
      <div className="baseline-heading">
        <h2 id="source-comparison-title">POWER and IMERG comparison</h2>
        <p className="muted">Both calculations use the same 76 UTC days, return dates and ground-cover assumptions. POWER is based on MERRA-2 reanalysis. IMERG combines satellite precipitation retrievals with gauge adjustment on a different grid.</p>
      </div>
      <table className="comparison-table">
        <thead><tr><th scope="col">Measure</th><th scope="col">NASA POWER</th><th scope="col">{imergLabel}</th></tr></thead>
        <tbody>
          {measures.map(([label, units, powerValue, imergValue]) => (
            <tr key={label}><th scope="row">{label} <small>{units}</small></th><td>{powerValue}</td><td>{imergValue}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
