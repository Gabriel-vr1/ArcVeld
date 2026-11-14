import { ArrowRight, CalendarDays, Leaf, Wheat } from 'lucide-react'
import { useRef, type Dispatch, type SetStateAction } from 'react'
import { referenceYear, type referenceWindow } from '../data/researchReference'
import { initialScenario, scenarioForSeason, type compareScenario, type Constraints, type Scenario } from '../data/scenario'
import { evaluateFeasibility } from '../domain/cover'
import { formatScientificClaim } from '../domain/scientificClaim'
import { formatNumber, formatSigned, formatWindow } from '../format'
import { routes } from '../navigation'
import { seasonLabel } from '../data/historicalRainfall'
import { HistoricalSeasonSelect, type HistoricalSeasonSelection } from './HistoricalSeasonSelect'
import { ButtonLink } from './ui/Button'
import { PlannerTimeline } from './PlannerTimeline'

interface PlannerProps {
  scenario: Scenario
  onScenarioChange: Dispatch<SetStateAction<Scenario>>
  constraints: Constraints
  onConstraintsChange: Dispatch<SetStateAction<Constraints>>
  analysis: ReturnType<typeof compareScenario>
  management: ManagementOption
  onManagementChange: (management: ManagementOption) => void
  season: HistoricalSeasonSelection
  window: typeof referenceWindow
}

export type ManagementOption = 'current' | 'ordinary' | 'managed'

const constraintsFields = {
  usableResidue: 'Residue available after other uses?',
  grazingControl: 'Can residue be protected from grazing?',
  earlyWorkable: 'Is the earlier date workable?',
  lateWorkable: 'Is the later date workable?',
} as const

const assumptionFields = [
  { key: 'baselinePercent', label: 'Baseline cover (%)', min: 0, max: 100, step: 'any' },
  { key: 'addedPercent', label: 'Added cover (percentage points)', min: 0, max: 100, step: 'any' },
  { key: 'plateau', label: 'Days at peak cover', min: 0, step: '1' },
  { key: 'duration', label: 'Days until added cover reaches zero', min: 1, step: '1' },
] as const

function Crop({ name }: { name: 'Maize' | 'Groundnut' }) {
  const Icon = name === 'Maize' ? Wheat : Leaf
  return <span className={`crop crop-${name.toLowerCase()}`}><Icon size={19} aria-hidden="true" />{name}</span>
}

export function RotationPlanner({ scenario, onScenarioChange, constraints, onConstraintsChange, analysis, management, onManagementChange, season, window }: PlannerProps) {
  const managedRadio = useRef<HTMLInputElement>(null)
  const feasibility = evaluateFeasibility(constraints)
  const { comparison, error } = analysis
  const claim = comparison && formatScientificClaim(comparison)
  const update = (key: keyof Scenario, value: string) => onScenarioChange((current) => ({ ...current, [key]: value }))

  function updateDate(key: 'earlyDate' | 'lateDate', value: string) {
    update(key, value)
    const workable = key === 'earlyDate' ? 'earlyWorkable' : 'lateWorkable'
    onConstraintsChange((current) => ({ ...current, [workable]: 'unknown' }))
  }

  function resetScenario() {
    const defaults = scenarioForSeason(initialScenario, referenceYear, season.year)
    onScenarioChange(defaults)
    onConstraintsChange((current) => ({
      ...current,
      earlyWorkable: scenario.earlyDate === defaults.earlyDate ? current.earlyWorkable : 'unknown',
      lateWorkable: scenario.lateDate === defaults.lateDate ? current.lateWorkable : 'unknown',
    }))
  }

  function updateConstraint(key: keyof Constraints, value: string) {
    if (value === 'yes' || value === 'no' || value === 'unknown') {
      onConstraintsChange((current) => ({ ...current, [key]: value }))
    }
  }

  return (
    <div className="page-width page-body">
      <header className="page-heading">
        <div>
          <h1>Crop Rotation Planner</h1>
          <p>Compare two crop sequences and test when to return protected groundnut residue.</p>
        </div>
        <div className="season-controls">
          <HistoricalSeasonSelect {...season} />
          <span className="page-context"><CalendarDays size={16} aria-hidden="true" /> {formatWindow(window)} · UTC</span>
        </div>
      </header>

      <div className="planner-grid">
        <section className="workspace-panel planner-controls" aria-labelledby="management-title">
          <div className="planner-control-section">
            <h2 id="management-title">Crop sequences</h2>
            <table className="sequence-table">
              <caption className="sr-only">Current and alternative rotation timelines</caption>
              <thead><tr><th scope="col">Rotation</th><th scope="col">Season 1</th><th scope="col">Season 2</th></tr></thead>
              <tbody>
                <tr className={management === 'current' ? 'sequence-active' : undefined}><th scope="row">Current</th><td><Crop name="Maize" /></td><td><ArrowRight className="sequence-arrow" size={15} aria-hidden="true" /><Crop name="Maize" /></td></tr>
                <tr className={management !== 'current' ? 'sequence-active' : undefined}><th scope="row">Alternative</th><td><Crop name="Groundnut" /></td><td><ArrowRight className="sequence-arrow" size={15} aria-hidden="true" /><Crop name="Maize" /></td></tr>
              </tbody>
            </table>
          </div>
          <fieldset className="management-selector">
            <legend>Residue management</legend>
            <div className="management-options">
              {([
                ['current', 'Existing maize management', 'Maize → Maize'],
                ['ordinary', 'Ordinary practice', 'Groundnut → Maize'],
                ['managed', 'Managed return', 'Groundnut → Maize · compare two dates'],
              ] as const).map(([value, label, crop]) => (
                <label key={value}>
                  <input type="radio" name="residue-management" value={value} checked={management === value}
                    ref={value === 'managed' ? managedRadio : undefined} onChange={() => onManagementChange(value)} />
                  <span><strong>{label}</strong><small>{crop}</small></span>
                </label>
              ))}
            </div>
          </fieldset>
          {management !== 'managed' && (
            <p className="management-context">The historical estimate compares two dates for managed return. <button type="button" onClick={() => {
              onManagementChange('managed')
              managedRadio.current?.focus()
            }}>Edit managed return dates</button></p>
          )}
          <div hidden={management !== 'managed'}>
            <fieldset className="control-fieldset">
              <legend>Managed return dates</legend>
              <div className="fields-grid">
                <div className="return-field">
                  <label htmlFor="early-return">Earlier return (UTC)</label>
                  <input id="early-return" type="date" min={window.startIso} max={window.endIso}
                    aria-describedby="early-feasibility" value={scenario.earlyDate}
                    onChange={(event) => updateDate('earlyDate', event.currentTarget.value)} />
                  <span id="early-feasibility" className={`feasibility feasibility-${feasibility.early}`}>{feasibility.early}</span>
                </div>
                <div className="return-field">
                  <label htmlFor="late-return">Later return (UTC)</label>
                  <input id="late-return" type="date" min={window.startIso} max={window.endIso}
                    aria-describedby="late-feasibility" value={scenario.lateDate}
                    onChange={(event) => updateDate('lateDate', event.currentTarget.value)} />
                  <span id="late-feasibility" className={`feasibility feasibility-${feasibility.late}`}>{feasibility.late}</span>
                </div>
              </div>
            </fieldset>
            <details className="planner-detail">
              <summary>Check management constraints</summary>
              <div className="fields-grid">
                {Object.entries(constraintsFields).map(([field, label]) => {
                  const key = field as keyof Constraints
                  return (
                    <label key={key}>{label}
                      <select value={constraints[key]} onChange={(event) => updateConstraint(key, event.currentTarget.value)}>
                        <option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option>
                      </select>
                    </label>
                  )
                })}
              </div>
              <p>Feasibility follows your answers. The historical comparison remains available for investigation.</p>
            </details>
            <details className="planner-detail">
              <summary>Edit illustrative ground-cover assumptions</summary>
              <div className="fields-grid">
                {assumptionFields.map(({ key, label, ...attributes }) => (
                  <label key={key}>{label}
                    <input type="number" {...attributes} value={scenario[key]}
                      onChange={(event) => update(key, event.currentTarget.value)} />
                  </label>
                ))}
              </div>
              <p>The same cover assumptions apply to both schedules.</p>
            </details>
            <button className="plain-button" type="button" onClick={resetScenario}>
              Reset research scenario
            </button>
          </div>
        </section>

        <section className="workspace-panel planner-results" aria-labelledby="planner-result-title">
          <div className="planner-analysis-heading">
            <div><h2 id="planner-result-title">Historical exposure</h2><p>Managed residue return · illustrative cover</p></div>
            <span className="context-label">{seasonLabel(season.year)}</span>
          </div>
          {comparison ? (
            <>
              <dl className="planner-result-values" aria-live="polite">
                <div><dt>Earlier return</dt><dd>{formatNumber(comparison.early.dailyExposure)}</dd></div>
                <div><dt>Later return</dt><dd>{formatNumber(comparison.late.dailyExposure)}</dd></div>
              </dl>
              <p className="planner-unit">mm-equivalent · daily NASA POWER rainfall</p>
              <p className="planner-delta">Later minus earlier <strong>{formatSigned(comparison.dailyDifference)} mm-equivalent</strong></p>
              <PlannerTimeline comparison={comparison} scenario={scenario} />
              {claim && <p className="planner-claim" role="status"><strong>{claim.title}</strong> {claim.detail}</p>}
            </>
          ) : <p className="analysis-error" role="status"><strong>Analysis unavailable.</strong> {error}</p>}
          <p className="planner-limit">Historical exposure under illustrative assumptions. Field feasibility requires local verification.</p>
          <ButtonLink variant="secondary" href={routes.observations.href}>Inspect rainfall and cover <ArrowRight size={16} aria-hidden="true" /></ButtonLink>
        </section>
      </div>
    </div>
  )
}
