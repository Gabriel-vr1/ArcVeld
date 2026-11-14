import csv from '../../Arcveld_Malawi_2022_Research_Rainfall_Reference.csv?raw'
import provenance from '../../Arcveld_Malawi_2022_Rainfall_Reference_Provenance.json'
import { historicalWindow } from '../domain/dates'
import { validateRainfallBundle, type RainDay } from '../domain/evidence'

export const referenceYear = 2022
export const referenceWindow = historicalWindow(referenceYear)
export const referenceProvenance = provenance

export const researchScenario = {
  earlyDate: '2022-11-15',
  lateDate: '2022-12-06',
  baseCover: 0.15,
  pulse: { peak: 0.25, plateauDays: 14, durationDays: 28 },
} as const

function loadResearchReference(): { days: readonly RainDay[]; error?: never } | { days?: never; error: string } {
  try {
    return { days: validateRainfallBundle(csv, provenance, referenceYear) }
  } catch (error) {
    if (!(error instanceof Error)) throw error
    return { error: error.message }
  }
}

export const researchReference = loadResearchReference()
