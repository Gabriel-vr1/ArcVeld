import { describe, expect, it } from 'vitest'
import bundle from './imerg-2022.json'
import { validateImergBundle } from './imergRainfall'
import { compareScenario, initialScenario } from './scenario'

describe('validated IMERG series', () => {
  it('rejects an unsupported cell, incorrect units, missing dates and invalid sample counts', () => {
    expect(() => validateImergBundle({ ...bundle, cell: { lat: -13, lon: 33.45 } })).toThrow('Kasungu')
    expect(() => validateImergBundle({ ...bundle, sourceUnits: 'mm/hr' })).toThrow('Kasungu')
    expect(() => validateImergBundle({ ...bundle, days: bundle.days.slice(1) })).toThrow('incomplete')
    const badSamples = structuredClone(bundle)
    badSamples.days[0].sampleCount = 0
    expect(() => validateImergBundle(badSamples)).toThrow('acquisition audit')
    expect(compareScenario(initialScenario, 2021, 'imerg').error).toContain('2022/23')
  })

  it('reproduces the independently calculated IMERG result using the same cover curves as POWER', () => {
    const imerg = compareScenario(initialScenario, 2022, 'imerg').comparison!
    const power = compareScenario(initialScenario, 2022).comparison!
    expect(imerg.events).toHaveLength(76)
    expect(imerg.events.map(({ dateIso, earlyCover, lateCover }) => ({ dateIso, earlyCover, lateCover })))
      .toEqual(power.events.map(({ dateIso, earlyCover, lateCover }) => ({ dateIso, earlyCover, lateCover })))
    expect(imerg.totalRainMm).toBeCloseTo(284.399992891, 6)
    expect(imerg.early.dailyExposure).toBeCloseTo(224.088833502, 6)
    expect(imerg.late.dailyExposure).toBeCloseTo(217.467673094, 6)
    expect(imerg.dailyDifference).toBeCloseTo(-6.621160408, 6)
    expect(imerg.events.find(({ dateIso }) => dateIso === '2022-12-27')?.rainMm).toBeCloseTo(0.145, 6)
    expect(power.events.find(({ dateIso }) => dateIso === '2022-12-27')?.rainMm).toBe(83.34)
  })
})
