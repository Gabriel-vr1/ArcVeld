import { useId, useState } from 'react'
import type { Comparison, Scenario } from '../data/scenario'
import { formatDate, formatNumber, formatShortDate, formatWindow } from '../format'

const lanes = [
  { label: 'Earlier return', dateKey: 'earlyDate', coverKey: 'earlyCover', className: 'schedule-early' },
  { label: 'Later return', dateKey: 'lateDate', coverKey: 'lateCover', className: 'schedule-late' },
] as const

const plotHeight = 80

export function PlannerTimeline({ comparison, scenario, sourceLabel }: {
  comparison: Comparison
  scenario: Scenario
  sourceLabel: string
}) {
  const title = useId()
  const [selectedDate, setSelectedDate] = useState('')
  const { events } = comparison
  const first = events[0]
  const last = events[events.length - 1]
  const peak = events.reduce((wettest, day) => day.rainMm > wettest.rainMm ? day : wettest)
  const selected = events.find(({ dateIso }) => dateIso === selectedDate) ?? peak
  const rainfallMax = Math.max(10, Math.ceil(peak.rainMm / 10) * 10)
  const plotWidth = events.length * 6
  const baselineY = plotHeight * (1 - Number(scenario.baselinePercent) / 100)
  const x = (index: number) => index * 6 + 3
  const y = (ratio: number) => plotHeight * (1 - ratio)
  const selectedX = x(events.indexOf(selected))
  const viewBox = `0 0 ${plotWidth} ${plotHeight}`
  const grid = `M0 .5H${plotWidth} M0 ${plotHeight / 2}H${plotWidth} M0 ${plotHeight - .5}H${plotWidth}`

  return (
    <figure className="planner-timeline" aria-labelledby={title}>
      <figcaption id={title}>Season timeline</figcaption>
      <p>{formatWindow({ startIso: first.dateIso, endIso: last.dateIso })} · {events.length} days UTC</p>
      <div className="schedule-lanes">
        <div className="schedule-lane schedule-rainfall">
          <div className="schedule-label"><strong>Historical rainfall (mm)</strong><span>{sourceLabel}</span></div>
          <div className="schedule-plot">
            <div className="schedule-scale" aria-hidden="true"><span>{rainfallMax}</span><span>{rainfallMax / 2}</span><span>0</span></div>
            <svg viewBox={viewBox} preserveAspectRatio="none" aria-hidden="true">
              <path className="schedule-grid" d={grid} />
              {events.map(({ dateIso, rainMm }, index) => (
                <rect key={dateIso} className={dateIso === selected.dateIso ? 'schedule-rain-selected' : 'schedule-rain-bar'}
                  x={x(index) - 2} y={y(rainMm / rainfallMax)} width="4" height={plotHeight * rainMm / rainfallMax} />
              ))}
              <path className="schedule-guide" d={`M${selectedX} 0V${plotHeight}`} />
            </svg>
          </div>
        </div>
        <p className="schedule-cover-label">Modelled ground cover (%) · illustrative assumptions</p>
        {lanes.map(({ label, dateKey, coverKey, className }) => {
          const date = scenario[dateKey]
          const returnX = x(events.findIndex((event) => event.dateIso === date))
          const points = events.map((event, index) => `${x(index)},${y(event[coverKey])}`).join(' ')
          return (
            <div className={`schedule-lane ${className}`} key={dateKey} data-return-date={date}>
              <div className="schedule-label"><strong>{label}</strong><time dateTime={date}>{formatShortDate(date)} · UTC</time></div>
              <div className="schedule-plot">
                <div className="schedule-scale" aria-hidden="true"><span>100</span><span>50</span><span>0</span></div>
                <svg viewBox={viewBox} preserveAspectRatio="none" aria-hidden="true">
                  <path className="schedule-grid" d={grid} />
                  <polygon className="schedule-fill" points={`3,${baselineY} ${points} ${plotWidth - 3},${baselineY}`} />
                  <path className="schedule-guide" d={`M${selectedX} 0V${plotHeight}`} />
                  <polyline className="schedule-cover" points={points} />
                  <path className="schedule-return" d={`M${returnX} 0V${plotHeight}`} />
                </svg>
              </div>
            </div>
          )
        })}
        <div className="schedule-axis" aria-hidden="true">
          <span>{formatShortDate(first.dateIso)}</span>
          {events.map(({ dateIso }, index) => index > 0 && dateIso.endsWith('-01') && (
            <span key={dateIso} className="schedule-month" style={{ left: `${100 * x(index) / plotWidth}%` }}>
              {formatShortDate(dateIso)}
            </span>
          ))}
          <span>{formatShortDate(last.dateIso)}</span>
        </div>
      </div>
      <div className="schedule-inspection">
        <label className="page-context season-select">
          Inspect a day (UTC)
          <select value={selected.dateIso} onChange={(event) => setSelectedDate(event.currentTarget.value)}>
            {events.map(({ dateIso }) => (
              <option key={dateIso} value={dateIso}>{formatDate(dateIso)}{dateIso === peak.dateIso ? ' · wettest' : ''}</option>
            ))}
          </select>
        </label>
        <dl aria-live="polite" className="schedule-reading">
          <div><dt>Rainfall</dt><dd>{formatNumber(selected.rainMm)} mm</dd></div>
          <div><dt>Earlier cover</dt><dd>{(selected.earlyCover * 100).toFixed(1)}%</dd></div>
          <div><dt>Later cover</dt><dd>{(selected.lateCover * 100).toFixed(1)}%</dd></div>
        </dl>
      </div>
    </figure>
  )
}
