import bundle from './imerg-2022.json'
import { comparisonTolerance, validateRainfallDays } from '../domain/evidence'
import { referenceYear } from './researchReference'

export const imergLabel = 'GPM IMERG Final Daily V07'

export function validateImergBundle(dataset: typeof bundle) {
  const { days, cell, sampleCountRange, spotCheck } = dataset
  if (dataset.schemaVersion !== 1 || dataset.collection !== 'C2723754864-GES_DISC' ||
      dataset.version !== 'V07B' || dataset.variable !== 'precipitation' ||
      dataset.timeStandard !== 'UTC' || dataset.sourceUnits !== 'mm/day' || dataset.units !== 'mm' ||
      dataset.gridSpacingDegrees !== 0.1 || dataset.startYear !== referenceYear ||
      Math.abs(cell.lat + 13.05) > 0.00001 || Math.abs(cell.lon - 33.45) > 0.00001 ||
      !Number.isFinite(cell.lat) || !Number.isFinite(cell.lon) ||
      !Number.isInteger(sampleCountRange.min) || !Number.isInteger(sampleCountRange.max) ||
      sampleCountRange.min < 1 || sampleCountRange.max > 48 || sampleCountRange.min > sampleCountRange.max) {
    throw new Error('IMERG metadata does not match the validated Kasungu product and cell.')
  }
  const total = validateRainfallDays(days, referenceYear)
  const counts = days.map((day) => day.sampleCount)
  if (counts.some((count) => !Number.isInteger(count)) ||
      Math.min(...counts) !== sampleCountRange.min || Math.max(...counts) !== sampleCountRange.max ||
      !Number.isFinite(dataset.totalRainMm) || Math.abs(total - dataset.totalRainMm) > comparisonTolerance ||
      spotCheck.dateIso !== '2022-12-27' ||
      days.find((day) => day.dateIso === spotCheck.dateIso)?.rainMm !== spotCheck.rainMm) {
    throw new Error('IMERG rainfall does not match the acquisition audit.')
  }
  return Object.freeze(days.map(({ dateIso, rainMm }) => Object.freeze({ dateIso, rainMm })))
}

function loadImerg() {
  try {
    return { days: validateImergBundle(bundle), metadata: bundle }
  } catch (error) {
    if (!(error instanceof Error)) throw error
    return { error: error.message }
  }
}

export const imergRainfall = loadImerg()
