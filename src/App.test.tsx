import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App'
import { NASAComparison } from './components/NASAComparison'
import { SourcePanel } from './components/SourcePanel'
import { compareScenario, initialScenario } from './data/scenario'

describe('ArcVeld workspace shell', () => {
  it('renders the geographic welcome with a direct link to the overview', () => {
    const markup = renderToStaticMarkup(<App />)
    for (const label of ['ArcVeld', 'Earth Observation for Agricultural Planning', 'Africa with Malawi highlighted', 'Kasungu', 'href="#/"']) {
      expect(markup).toContain(label)
    }
    expect(markup).not.toContain('Main navigation')
  })

  it('keeps computed exposure, ground-cover assumptions and data eligibility distinct', () => {
    const observations = renderToStaticMarkup(<NASAComparison scenario={initialScenario} analysis={compareScenario(initialScenario)} onDateSelect={() => {}} />)
    const research = renderToStaticMarkup(<SourcePanel />)
    expect(observations).toContain('Calendar and uniform-rainfall baselines tie.')
    expect(observations).toContain('Research-transcribed NASA POWER / MERRA-2 rainfall')
    expect(observations).toContain('Illustrative ground cover')
    expect(observations).not.toContain('Analysis unavailable')
    expect(research).toContain('NASA source: unconfirmed.')
    expect(research).toContain('NASA POWER · MERRA-2 reanalysis')
  })
})
