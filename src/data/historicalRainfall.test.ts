import { describe, expect, it } from 'vitest'
import bundle from './rainfall.json'
import manifest from './rainfall-provenance.json'
import challengeResources from './challengeResources.json'
import { historicalRainfall, validateProviderBundle } from './historicalRainfall'
import { referenceYear, researchReference } from './researchReference'
import { compareScenario, initialScenario, scenarioForSeason } from './scenario'

describe('audited NASA POWER evidence', () => {
  it('matches the frozen 2022/23 reference day for day and separates eligibility', () => {
    const seasons = validateProviderBundle(bundle, manifest)
    const current = seasons.find(({ startYear }) => startYear === referenceYear)!
    expect(current.days.map(({ dateIso, rainMm }) => ({ dateIso, rainMm }))).toEqual(researchReference.days)
    expect(Object.isFrozen(current.days)).toBe(true)
    expect(Object.isFrozen(current.days[0])).toBe(true)
    expect(historicalRainfall.provenance?.sourceVerification).toBe('provider_validated')
    expect(historicalRainfall.provenance?.challengeEligibility).toBe('unconfirmed')
    expect(challengeResources.status).toBe('confirmed_from_official_challenge_resources')
    expect(challengeResources.titles).toContain('NASA POWER: Agroclimatology & Meteorological Data')
    expect(historicalRainfall.provenance?.researchComparison2022.exactMatches).toBe(76)
    expect(historicalRainfall.provenance?.spotCheck.rainMm).toBe(83.34)
  })

  it('rejects mismatched hashes, units, source tags, counts and seasonal totals', () => {
    expect(() => validateProviderBundle({ ...bundle, rawSha256: '0'.repeat(64) }, manifest)).toThrow('disagree')
    expect(() => validateProviderBundle(bundle, { ...manifest, product: { ...manifest.product, providerUnits: 'mm/hr' } })).toThrow('disagree')
    const incomplete = structuredClone(bundle)
    incomplete.seasons[0].days.pop()
    expect(() => validateProviderBundle(incomplete, manifest)).toThrow('coverage is incomplete')
    const wrongSource = structuredClone(bundle)
    wrongSource.seasons[0].days[0].sourceId = 'IMERG'
    expect(() => validateProviderBundle(wrongSource, manifest)).toThrow('Unexpected provider metadata')
    const wrongTotal = structuredClone(manifest)
    wrongTotal.seasons[0].totalRainMm = 0
    expect(() => validateProviderBundle(bundle, wrongTotal)).toThrow('total disagrees')
  })

  it.each([
    [2018, 627.32, 488.855618421, 487.40325, 471.131821429, -16.271428571, '2018-11-24', 11.3675],
    [2019, 631.15, 491.840246711, 503.47, 493.228214286, -10.241785714, '2019-11-25', 6.395],
    [2020, 430.65, 335.595345395, 346.605178571, 332.504642857, -14.100535714, '2020-12-13', -9.9525],
    [2021, 530.21, 413.180095395, 434.946357143, 438.472071429, 3.525714286, '2021-11-26', 12.2375],
    [2022, 616.35, 480.306957237, 506.826607143, 468.473928571, -38.352678571, '2022-12-27', -10.4175],
  ])('reproduces provider exposure and event attribution for %i', (year, rain, uniform, early, late, difference, event, contribution) => {
    const { comparison, error } = compareScenario(scenarioForSeason(initialScenario, referenceYear, year), year)
    expect(error).toBeUndefined()
    if (!comparison) throw new Error(error)
    expect(comparison.events).toHaveLength(76)
    expect(comparison.totalRainMm).toBeCloseTo(rain, 6)
    expect(comparison.early.uncoveredAreaDays).toBeCloseTo(59.225, 6)
    expect(comparison.late.uncoveredAreaDays).toBeCloseTo(59.225, 6)
    expect(comparison.early.uniformExposure).toBeCloseTo(uniform, 6)
    expect(comparison.late.uniformExposure).toBeCloseTo(uniform, 6)
    expect(comparison.early.dailyExposure).toBeCloseTo(early, 6)
    expect(comparison.late.dailyExposure).toBeCloseTo(late, 6)
    expect(comparison.dailyDifference).toBeCloseTo(difference, 6)
    const largest = comparison.events.reduce((top, day) => Math.abs(day.contribution) > Math.abs(top.contribution) ? day : top)
    expect(largest.dateIso).toBe(event)
    expect(largest.contribution).toBeCloseTo(contribution, 6)
  })

  it('preserves a January return and cover inputs on a season change', () => {
    const edited = { ...initialScenario, lateDate: '2023-01-04', baselinePercent: '23' }
    expect(scenarioForSeason(edited, 2022, 2019)).toEqual({
      ...edited, earlyDate: '2019-11-15', lateDate: '2020-01-04',
    })
  })
})
