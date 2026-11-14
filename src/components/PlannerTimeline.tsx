import { useId } from 'react'
import type { Comparison, Scenario } from '../data/scenario'
import { formatShortDate } from '../format'

const lanes = [
  { label: 'Earlier return', dateKey: 'earlyDate', coverKey: 'earlyCover', className: 'schedule-early' },
  { label: 'Later return', dateKey: 'lateDate', coverKey: 'lateCover', className: 'schedule-late' },
] as const

export function PlannerTimeline({ comparison, scenario }: { comparison: Comparison; scenario: Scenario }) {
  const title = useId()
  const events = comparison.events
  const plotWidth = events.length * 6
  const baseline = Number(scenario.baselinePercent) / 100
  const plotHeight = 42

  return (
    <figure className="planner-timeline" aria-labelledby={title}>
      <figcaption id={title}>Estimated cover by return date</figcaption>
      <p>Estimated cover on a 0–100% scale. Fill shows added cover.</p>
      <div className="schedule-lanes">
        {lanes.map(({ label, dateKey, coverKey, className }) => {
          const date = scenario[dateKey]
          const returnIndex = events.findIndex((event) => event.dateIso === date)
          const returnX = returnIndex * 6 + 3
          const points = events.map((event, index) => {
            const height = event[coverKey] * (plotHeight - 4)
            return `${index * 6 + 3},${plotHeight - height}`
          })
          const baselineY = plotHeight - baseline * (plotHeight - 4)
          return (
            <div className={`schedule-lane ${className}`} key={dateKey} data-return-date={date}>
              <div className="schedule-label"><strong>{label}</strong><time dateTime={date}>{formatShortDate(date)} · UTC</time></div>
              <svg viewBox={`0 0 ${plotWidth} ${plotHeight}`} preserveAspectRatio="none" aria-hidden="true">
                <path className="schedule-grid" d={`M0 ${baselineY}H${plotWidth} M0 ${plotHeight - .5}H${plotWidth}`} />
                <polygon className="schedule-fill" points={`3,${baselineY} ${points.join(' ')} ${plotWidth - 3},${baselineY}`} />
                <polyline className="schedule-cover" points={points.join(' ')} />
                <path className="schedule-return" d={`M${returnX} 2V${plotHeight}`} />
              </svg>
            </div>
          )
        })}
      </div>
      <div className="schedule-axis"><span>{formatShortDate(events[0].dateIso)}</span><span>{formatShortDate(events[events.length - 1].dateIso)}</span></div>
    </figure>
  )
}
