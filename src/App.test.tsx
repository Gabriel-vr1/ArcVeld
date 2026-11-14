import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App'
import { NASAComparison } from './components/NASAComparison'
import { SourcePanel } from './components/SourcePanel'
import { compareScenario, initialScenario } from './data/scenario'

describe('ArcVeld workspace shell', () => {
  it('renders the four routes and the geographic overview', () => {
    const markup = renderToStaticMarkup(<App />)
    for (const label of ['Agricultural', 'Rotation Planning', 'Earth Observations', 'Research &amp; Sources', 'Kasungu']) {
      expect(markup).toContain(label)
    }
    expect(markup).not.toContain('AI-generated landscape illustration')
  })

  it('keeps computed exposure, ground-cover assumptions and data eligibility distinct', () => {
    const observations = renderToStaticMarkup(<NASAComparison scenario={initialScenario} analysis={compareScenario(initialScenario)} />)
    const research = renderToStaticMarkup(<SourcePanel />)
    expect(observations).toContain('Calendar and uniform-rainfall baselines tie.')
    expect(observations).toContain('Research-transcribed NASA POWER / MERRA-2 rainfall')
    expect(observations).toContain('Illustrative ground cover')
    expect(observations).not.toContain('Analysis unavailable')
    expect(research).toContain('NASA source: unconfirmed.')
    expect(research).toContain('NASA POWER · MERRA-2 reanalysis')
  })
})
