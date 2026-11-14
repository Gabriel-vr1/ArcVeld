import { ArrowRight, CalendarDays, Leaf, Wheat } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { referenceWindow } from '../data/researchReference'
import { initialScenario, type compareScenario, type Constraints, type Scenario } from '../data/scenario'
import { evaluateFeasibility } from '../domain/cover'
import { formatScientificClaim } from '../domain/scientificClaim'
import { formatNumber, formatSigned } from '../format'
import { routes } from '../navigation'
import { ButtonLink } from './ui/Button'

interface PlannerProps {
  scenario: Scenario
  onScenarioChange: Dispatch<SetStateAction<Scenario>>
  constraints: Constraints
  onConstraintsChange: Dispatch<SetStateAction<Constraints>>
  analysis: ReturnType<typeof compareScenario>
}

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

export function RotationPlanner({ scenario, onScenarioChange, constraints, onConstraintsChange, analysis }: PlannerProps) {
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
    onScenarioChange(initialScenario)
    onConstraintsChange((current) => ({
      ...current,
      earlyWorkable: scenario.earlyDate === initialScenario.earlyDate ? current.earlyWorkable : 'unknown',
      lateWorkable: scenario.lateDate === initialScenario.lateDate ? current.lateWorkable : 'unknown',
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
        <span className="page-context"><CalendarDays size={16} aria-hidden="true" /> 1 Nov 2022 – 15 Jan 2023 · UTC</span>
      </header>

      <section className="planner-sequences" aria-labelledby="sequence-title">
        <h2 id="sequence-title">Crop sequences</h2>
        <table className="sequence-table">
          <caption className="sr-only">Current and alternative rotation timelines</caption>
          <thead><tr><th scope="col">Rotation</th><th scope="col">Season 1</th><th scope="col">Season 2</th></tr></thead>
          <tbody>
            <tr><th scope="row">Current</th><td><Crop name="Maize" /></td><td><ArrowRight className="sequence-arrow" size={17} aria-hidden="true" /><Crop name="Maize" /></td></tr>
            <tr><th scope="row">Alternative</th><td><Crop name="Groundnut" /></td><td><ArrowRight className="sequence-arrow" size={17} aria-hidden="true" /><Crop name="Maize" /></td></tr>
          </tbody>
        </table>
        <p className="muted">Groundnut replaces maize in the first season of the alternative rotation.</p>
      </section>

      <div className="planner-grid">
        <section className="workspace-panel planner-controls" aria-labelledby="management-title">
          <h2 id="management-title">Residue management</h2>
          <dl className="management-options">
            <div><dt>Ordinary practice</dt><dd>Use the existing approach to residue handling.</dd></div>
            <div><dt>Managed return</dt><dd>Compare returning the same nominal stock of protected residue on two dates.</dd></div>
          </dl>
          <fieldset className="control-fieldset">
            <legend>Managed return dates</legend>
            <div className="fields-grid">
              <div className="return-field">
                <label htmlFor="early-return">Earlier return (UTC)</label>
                <input id="early-return" type="date" min={referenceWindow.startIso} max={referenceWindow.endIso}
                  aria-describedby="early-feasibility" value={scenario.earlyDate}
                  onChange={(event) => updateDate('earlyDate', event.currentTarget.value)} />
                <span id="early-feasibility" className={`feasibility feasibility-${feasibility.early}`}>{feasibility.early}</span>
              </div>
              <div className="return-field">
                <label htmlFor="late-return">Later return (UTC)</label>
                <input id="late-return" type="date" min={referenceWindow.startIso} max={referenceWindow.endIso}
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
        </section>

        <section className="workspace-panel planner-results" aria-labelledby="planner-result-title">
          <h2 id="planner-result-title">Historical exposure</h2>
          <p className="muted">How much regional rainfall coincided with estimated uncovered ground.</p>
          {comparison ? (
            <>
              <dl className="planner-result-values" aria-live="polite">
                <div><dt>Earlier return</dt><dd>{formatNumber(comparison.early.dailyExposure)}</dd></div>
                <div><dt>Later return</dt><dd>{formatNumber(comparison.late.dailyExposure)}</dd></div>
              </dl>
              <p className="muted">mm-equivalent · daily NASA POWER rainfall</p>
              <p className="planner-delta">Later minus earlier <strong>{formatSigned(comparison.dailyDifference)} mm-equivalent</strong></p>
              {claim && <p className="planner-claim" role="status">{claim.title}</p>}
            </>
          ) : <p className="analysis-error" role="status"><strong>Analysis unavailable.</strong> {error}</p>}
          <ButtonLink variant="secondary" href={routes.observations.href}>Inspect rainfall and cover <ArrowRight size={16} aria-hidden="true" /></ButtonLink>
        </section>
      </div>
    </div>
  )
}
