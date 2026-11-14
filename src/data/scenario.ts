import { makeCoverCurve, evaluateFeasibility } from '../domain/cover'
import { utcDayIndex } from '../domain/dates'
import { compareAgainstBaselines } from '../domain/exposure'
import { referenceWindow, referenceYear, researchReference, researchScenario } from './researchReference'

export type Comparison = ReturnType<typeof compareAgainstBaselines>

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

export function compareScenario(scenario: Scenario): { comparison: Comparison; error?: never } | { comparison?: never; error: string } {
  if (!researchReference.days) return { error: researchReference.error }
  const { startIso, endIso, dates } = referenceWindow
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
      comparison: compareAgainstBaselines(researchReference.days, coverForDate(earlyDate), coverForDate(lateDate), referenceYear),
    }
  } catch (error) {
    if (!(error instanceof Error)) throw error
    return { error: error.message }
  }
}
