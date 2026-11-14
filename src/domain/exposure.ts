import { assertCoverFraction, type CoverTrajectory } from './cover'
import { comparisonTolerance, validateRainfallDays, type RainDay } from './evidence'

export function calculateCalendarExposure(cover: readonly number[], threshold = 0.2) {
  assertCoverFraction(threshold)
  if (cover.length === 0) throw new Error('The calendar comparison requires daily cover values.')

  let uncoveredAreaDays = 0
  let lowCoverDays = 0
  for (const fraction of cover) {
    assertCoverFraction(fraction)
    uncoveredAreaDays += 1 - fraction
    if (fraction < threshold) lowCoverDays += 1
  }
  return { uncoveredAreaDays, lowCoverDays }
}

function summarizeExposure(days: readonly RainDay[], cover: readonly number[], totalRainMm: number) {
  if (cover.length !== days.length) throw new Error('Rainfall and cover must use the same historical window.')
  const calendar = calculateCalendarExposure(cover)
  return {
    ...calendar,
    uniformExposure: (totalRainMm / days.length) * calendar.uncoveredAreaDays,
    dailyExposure: days.reduce((sum, day, index) => sum + day.rainMm * (1 - cover[index]), 0),
  }
}

export function calculateExposure(days: readonly RainDay[], cover: readonly number[], startYear: number) {
  return summarizeExposure(days, cover, validateRainfallDays(days, startYear))
}

export function eventAttribution(day: RainDay, earlyCover: number, lateCover: number) {
  if (!Number.isFinite(day.rainMm) || day.rainMm < 0) throw new Error('Invalid event rainfall.')
  assertCoverFraction(earlyCover)
  assertCoverFraction(lateCover)
  return {
    ...day,
    earlyCover,
    lateCover,
    contribution: day.rainMm * (earlyCover - lateCover),
  }
}

export function compareAgainstBaselines(
  days: readonly RainDay[],
  earlyCurve: CoverTrajectory,
  lateCurve: CoverTrajectory,
  startYear: number,
) {
  const totalRainMm = validateRainfallDays(days, startYear)
  const early = summarizeExposure(days, earlyCurve.fractions, totalRainMm)
  const late = summarizeExposure(days, lateCurve.fractions, totalRainMm)
  const extendsPastWindow = earlyCurve.extendsPastWindow || lateCurve.extendsPastWindow
  const equalBaselines = !extendsPastWindow &&
    Math.abs(late.uncoveredAreaDays - early.uncoveredAreaDays) <= comparisonTolerance &&
    Math.abs(late.uniformExposure - early.uniformExposure) <= comparisonTolerance

  return {
    totalRainMm,
    early,
    late,
    extendsPastWindow,
    equalBaselines,
    dailyDifference: late.dailyExposure - early.dailyExposure,
    events: days.map((day, index) => eventAttribution(day, earlyCurve.fractions[index], lateCurve.fractions[index])),
  }
}
