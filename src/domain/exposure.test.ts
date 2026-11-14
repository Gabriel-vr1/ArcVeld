import { describe, expect, it } from 'vitest'
import { referenceWindow, referenceYear, researchReference, researchScenario } from '../data/researchReference'
import { evaluateFeasibility, makeCoverCurve } from './cover'
import { historicalWindow, utcDayIndex } from './dates'
import { calculateCalendarExposure, calculateExposure, compareAgainstBaselines } from './exposure'
import { formatScientificClaim } from './scientificClaim'

if (!researchReference.days) throw new Error(researchReference.error)
const researchDays = researchReference.days
const { dates, startIso } = referenceWindow

function coverFor(date: string) {
  return makeCoverCurve({
    baseCover: researchScenario.baseCover,
    residue: { ...researchScenario.pulse, startIndex: utcDayIndex(startIso, date) },
  }, dates.length)
}

const early = coverFor(researchScenario.earlyDate)
const late = coverFor(researchScenario.lateDate)

describe('UTC historical windows', () => {
  it.each([2019, 2020, 2022, 2023])('generates 76 consecutive days for %s', (year) => {
    const window = historicalWindow(year)
    expect(window.startIso).toBe(`${year}-11-01`)
    expect(window.endIso).toBe(`${year + 1}-01-15`)
    expect(window.dates).toHaveLength(76)
    expect(window.dates[61]).toBe(`${year + 1}-01-01`)
    expect(window.dates.every((date, index) => utcDayIndex(window.startIso, date) === index)).toBe(true)
  })

  it('uses strict UTC day keys across leap dates and year boundaries', () => {
    expect(utcDayIndex('2024-02-28', '2024-03-01')).toBe(2)
    expect(utcDayIndex('2022-12-31', '2023-01-01')).toBe(1)
    expect(() => utcDayIndex('2023-02-28', '2023-02-29')).toThrow('Invalid UTC calendar date')
    expect(() => utcDayIndex(startIso, '2022-11-15T00:00:00+02:00')).toThrow('ISO calendar date')
    expect(() => historicalWindow(2022.5)).toThrow('starting year')
  })
})

describe('illustrative cover trajectories', () => {
  it('holds the added cover through day 14 and reaches zero on day 28', () => {
    expect(early.fractions[13]).toBe(0.15)
    expect(early.fractions[14]).toBe(0.4)
    expect(early.fractions[28]).toBe(0.4)
    expect(early.fractions[35]).toBe(0.275)
    expect(early.fractions[42]).toBe(0.15)
  })

  it('accepts explicit daily baselines and caps combined effective cover at 100%', () => {
    const currentPractice = dates.map((_, index) => index <= 33 ? 0.28 : 0.12)
    expect(makeCoverCurve({ baseCover: currentPractice }, dates.length).fractions).toEqual(currentPractice)
    expect(makeCoverCurve({
      baseCover: 0.9,
      residue: { startIndex: 0, peak: 0.25, durationDays: 2, plateauDays: 0 },
    }, 3).fractions).toEqual([1, 1, 0.9])
  })

  it.each([-0.01, 1.01, NaN, Infinity])('rejects invalid cover or peak %s', (invalid) => {
    expect(() => makeCoverCurve({ baseCover: invalid }, dates.length)).toThrow('Ground cover')
    expect(() => makeCoverCurve({
      baseCover: 0.15, residue: { ...researchScenario.pulse, peak: invalid, startIndex: 0 },
    }, dates.length)).toThrow('Ground cover')
    expect(() => calculateExposure(researchDays, early.fractions.map(() => invalid), referenceYear)).toThrow('Ground cover')
  })

  it('rejects out-of-window starts, invalid durations and mismatched cover lengths', () => {
    expect(() => coverFor('2023-01-16')).toThrow('inside the historical window')
    expect(() => coverFor('2022-10-31')).toThrow('inside the historical window')
    expect(() => makeCoverCurve({
      baseCover: 0.15, residue: { ...researchScenario.pulse, durationDays: 14, startIndex: 0 },
    }, dates.length)).toThrow('shorter than the duration')
    expect(() => makeCoverCurve({ baseCover: [0.15] }, dates.length)).toThrow('one value per day')
    expect(() => calculateExposure(researchDays, [0.15], referenceYear)).toThrow('same historical window')
  })

  it('keeps shared constraints and the two operation dates independent', () => {
    const constraints = {
      usableResidue: 'yes', grazingControl: 'yes', earlyWorkable: 'unknown', lateWorkable: 'no',
    } as const
    expect(evaluateFeasibility(constraints)).toEqual({ early: 'conditional', late: 'blocked' })
    expect(evaluateFeasibility({ ...constraints, earlyWorkable: 'yes' }).early).toBe('workable')
    expect(evaluateFeasibility({ ...constraints, usableResidue: 'no' })).toEqual({ early: 'blocked', late: 'blocked' })
  })
})

describe('historical rainfall exposure', () => {
  it('reproduces the research reference and attributes its full difference to individual days', () => {
    const result = compareAgainstBaselines(researchDays, early, late, referenceYear)
    expect(result.totalRainMm).toBeCloseTo(616.35, 6)
    expect(result.early.uncoveredAreaDays).toBeCloseTo(59.225, 6)
    expect(result.late.uncoveredAreaDays).toBeCloseTo(59.225, 6)
    expect(result.early.uniformExposure).toBeCloseTo(480.3069572368421, 6)
    expect(result.late.uniformExposure).toBeCloseTo(480.3069572368421, 6)
    expect(result.early.dailyExposure).toBeCloseTo(506.8266071428571, 6)
    expect(result.late.dailyExposure).toBeCloseTo(468.4739285714286, 6)
    expect(result.dailyDifference).toBeCloseTo(-38.35267857142858, 6)
    expect(result.equalBaselines).toBe(true)
    const dec27 = result.events.find((event) => event.dateIso === '2022-12-27')
    expect(dec27).toMatchObject({ rainMm: 83.34, earlyCover: 0.15, lateCover: 0.275 })
    expect(dec27?.contribution).toBeCloseTo(-10.4175, 6)
    expect(result.events.reduce((sum, event) => sum + event.contribution, 0)).toBeCloseTo(result.dailyDifference, 6)
  })

  it('handles uniform rain, identical schedules and fully covered or bare ground', () => {
    const uniform = dates.map((dateIso) => ({ dateIso, rainMm: 2 }))
    const result = compareAgainstBaselines(uniform, early, late, referenceYear)
    expect(result.early.dailyExposure).toBeCloseTo(result.early.uniformExposure, 6)
    expect(result.late.dailyExposure).toBeCloseTo(result.late.uniformExposure, 6)
    const identical = compareAgainstBaselines(researchDays, early, early, referenceYear)
    expect(identical.dailyDifference).toBe(0)
    expect(identical.events.every((event) => event.contribution === 0)).toBe(true)
    expect(calculateExposure(uniform, dates.map(() => 1), referenceYear).dailyExposure).toBe(0)
    expect(calculateExposure(uniform, dates.map(() => 0), referenceYear).dailyExposure).toBe(152)
    expect(calculateCalendarExposure([0, 0.2, 0.3, 1]).lowCoverDays).toBe(1)
  })

  it('gives lower exposure to a curve with more cover every day', () => {
    const moreCover = makeCoverCurve({ baseCover: 0.4 }, dates.length)
    const lessCover = makeCoverCurve({ baseCover: 0.2 }, dates.length)
    const result = compareAgainstBaselines(researchDays, lessCover, moreCover, referenceYear)
    expect(result.equalBaselines).toBe(false)
    expect(formatScientificClaim(result).title).toBe('The calendar and uniform-rainfall baselines do not both tie.')
    expect(result.dailyDifference).toBeLessThan(0)
    expect(result.events.every((event) => event.contribution <= 0)).toBe(true)
  })

  it('withholds full-period exposure when the rainfall series is incomplete', () => {
    expect(() => compareAgainstBaselines(researchDays.slice(0, -1), early, late, referenceYear)).toThrow('75 of 76 UTC days')
  })

  it('recalculates inside the window, drops the tie and preserves source rain after an edit', () => {
    const original = compareAgainstBaselines(researchDays, early, late, referenceYear)
    const editedLate = coverFor('2023-01-05')
    expect(editedLate.extendsPastWindow).toBe(true)
    expect(editedLate.fractions.at(-1)).toBe(0.4)
    expect(coverFor('2022-12-18').extendsPastWindow).toBe(false)
    expect(coverFor('2022-12-19').extendsPastWindow).toBe(true)
    const edited = compareAgainstBaselines(researchDays, early, editedLate, referenceYear)
    expect(edited.extendsPastWindow).toBe(true)
    expect(edited.equalBaselines).toBe(false)
    expect(edited.late.uncoveredAreaDays).toBeCloseTo(61.85, 6)
    expect(edited.dailyDifference).not.toBeCloseTo(original.dailyDifference, 6)
    expect(edited.totalRainMm).toBe(original.totalRainMm)
    expect(edited.early).toEqual(original.early)
    expect(edited.events.map(({ dateIso, rainMm }) => ({ dateIso, rainMm }))).toEqual(researchDays)
    expect(Object.isFrozen(researchDays)).toBe(true)
    expect(researchDays.every(Object.isFrozen)).toBe(true)
  })
})
