interface ResidueReturn {
  readonly startIndex: number
  readonly peak: number
  readonly plateauDays: number
  readonly durationDays: number
}

interface CoverConfig {
  readonly baseCover: number | readonly number[]
  readonly residue?: ResidueReturn
}

export interface CoverTrajectory {
  readonly fractions: readonly number[]
  readonly extendsPastWindow: boolean
}

export function assertCoverFraction(value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error('Ground cover must be between 0% and 100%.')
  }
}

export function makeCoverCurve({ baseCover, residue }: CoverConfig, dayCount: number): CoverTrajectory {
  if (!Number.isSafeInteger(dayCount) || dayCount < 1) {
    throw new Error('The cover window must contain at least one whole day.')
  }
  if (typeof baseCover !== 'number' && baseCover.length !== dayCount) {
    throw new Error('Baseline cover must contain one value per day.')
  }

  if (residue) {
    const { startIndex, peak, plateauDays, durationDays } = residue
    assertCoverFraction(peak)
    if (!Number.isSafeInteger(startIndex) || startIndex < 0 || startIndex >= dayCount) {
      throw new Error('The return date must fall inside the historical window.')
    }
    if (!Number.isSafeInteger(plateauDays) || !Number.isSafeInteger(durationDays) ||
        plateauDays < 0 || durationDays <= plateauDays) {
      throw new Error('The plateau must be a nonnegative number of whole days shorter than the duration.')
    }
  }

  const fractions = Array.from({ length: dayCount }, (_, day) => {
    const baseline = typeof baseCover === 'number' ? baseCover : baseCover[day]
    assertCoverFraction(baseline)
    if (!residue || day < residue.startIndex) return baseline

    const age = day - residue.startIndex
    const { peak, plateauDays, durationDays } = residue
    const extra = peak * Math.max(0, Math.min(1, (durationDays - age) / (durationDays - plateauDays)))
    return Math.min(1, baseline + extra)
  })

  return {
    fractions,
    // Duration is the age at which extra cover reaches zero.
    extendsPastWindow: residue !== undefined && residue.peak > 0 &&
      residue.durationDays >= dayCount - residue.startIndex,
  }
}

type Constraint = 'yes' | 'no' | 'unknown'

interface FeasibilityConstraints {
  readonly usableResidue: Constraint
  readonly grazingControl: Constraint
  readonly earlyWorkable: Constraint
  readonly lateWorkable: Constraint
}

function operationStatus(constraints: readonly Constraint[]) {
  if (constraints.includes('no')) return 'blocked'
  if (constraints.includes('unknown')) return 'conditional'
  return 'workable'
}

export function evaluateFeasibility(constraints: FeasibilityConstraints) {
  const common = [constraints.usableResidue, constraints.grazingControl]
  return {
    early: operationStatus([...common, constraints.earlyWorkable]),
    late: operationStatus([...common, constraints.lateWorkable]),
  }
}
