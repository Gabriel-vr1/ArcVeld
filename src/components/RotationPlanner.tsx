import { ArrowRight, CalendarDays, Leaf, Wheat } from 'lucide-react'
import { useRef, type Dispatch, type SetStateAction } from 'react'
import { referenceYear, type referenceWindow } from '../data/researchReference'
import { initialScenario, scenarioForSeason, type compareScenario, type Constraints, type Scenario } from '../data/scenario'
import { evaluateFeasibility } from '../domain/cover'
import { comparisonTolerance } from '../domain/evidence'
import { formatScientificClaim } from '../domain/scientificClaim'
import { formatNumber, formatSigned, formatWindow } from '../format'
import { routes } from '../navigation'
import { historicalRainfall, seasonLabel } from '../data/historicalRainfall'
import { imergLabel } from '../data/imergRainfall'
import { HistoricalSeasonSelect, type HistoricalSeasonSelection } from './HistoricalSeasonSelect'
import { RainfallSourceSelect, type RainfallSourceSelection } from './RainfallSourceSelect'
import { ButtonLink } from './ui/Button'
import { PlannerTimeline } from './PlannerTimeline'
import { MalawiLocator } from './MalawiLocator'

interface PlannerProps extends RainfallSourceSelection {
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

const context = {
  current: {
    title: 'Current maize management',
    observations: [
      ['After maize harvest', 'Estimate the percentage of ground still covered.'],
      ['After each field operation', 'Repeat the cover estimate after residue removal, grazing or land preparation.'],
      ['At each visit', 'Record the date and management practice. Review the observations with a local extension officer.'],
    ],
  },
  ordinary: {
    title: 'Ordinary groundnut rotation',
    observations: [
      ['After groundnut harvest', 'Record how much residue stays on the field and how much is removed for household or livestock use.'],
      ['After grazing', 'Check how much residue remains available.'],
      ['Before maize planting', 'Record the date and estimate the percentage of ground covered.'],
    ],
  },
}

const feasibilityLabels: Readonly<Record<string, string | undefined>> = {
  blocked: 'Unworkable',
  conditional: 'Unknown or unverified',
  workable: 'Confirmed workable from your answers',
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

export function RotationPlanner({ scenario, onScenarioChange, constraints, onConstraintsChange, analysis, management, onManagementChange, season, window, source, onSourceChange }: PlannerProps) {
  const managedRadio = useRef<HTMLInputElement>(null)
  const feasibility = evaluateFeasibility(constraints)
  const { comparison, error } = analysis
  const claim = comparison && formatScientificClaim(comparison)
  const difference = comparison?.dailyDifference ?? 0
  const tied = Math.abs(difference) <= comparisonTolerance
  const differenceLabel = Math.abs(difference) < 0.005 ? 'less than 0.01' : formatNumber(Math.abs(difference))
  const outcome = tied ? 'Both return dates have equal estimated rainfall exposure.' : (
    <>{difference < 0 ? 'Later' : 'Earlier'} return had <strong>{differenceLabel} mm-equivalent</strong> lower estimated rainfall exposure.</>
  )
  const sourceLabel = source === 'imerg' ? imergLabel : historicalRainfall.provenance
    ? 'NASA POWER / MERRA-2'
    : 'Research-transcribed NASA POWER / MERRA-2'
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
    <div className="page-width page-body planner">
      <div className="planner-grid">
        <div className="planner-analysis-scene">
          <div className="planner-terrain" aria-hidden="true"><MalawiLocator relief /></div>
          <header className="page-heading planner-heading">
            <h1>Crop Rotation Planner</h1>
            <p>Compare two groundnut-residue return dates under historical rainfall.</p>
          </header>

          <section className="planner-controls" aria-labelledby="management-title">
            <div className="planner-toolbar">
              <h2 id="management-title">Scenario configuration</h2>
              <div className="season-controls">
                <HistoricalSeasonSelect {...season} />
                <RainfallSourceSelect year={season.year} source={source} onSourceChange={onSourceChange} compact />
              </div>
              <div className="planner-editing" hidden={management !== 'managed'}>
                <fieldset className="control-fieldset">
                  <legend>Managed return dates</legend>
                  <p className="planner-date-window"><CalendarDays size={14} aria-hidden="true" /> {formatWindow(window)} · UTC</p>
                  <div className="fields-grid">
                    <div className="return-field planner-earlier">
                      <label htmlFor="early-return">Earlier return (UTC)</label>
                      <input id="early-return" type="date" min={window.startIso} max={window.endIso}
                        aria-describedby="early-feasibility" value={scenario.earlyDate}
                        onChange={(event) => updateDate('earlyDate', event.currentTarget.value)} />
                      <span id="early-feasibility" className={`feasibility feasibility-${feasibility.early}`}>{feasibilityLabels[feasibility.early] ?? feasibilityLabels.conditional}</span>
                    </div>
                    <div className="return-field planner-later">
                      <label htmlFor="late-return">Later return (UTC)</label>
                      <input id="late-return" type="date" min={window.startIso} max={window.endIso}
                        aria-describedby="late-feasibility" value={scenario.lateDate}
                        onChange={(event) => updateDate('lateDate', event.currentTarget.value)} />
                      <span id="late-feasibility" className={`feasibility feasibility-${feasibility.late}`}>{feasibilityLabels[feasibility.late] ?? feasibilityLabels.conditional}</span>
                    </div>
                  </div>
                </fieldset>
                <div className="planner-preview" role="status">
                  <div className="planner-preview-context">{seasonLabel(season.year)} · {sourceLabel}</div>
                  <p>{comparison ? outcome : <>No comparison yet. {error}</>}</p>
                  <span>Illustrative historical exposure proxy</span>
                </div>
              </div>
            </div>
          </section>

          {management === 'managed' && <section className="planner-results" aria-labelledby="planner-result-title">
            <div className="planner-analysis-heading">
              <h2 id="planner-result-title">Historical exposure</h2>
              <span className="context-label">{seasonLabel(season.year)}</span>
            </div>
            {comparison ? (
              <>
                <div className="planner-outcome" role="status">
                  <p>{outcome}</p>
                </div>
                <p className="planner-unit">Illustrative historical exposure proxy, weighted by daily rainfall.</p>
                <PlannerTimeline key={season.year} comparison={comparison} scenario={scenario} sourceLabel={sourceLabel} />
                <dl className="planner-result-values">
                  <div><dt>Earlier exposure</dt><dd><span>{formatNumber(comparison.early.dailyExposure)}</span> <small>mm-equivalent</small></dd></div>
                  <div><dt>Later exposure</dt><dd><span>{formatNumber(comparison.late.dailyExposure)}</span> <small>mm-equivalent</small></dd></div>
                  <div><dt>Later minus earlier</dt><dd>{!tied && Math.abs(difference) < 0.005
                    ? `${difference < 0 ? '−' : '+'}<0.01`
                    : formatSigned(tied ? 0 : difference)} <small>mm-equivalent</small></dd></div>
                </dl>
                {claim && <p className="planner-claim"><strong>{claim.title}</strong> {claim.detail}</p>}
              </>
            ) : <p className="analysis-error" role="status"><strong>Analysis unavailable.</strong> {error}</p>}
            <h3 className="mt-4 text-sm font-semibold">Before applying this to a field</h3>
            <p className="planner-limit">Confirm residue availability after household and livestock use, grazing protection and workable dates in Field settings. Observe ground cover and review it with a local extension officer.</p>
            <ButtonLink variant="secondary" href={routes.observations.href}>Inspect rainfall and cover <ArrowRight size={16} aria-hidden="true" /></ButtonLink>
          </section>}
        </div>

        <div className="planner-practice">
          <fieldset className="management-selector">
            <legend>Management practice</legend>
            <div className="management-options">
              {([
                ['managed', 'Managed return', 'Compare exposure'],
                ['current', 'Existing maize management', 'Field context'],
                ['ordinary', 'Ordinary practice', 'Field context'],
              ] as const).map(([value, label, purpose]) => (
                <label key={value}>
                  <input type="radio" name="residue-management" value={value} checked={management === value}
                    ref={value === 'managed' ? managedRadio : undefined} onChange={() => onManagementChange(value)} />
                  <strong>{label}</strong><small>{purpose}</small>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="planner-sequence" aria-label="Selected crop sequence">
            <span className="sr-only">{management === 'current' ? 'Maize → Maize' : 'Groundnut → Maize'}</span>
            <div><span>Season 1</span><Crop name={management === 'current' ? 'Maize' : 'Groundnut'} /></div>
            <ArrowRight size={17} aria-hidden="true" />
            <div><span>Season 2</span><Crop name="Maize" /></div>
          </div>
        </div>

        {management !== 'managed' && (
          <section className="planner-results planner-field-guide" aria-labelledby="planner-result-title">
            <h2 id="planner-result-title">{context[management].title}</h2>
            <p className="muted">Field observations needed before exposure can be quantified.</p>
            <dl>
              {context[management].observations.map(([when, observation]) => (
                <div key={when}><dt>{when}</dt><dd>{observation}</dd></div>
              ))}
            </dl>
            <button className="plain-button" type="button" onClick={() => {
              onManagementChange('managed')
              managedRadio.current?.focus()
            }}>Edit managed return dates</button>
          </section>
        )}
        <section className="planner-field-settings" aria-labelledby="field-settings-title" hidden={management !== 'managed'}>
          <h2 id="field-settings-title">Field settings</h2>
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
      </div>
    </div>
  )
}
