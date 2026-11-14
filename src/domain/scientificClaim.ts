import { comparisonTolerance } from './evidence'
import type { compareAgainstBaselines } from './exposure'

type ClaimInputs = Pick<ReturnType<typeof compareAgainstBaselines>,
  'dailyDifference' | 'equalBaselines' | 'extendsPastWindow'>

export function formatScientificClaim({ dailyDifference, equalBaselines, extendsPastWindow }: ClaimInputs) {
  if (extendsPastWindow) {
    return {
      title: 'A residue schedule extends past the window.',
      detail: 'Its added cover reaches zero after the final UTC date. The totals use only days inside the window.',
    }
  }
  if (!equalBaselines) {
    return {
      title: 'The calendar and uniform-rainfall baselines do not both tie.',
      detail: 'The daily exposure comparison also reflects differences in calendar cover.',
    }
  }
  return {
    title: 'Calendar and uniform-rainfall baselines tie.',
    detail: Math.abs(dailyDifference) > comparisonTolerance
      ? 'The historical difference comes from when rain coincided with uncovered ground.'
      : 'The daily rainfall estimates also tie within calculation tolerance.',
  }
}
