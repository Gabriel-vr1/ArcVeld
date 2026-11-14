import { historicalWindow } from './dates'

export interface RainDay {
  readonly dateIso: string
  readonly rainMm: number
}

export const comparisonTolerance = 1e-6

export function validateRainfallDays(days: readonly RainDay[], startYear: number) {
  const expectedDates = historicalWindow(startYear).dates
  const expected = new Set(expectedDates)
  const present = new Set<string>()
  let totalRainMm = 0

  for (const day of days) {
    if (!day || !expected.has(day.dateIso)) {
      throw new Error('Rainfall contains a date outside the historical UTC window.')
    }
    if (present.has(day.dateIso)) throw new Error(`Duplicate rainfall date: ${day.dateIso}.`)
    if (!Number.isFinite(day.rainMm) || day.rainMm < 0) {
      throw new Error(`Invalid rainfall on ${day.dateIso}. Expected a finite, nonnegative amount in mm.`)
    }
    present.add(day.dateIso)
    totalRainMm += day.rainMm
  }

  if (present.size !== expectedDates.length) {
    throw new Error(`Rainfall coverage is incomplete (${present.size} of ${expectedDates.length} UTC days).`)
  }
  if (days.some((day, index) => day.dateIso !== expectedDates[index])) {
    throw new Error('Rainfall dates must be in consecutive UTC order.')
  }
  if (!Number.isFinite(totalRainMm)) throw new Error('The rainfall total is out of range.')

  return totalRainMm
}

const researchHeader = 'date_utc,rain_mm,source_dataset,source_status'
const researchDataset = 'NASA_POWER_PRECTOTCORR_MERRA2'
const researchSource = 'NASA POWER Daily Point API, PRECTOTCORR, AG, MERRA2, UTC'
const researchStatus = 'transcribed_from_Arcveld_research_report__raw_NASA_response_not_attached'

// This adapter only accepts the supplied research CSV format and its companion provenance.
export function validateRainfallBundle(csv: string, provenance: unknown, startYear: number): readonly RainDay[] {
  const window = historicalWindow(startYear)
  if (typeof provenance !== 'object' || provenance === null) {
    throw new Error('The rainfall provenance is missing.')
  }
  const metadata = provenance as Record<string, unknown>
  if (metadata.source !== researchSource || metadata.dayBasis !== 'UTC' ||
      metadata.firstDate !== window.startIso || metadata.lastDate !== window.endIso ||
      metadata.dayCount !== window.dates.length || metadata.providerRawPayloadAttached !== false ||
      metadata.providerBytesIndependentlyVerified !== false) {
    throw new Error('The rainfall provenance does not match the research source and UTC window.')
  }

  const [header, ...rows] = csv.trim().split(/\r?\n/)
  if (header !== researchHeader) {
    throw new Error('The research CSV must use UTC dates and rainfall in mm.')
  }

  const days = rows.map((row, index) => {
    const [dateIso, rain, dataset, status, ...extra] = row.split(',')
    if (dataset !== researchDataset || status !== researchStatus || extra.length > 0) {
      throw new Error(`Unexpected rainfall source or CSV format on row ${index + 2}.`)
    }
    if (!/^\d+(?:\.\d+)?$/.test(rain)) {
      throw new Error(`Invalid rainfall on ${dateIso}. Expected a nonnegative decimal amount in mm.`)
    }

    return Object.freeze({ dateIso, rainMm: Number(rain) })
  })

  const total = validateRainfallDays(days, startYear)
  if (typeof metadata.totalRainMm !== 'number' || !Number.isFinite(metadata.totalRainMm) ||
      Math.abs(total - metadata.totalRainMm) > comparisonTolerance) {
    throw new Error('The rainfall total does not match the research provenance.')
  }
  return Object.freeze(days)
}
