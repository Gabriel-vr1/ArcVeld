import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App'
import { NASAComparison } from './components/NASAComparison'
import { SourcePanel } from './components/SourcePanel'
import { compareScenario, initialScenario } from './data/scenario'
import { referenceWindow, referenceYear } from './data/researchReference'

describe('ArcVeld workspace shell', () => {
  it('renders the geographic welcome with a direct link to the overview', () => {
    const markup = renderToStaticMarkup(<App />)
    for (const label of ['ArcVeld', 'Illustrative relief of Malawi and the Kasungu reference point', 'Illustrative relief · Natural Earth boundaries', 'Kasungu', 'href="#/"']) {
      expect(markup).toContain(label)
    }
    expect(markup).not.toContain('Main navigation')
  })

  it('keeps computed exposure, ground-cover assumptions and data eligibility distinct', () => {
    const observations = renderToStaticMarkup(<NASAComparison scenario={initialScenario} analysis={compareScenario(initialScenario)}
      onDateSelect={() => {}} season={{ year: referenceYear, onChange: () => {} }} window={referenceWindow}
      source="power" onSourceChange={() => {}} />)
    const research = renderToStaticMarkup(<SourcePanel />)
    expect(observations).toContain('Calendar and uniform-rainfall baselines tie.')
    expect(observations).toContain('NASA POWER / MERRA-2 · independently validated')
    expect(observations).toContain('Ground cover is modelled from illustrative assumptions')
    expect(observations).not.toContain('Analysis unavailable')
    expect(research).toContain('NASA POWER is listed.')
    expect(research).toContain('2026-11-14')
    expect(research).toContain('NASA POWER: Agroclimatology &amp; Meteorological Data')
    expect(research).toContain('NASA POWER · MERRA-2 reanalysis')
  })
})
