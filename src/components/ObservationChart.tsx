import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { formatContribution, formatDate, formatNumber, formatShortDate } from '../format'
import { comparisonTolerance } from '../domain/evidence'
import type { Comparison, Scenario } from '../data/scenario'

type Event = Comparison['events'][number]

function timeTicks(events: readonly Event[]) {
  return events.flatMap(({ dateIso }, index) => {
    const isFirstOfMonth = dateIso.endsWith('-01')
    return isFirstOfMonth || index === events.length - 1 ? [index] : []
  })
}

export function ObservationChart({ events, scenario, selected, topEvents, onDateSelect }: {
  events: readonly Event[]
  scenario: Scenario
  selected: Event
  topEvents: readonly Event[]
  onDateSelect: (date: string) => void
}) {
  const selectedIndex = events.indexOf(selected)
  const chart = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(720)

  useEffect(() => {
    const element = chart.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(200, Math.round(entry.contentRect.width))))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const compact = width < 490
  const left = compact ? 31 : 42
  const right = width - 12
  const step = (right - left) / events.length
  const x = (index: number) => left + (index + 0.5) * step
  const maxRain = Math.max(25, Math.ceil(Math.max(...events.map(({ rainMm }) => rainMm)) / 25) * 25)
  const rainBottom = 152
  const coverBottom = 300
  const rainY = (rain: number) => rainBottom - (rain / maxRain) * 112
  const coverY = (fraction: number) => coverBottom - fraction * 112
  const coverPoints = (key: 'earlyCover' | 'lateCover') => events
    .map((event, index) => `${x(index)},${coverY(event[key])}`).join(' ')
  const contributionDirection = Math.abs(selected.contribution) <= comparisonTolerance ? 'No material difference on this day'
    : selected.contribution < 0 ? 'Lower exposure for later return on this day' : 'Lower exposure for earlier return on this day'
  const setDay = (index: number) => onDateSelect(events[index].dateIso)

  return (
    <div className="chart-layout">
      <div className="day-control">
        <button type="button" aria-label="Previous UTC day" disabled={selectedIndex === 0} onClick={() => setDay(selectedIndex - 1)}>
          <ChevronLeft size={17} aria-hidden="true" />
        </button>
        <label><span className="sr-only">Inspect UTC date</span>
          <select value={selected.dateIso} onChange={(event) => onDateSelect(event.currentTarget.value)}>
            {events.map(({ dateIso }) => <option key={dateIso} value={dateIso}>{formatShortDate(dateIso)} {dateIso.slice(0, 4)}</option>)}
          </select>
        </label>
        <button type="button" aria-label="Next UTC day" disabled={selectedIndex === events.length - 1} onClick={() => setDay(selectedIndex + 1)}>
          <ChevronRight size={17} aria-hidden="true" />
        </button>
      </div>
      <aside className="day-evidence" aria-label="Daily evidence">
        <div aria-live="polite">
          <h3>{formatDate(selected.dateIso)} <span>UTC</span></h3>
          <dl>
            <div><dt>Rainfall</dt><dd>{formatNumber(selected.rainMm)} mm</dd></div>
            <div><dt>Earlier cover</dt><dd>{(selected.earlyCover * 100).toFixed(1)}%</dd></div>
            <div><dt>Later cover</dt><dd>{(selected.lateCover * 100).toFixed(1)}%</dd></div>
            <div className="event-contribution"><dt>Contribution to later minus earlier</dt><dd>{formatContribution(selected.contribution)} mm-equivalent</dd></div>
          </dl>
          <p className="day-interpretation">{contributionDirection}.</p>
        </div>
      </aside>
      <div className="chart-main">
        <ul className="chart-legend" aria-label="Chart legend">
          <li><i className="legend-rain" />NASA rainfall estimate</li>
          <li><i className="legend-early" />Earlier · {formatShortDate(scenario.earlyDate)}</li>
          <li><i className="legend-late" />Later · {formatShortDate(scenario.lateDate)}</li>
          <li><i className="legend-selected" />Selected day</li>
        </ul>
        <div ref={chart} className="timeline-plot">
          <svg width={width} height="328" viewBox={`0 0 ${width} 328`} role="img" aria-labelledby="plot-title plot-description">
            <title id="plot-title">Daily rainfall and illustrative cover trajectories</title>
            <desc id="plot-description">Rainfall bars in millimetres above two cover lines in percent. Vertical lines mark residue-return dates and the selected date. The date control and daily data table provide the same evidence.</desc>
            <text className="plot-axis-title" x={left} y="20">Daily rainfall (mm)</text>
            <text className="plot-axis-title" x={left} y="178">Modelled ground cover (%)</text>
            {[0, maxRain / 2, maxRain].map((tick) => (
              <g key={tick}>
                <path d={`M ${left} ${rainY(tick)} H ${right}`} className="plot-grid" />
                <text className="plot-tick" x={left - 6} y={rainY(tick) + 4} textAnchor="end">{tick}</text>
              </g>
            ))}
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
              <g key={tick}>
                <path d={`M ${left} ${coverY(tick)} H ${right}`} className="plot-grid" />
                <text className="plot-tick" x={left - 6} y={coverY(tick) + 4} textAnchor="end">{tick * 100}</text>
              </g>
            ))}
            {timeTicks(events).map((index) => (
              <g key={events[index].dateIso}>
                <path d={`M ${x(index)} 40 V ${rainBottom} M ${x(index)} 188 V ${coverBottom}`} className="plot-grid" />
                <text className="plot-tick" x={x(index)} y="320" textAnchor={index === 0 ? 'start' : compact || index === events.length - 1 ? 'end' : 'middle'}>
                  {formatShortDate(events[index].dateIso)}
                </text>
              </g>
            ))}
            <rect x={x(selectedIndex) - Math.max(step / 2, 2)} y="39" width={Math.max(step, 4)} height={coverBottom - 39} className="plot-selection" />
            {events.map((event, index) => (
              <rect key={event.dateIso} x={x(index) - step * .36} y={rainY(event.rainMm)} width={step * .72}
                height={rainBottom - rainY(event.rainMm)} className={event === selected ? 'plot-rain plot-rain-selected' : 'plot-rain'} />
            ))}
            {[scenario.earlyDate, scenario.lateDate].map((date, index) => (
              <line key={index} x1={x(events.findIndex((event) => event.dateIso === date))} y1="40"
                x2={x(events.findIndex((event) => event.dateIso === date))} y2={coverBottom}
                className={index === 0 ? 'plot-return plot-early' : 'plot-return plot-late'} />
            ))}
            <line x1={x(selectedIndex)} x2={x(selectedIndex)} y1="39" y2={coverBottom} className="plot-cursor" />
            <polyline points={coverPoints('earlyCover')} className="plot-cover plot-early" />
            <polyline points={coverPoints('lateCover')} className="plot-cover plot-late" />
            <circle cx={x(selectedIndex)} cy={coverY(selected.earlyCover)} r="3.5" className="plot-dot plot-early" />
            <circle cx={x(selectedIndex)} cy={coverY(selected.lateCover)} r="3.5" className="plot-dot plot-late" />
            <rect className="plot-hit" x={left} y="39" width={right - left} height={coverBottom - 39} fill="transparent"
              onClick={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect()
                const index = Math.floor(((event.clientX - bounds.left) / bounds.width) * events.length)
                setDay(Math.max(0, Math.min(index, events.length - 1)))
              }} />
          </svg>
        </div>
      </div>
      {topEvents.length > 0 && (
        <div className="event-list">
          <h3>Largest contributions</h3>
          <ul>
            {topEvents.map((event) => (
              <li key={event.dateIso}>
                <button type="button" aria-pressed={event === selected} onClick={() => onDateSelect(event.dateIso)}>
                  <span>{formatShortDate(event.dateIso)}</span><strong>{formatContribution(event.contribution)}</strong>
                </button>
              </li>
            ))}
          </ul>
          <p className="muted">Select a day · mm-equivalent, ranked by magnitude</p>
        </div>
      )}
    </div>
  )
}

export function ObservationDailyTable({ events, selectedDate, onDateSelect }: {
  events: readonly Event[]
  selectedDate: string
  onDateSelect: (date: string) => void
}) {
  return (
    <details className="daily-data">
      <summary>View all {events.length} days as a table</summary>
      <div className="table-scroll" role="region" aria-label="Scrollable daily evidence" tabIndex={0}>
        <table className="data-table">
          <caption className="sr-only">Daily NASA rainfall and illustrative ground cover</caption>
          <thead><tr><th scope="col">Date (UTC)</th><th scope="col">Rainfall (mm)</th><th scope="col">Earlier cover (%)</th><th scope="col">Later cover (%)</th><th scope="col">Contribution (mm-equivalent)</th></tr></thead>
          <tbody>{events.map((event) => (
            <tr key={event.dateIso} className={event.dateIso === selectedDate ? 'selected-row' : undefined}>
              <th scope="row"><button type="button" aria-pressed={event.dateIso === selectedDate}
                onClick={() => onDateSelect(event.dateIso)}>{event.dateIso}</button></th><td>{formatNumber(event.rainMm)}</td>
              <td>{(event.earlyCover * 100).toFixed(2)}</td><td>{(event.lateCover * 100).toFixed(2)}</td>
              <td>{formatContribution(event.contribution)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </details>
  )
}
