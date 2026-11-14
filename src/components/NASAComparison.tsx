import { ArrowUpRight, CalendarRange, CloudRain, Info } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { referenceWindow, referenceYear, researchReference, researchScenario } from '../data/researchReference'
import { makeCoverCurve } from '../domain/cover'
import { utcDayIndex } from '../domain/dates'
import { comparisonTolerance } from '../domain/evidence'
import { compareAgainstBaselines } from '../domain/exposure'
import { formatScientificClaim } from '../domain/scientificClaim'
import { Badge } from './ui/Badge'

const number = new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const signed = new Intl.NumberFormat('en', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero',
})
const signedEvent = new Intl.NumberFormat('en', { maximumFractionDigits: 4, signDisplay: 'exceptZero' })
const utcDate = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'long',
  timeZone: 'UTC',
})

type Comparison = ReturnType<typeof compareAgainstBaselines>

function compareDates(earlyDate: string, lateDate: string) {
  if (!researchReference.days) return { error: researchReference.error }
  const { startIso, endIso, dates } = referenceWindow
  if (!earlyDate || !lateDate) return { error: 'Enter both residue-return dates.' }
  if (earlyDate < startIso || earlyDate > endIso || lateDate < startIso || lateDate > endIso) {
    return { error: 'Enter both dates between 1 November 2022 and 15 January 2023 (UTC).' }
  }
  if (earlyDate > lateDate) return { error: 'The later return must be on or after the earlier return.' }

  const { baseCover, pulse } = researchScenario
  const coverForDate = (date: string) => makeCoverCurve({
    baseCover,
    residue: { ...pulse, startIndex: utcDayIndex(startIso, date) },
  }, dates.length)

  return {
    comparison: compareAgainstBaselines(researchReference.days, coverForDate(earlyDate), coverForDate(lateDate), referenceYear),
  }
}

function metricRow(label: string, early: string, late: string) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{early}</td>
      <td>{late}</td>
    </tr>
  )
}

function ComparisonTable({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <table className="comparison-table">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr><th scope="col">Metric</th><th scope="col">Earlier</th><th scope="col">Later</th></tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  )
}

function ComparisonResults({ comparison }: { comparison: Comparison }) {
  const { early, late, dailyDifference, totalRainMm, events } = comparison
  const biggestEvent = events.reduce((biggest, event) =>
    Math.abs(event.contribution) > Math.abs(biggest.contribution) ? event : biggest,
  )
  const claim = formatScientificClaim(comparison)

  return (
    <>
      <div className="analysis-grid">
        <article className="analysis-card">
          <span className="scenario-icon scenario-icon-green"><CalendarRange size={21} aria-hidden="true" /></span>
          <h3>Without daily NASA timing</h3>
          <p className="card-description">The calendar sums each day’s estimated uncovered fraction. The uniform baseline spreads the rainfall total evenly across all {events.length} days.</p>
          <ComparisonTable caption="Calendar and uniform-rainfall baselines">
            {metricRow('Uncovered area-days', early.uncoveredAreaDays.toFixed(3), late.uncoveredAreaDays.toFixed(3))}
            {metricRow('Uniform rain (mm-equivalent)', number.format(early.uniformExposure), number.format(late.uniformExposure))}
          </ComparisonTable>
        </article>
        <article className="analysis-card analysis-card-rain">
          <span className="scenario-icon scenario-icon-rain"><CloudRain size={21} aria-hidden="true" /></span>
          <h3>With historical NASA data</h3>
          <p className="card-description">{number.format(totalRainMm)} mm across {events.length} UTC days. Each day’s rain is weighted by its estimated uncovered fraction.</p>
          <ComparisonTable caption="Historical daily rainfall exposure">
            {metricRow('Daily exposure (mm-equivalent)', number.format(early.dailyExposure), number.format(late.dailyExposure))}
          </ComparisonTable>
          <p className="comparison-difference">
            Late minus early <strong>{signed.format(dailyDifference)} mm-equivalent</strong>
          </p>
        </article>
      </div>
      <div className="analysis-status">
        <Info size={19} className="status-icon" aria-hidden="true" />
        <div role="status">
          <p><strong>{claim.title}</strong> {claim.detail}</p>
        </div>
        <a className="text-link" href="#sources">See data provenance <ArrowUpRight size={15} aria-hidden="true" /></a>
      </div>
      {Math.abs(biggestEvent.contribution) > comparisonTolerance && (
        <p className="section-note">
          <strong>Largest daily contribution:</strong> {utcDate.format(new Date(biggestEvent.dateIso))} (UTC)
          {' · '}{number.format(biggestEvent.rainMm)} mm of rain
          {' · '}{signedEvent.format(biggestEvent.contribution)} mm-equivalent to the late-minus-early difference.
        </p>
      )}
    </>
  )
}

export function NASAComparison() {
  const [earlyDate, setEarlyDate] = useState<string>(researchScenario.earlyDate)
  const [lateDate, setLateDate] = useState<string>(researchScenario.lateDate)
  const { comparison, error } = compareDates(earlyDate, lateDate)

  return (
    <section id="nasa-analysis" aria-labelledby="nasa-title" className="analysis-section" tabIndex={-1}>
      <div className="page-width content-section">
        <div className="section-heading">
          <p className="eyebrow"><CloudRain size={17} aria-hidden="true" /> NASA analysis</p>
          <h2 id="nasa-title">When rain meets uncovered soil</h2>
          <p>1 November 2022–15 January 2023 (UTC) · Research-transcribed NASA POWER / MERRA-2 rainfall.</p>
        </div>

        <fieldset className="return-controls" aria-describedby="cover-assumptions">
          <legend>Illustrative residue return</legend>
          <label>
            Earlier return (UTC)
            <input type="date" min={referenceWindow.startIso} max={referenceWindow.endIso}
              value={earlyDate} onChange={(event) => setEarlyDate(event.currentTarget.value)} />
          </label>
          <label>
            Later return (UTC)
            <input type="date" min={referenceWindow.startIso} max={referenceWindow.endIso}
              value={lateDate} onChange={(event) => setLateDate(event.currentTarget.value)} />
          </label>
          <button className="action action-secondary" type="button" onClick={() => {
            setEarlyDate(researchScenario.earlyDate)
            setLateDate(researchScenario.lateDate)
          }}>Reset research dates</button>
          <p id="cover-assumptions" className="card-description">
            Both schedules assume {researchScenario.baseCover * 100}% baseline cover and {researchScenario.pulse.peak * 100} percentage points
            of added cover on return. Added cover stays at its peak through day {researchScenario.pulse.plateauDays} and falls to zero by day {researchScenario.pulse.durationDays}.
          </p>
        </fieldset>

        {comparison ? <ComparisonResults comparison={comparison} /> : (
          <div className="analysis-status" role="status">
            <Info size={19} className="status-icon" aria-hidden="true" />
            <div><Badge tone="rain">Analysis unavailable</Badge><p>{error}</p></div>
            <a className="text-link" href="#sources">See data provenance <ArrowUpRight size={15} aria-hidden="true" /></a>
          </div>
        )}
        <p className="section-note">
          These values are a historical exposure proxy for hypothetical cover. Erosion, runoff, crop yield,
          and next-season conditions are outside the scope of this calculation.
        </p>
      </div>
    </section>
  )
}
