import bundle from './rainfall.json'
import manifest from './rainfall-provenance.json'
import { historicalWindow } from '../domain/dates'
import { comparisonTolerance, validateRainfallDays, type RainDay } from '../domain/evidence'
import { referenceProvenance, referenceWindow, referenceYear, researchReference } from './researchReference'

export interface HistoricalSeason {
  readonly startYear: number
  readonly window: typeof referenceWindow
  readonly days: readonly RainDay[]
}

const sourceId = 'NASA_POWER_PRECTOTCORR_MERRA2'
const seasonYears = [2018, 2019, 2020, 2021, 2022]

function validReceipt(receipt: typeof manifest.spotCheck | typeof manifest.acquisition) {
  return receipt.httpStatus === 200 && /^[0-9a-f]{64}$/.test(receipt.rawSha256) &&
    receipt.retrievedAtUtc.endsWith('Z') && Number.isFinite(Date.parse(receipt.retrievedAtUtc))
}

export function validateProviderBundle(dataset: typeof bundle, provenance: typeof manifest): HistoricalSeason[] {
  const { product, acquisition, validation, spotCheck } = provenance
  if (dataset.schemaVersion !== 1 || provenance.schemaVersion !== 1 ||
      dataset.sourceId !== sourceId || provenance.sourceId !== sourceId ||
      provenance.sourceVerification !== 'provider_validated' || provenance.caseId !== 'kasungu-reference' ||
      provenance.scientificMode !== 'historical_exposure_proxy' || provenance.coverBasis !== 'illustrative' ||
      product.provider !== 'NASA' || product.apiName !== 'POWER Daily API' || !product.apiVersion ||
      product.sources.length !== 1 || product.sources[0] !== 'MERRA2' || product.variable !== 'PRECTOTCORR' ||
      product.providerUnits !== 'mm/day' || product.normalizedUnits !== 'mm' ||
      product.timeStandard !== 'UTC' || product.community !== 'AG' ||
      product.queryLatitude !== referenceProvenance.queryLat || product.queryLongitude !== referenceProvenance.queryLon ||
      acquisition.acquisitionUrl !== referenceProvenance.queryUrl || !validReceipt(acquisition) ||
      acquisition.startIso !== '2018-11-01' || acquisition.endIso !== '2024-01-15' || acquisition.recordCount !== 1902 ||
      dataset.rawSha256 !== acquisition.rawSha256 ||
      validation.missingDates !== 0 || validation.duplicateDates !== 0 ||
      validation.fillValues !== 0 || validation.invalidValues !== 0 || validation.publishedRecordCount !== 380 ||
      dataset.seasons.length !== seasonYears.length || provenance.seasons.length !== seasonYears.length) {
    throw new Error('Provider rainfall bundle and manifest disagree or identify an unsupported source.')
  }

  const seasons = seasonYears.map((year, index) => {
    const season = dataset.seasons[index]
    const summary = provenance.seasons[index]
    const window = historicalWindow(year)
    if (season.startYear !== year || summary.startYear !== year ||
        season.startIso !== window.startIso || summary.startIso !== window.startIso ||
        season.endIso !== window.endIso || summary.endIso !== window.endIso ||
        summary.dayCount !== window.dates.length ||
        season.days.some((day) => !day || day.sourceId !== sourceId || day.sourceStatus !== 'provider_validated')) {
      throw new Error(`Unexpected provider metadata for the ${year} season.`)
    }
    const total = validateRainfallDays(season.days, year)
    if (!Number.isFinite(summary.totalRainMm) || Math.abs(total - summary.totalRainMm) > comparisonTolerance) {
      throw new Error(`Provider rainfall total disagrees with the manifest for ${year}.`)
    }
    const days = Object.freeze(season.days.map((day) => Object.freeze({ ...day })))
    return { startYear: year, window, days }
  })

  const verifiedDay = seasons.at(-1)?.days.find((day) => day.dateIso === spotCheck.dateIso)
  const spotUrl = new URL(acquisition.acquisitionUrl)
  spotUrl.searchParams.set('start', '20221227')
  spotUrl.searchParams.set('end', '20221227')
  if (spotCheck.dateIso !== '2022-12-27' || !validReceipt(spotCheck) ||
      spotCheck.acquisitionUrl !== spotUrl.href || verifiedDay?.rainMm !== spotCheck.rainMm) {
    throw new Error('Provider rainfall does not match the separate one-day check.')
  }
  return seasons
}

function loadRainfall() {
  try {
    return { seasons: validateProviderBundle(bundle, manifest), provenance: manifest }
  } catch (error) {
    const failure = error instanceof Error ? error.message : 'Could not validate the bundled provider rainfall.'
    const fallback = researchReference.days
      ? [{ startYear: referenceYear, window: referenceWindow, days: researchReference.days }]
      : []
    return { seasons: fallback, error: failure }
  }
}

export const historicalRainfall = loadRainfall()
export const rainfallLabel = historicalRainfall.provenance
  ? 'NASA POWER / MERRA-2 · independently validated'
  : 'Research-transcribed NASA POWER / MERRA-2'
export const challengeEligibility = manifest.challengeEligibility

export function seasonLabel(startYear: number) {
  return `${startYear}/${String(startYear + 1).slice(-2)}`
}
