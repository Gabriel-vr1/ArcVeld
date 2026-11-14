import { describe, expect, it } from 'vitest'
import csv from '../../Arcveld_Malawi_2022_Research_Rainfall_Reference.csv?raw'
import provenance from '../../Arcveld_Malawi_2022_Rainfall_Reference_Provenance.json'
import { validateRainfallBundle, validateRainfallDays } from './evidence'

const year = 2022
const days = validateRainfallBundle(csv, provenance, year)

describe('2022/23 research rainfall validation', () => {
  it('accepts the complete transcribed reference including zero rainfall', () => {
    expect(days).toHaveLength(76)
    expect(days.at(0)?.dateIso).toBe('2022-11-01')
    expect(days.at(-1)?.dateIso).toBe('2023-01-15')
    expect(days.some((day) => day.rainMm === 0)).toBe(true)
  })

  it('rejects gaps, duplicates, wrong seasons and reversed date order', () => {
    expect(() => validateRainfallDays(days.slice(1), year)).toThrow('75 of 76 UTC days')
    expect(() => validateRainfallDays([...days.slice(1), days[1]], year)).toThrow('Duplicate rainfall date')
    expect(() => validateRainfallDays(days, 2021)).toThrow('outside the historical UTC window')
    expect(() => validateRainfallDays([...days].reverse(), year)).toThrow('consecutive UTC order')
  })

  it.each([-1, Infinity, NaN, null])('rejects invalid rainfall %s', (rainMm) => {
    const invalidDays = [{ ...days[0], rainMm: rainMm as number }, ...days.slice(1)]
    expect(() => validateRainfallDays(invalidDays, year)).toThrow('Invalid rainfall')
  })

  it('rejects blank rainfall, changed units, dataset, source status or provenance', () => {
    expect(() => validateRainfallBundle(csv.replace('2022-11-01,0.05', '2022-11-01,'), provenance, year)).toThrow('Invalid rainfall')
    expect(() => validateRainfallBundle(csv.replace('rain_mm', 'rain_inches'), provenance, year)).toThrow('rainfall in mm')
    expect(() => validateRainfallBundle(csv.replace('NASA_POWER_PRECTOTCORR_MERRA2', 'GPM_IMERG'), provenance, year)).toThrow('Unexpected rainfall source')
    expect(() => validateRainfallBundle(csv.replace(/transcribed_from_Arcveld_research_report__raw_NASA_response_not_attached/, 'provider_verified'), provenance, year)).toThrow('Unexpected rainfall source')
    expect(() => validateRainfallBundle(csv, { ...provenance, dayBasis: 'LST' }, year)).toThrow('provenance')
    expect(() => validateRainfallBundle(csv, { ...provenance, providerBytesIndependentlyVerified: true }, year)).toThrow('provenance')
    expect(() => validateRainfallBundle(csv, { ...provenance, totalRainMm: 1 }, year)).toThrow('total does not match')
  })
})
