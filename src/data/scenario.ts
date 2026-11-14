import { makeCoverCurve, evaluateFeasibility } from '../domain/cover'
import { historicalWindow, utcDayIndex } from '../domain/dates'
import { compareAgainstBaselines } from '../domain/exposure'
import { referenceYear, researchReference, researchScenario } from './researchReference'
import { historicalRainfall } from './historicalRainfall'
import { imergRainfall } from './imergRainfall'

export type Comparison = ReturnType<typeof compareAgainstBaselines>
export type RainfallSource = 'power' | 'imerg'

export const initialScenario = {
  earlyDate: researchScenario.earlyDate as string,
  lateDate: researchScenario.lateDate as string,
  baselinePercent: String(researchScenario.baseCover * 100),
  addedPercent: String(researchScenario.pulse.peak * 100),
  plateau: String(researchScenario.pulse.plateauDays),
  duration: String(researchScenario.pulse.durationDays),
}

export type Scenario = typeof initialScenario
export type Constraints = Parameters<typeof evaluateFeasibility>[0]

export const initialConstraints: Constraints = {
  usableResidue: 'unknown',
  grazingControl: 'unknown',
  earlyWorkable: 'unknown',
  lateWorkable: 'unknown',
}

export function scenarioForSeason(scenario: Scenario, fromYear: number, toYear: number): Scenario {
  const moveDate = (date: string) => date
    ? String(Number(date.slice(0, 4)) + toYear - fromYear) + date.slice(4)
    : date
  return { ...scenario, earlyDate: moveDate(scenario.earlyDate), lateDate: moveDate(scenario.lateDate) }
}

export function compareScenario(scenario: Scenario, year = referenceYear, source: RainfallSource = 'power'): { comparison: Comparison; error?: never } | { comparison?: never; error: string } {
  const season = source === 'imerg'
    ? (year === referenceYear && imergRainfall.days ? { window: historicalWindow(year), days: imergRainfall.days } : undefined)
    : historicalRainfall.seasons.find(({ startYear }) => startYear === year)
  if (!season) {
    return { error: source === 'imerg'
      ? imergRainfall.error ?? 'Verified IMERG rainfall is available for 2022/23.'
      : researchReference.error ?? 'Rainfall is unavailable for this historical season.' }
  }
  const { startIso, endIso, dates } = season.window
  const { earlyDate, lateDate, baselinePercent, addedPercent, plateau, duration } = scenario

  if (!earlyDate || !lateDate) return { error: 'Enter both residue-return dates.' }
  if (earlyDate < startIso || earlyDate > endIso || lateDate < startIso || lateDate > endIso) {
    return { error: 'Enter both dates within the historical window.' }
  }
  if (earlyDate > lateDate) return { error: 'The later return must be on or after the earlier return.' }
  if ([baselinePercent, addedPercent, plateau, duration].some((value) => value.trim() === '')) {
    return { error: 'Complete all ground-cover assumptions.' }
  }

  try {
    const coverForDate = (date: string) => makeCoverCurve({
      baseCover: Number(baselinePercent) / 100,
      residue: {
        peak: Number(addedPercent) / 100,
        plateauDays: Number(plateau),
        durationDays: Number(duration),
        startIndex: utcDayIndex(startIso, date),
      },
    }, dates.length)

    return {
      comparison: compareAgainstBaselines(season.days, coverForDate(earlyDate), coverForDate(lateDate), year),
    }
  } catch (error) {
    if (!(error instanceof Error)) throw error
    return { error: error.message }
  }
}
