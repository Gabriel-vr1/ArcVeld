import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('Stage 1 application shell', () => {
  const markup = renderToStaticMarkup(<App />)

  it('keeps source eligibility, illustrative cover, and analysis availability visible', () => {
    expect(markup).toContain('NASA source: unconfirmed')
    expect(markup).toContain('Cover inputs: illustrative')
    expect(markup).toContain('Analysis unavailable')
    expect(markup).toContain('NASA POWER · MERRA-2 reanalysis')
  })

  it('identifies all three management options and both return timings', () => {
    for (const label of ['Current practice', 'Ordinary rotation', 'Managed rotation', 'Earlier return', 'Later return']) {
      expect(markup).toContain(label)
    }
  })
})
