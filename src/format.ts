const numeric = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const signedNumeric = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero',
})
const contributionNumeric = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 4, signDisplay: 'exceptZero',
})
const dateLabel = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'UTC' })
const shortDateLabel = new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric', timeZone: 'UTC' })

export const formatNumber = (value: number) => numeric.format(value)
export const formatSigned = (value: number) => signedNumeric.format(value).replace('-', '−')
export const formatContribution = (value: number) => contributionNumeric.format(value).replace('-', '−')
export const formatDate = (iso: string) => dateLabel.format(new Date(iso))
export const formatShortDate = (iso: string) => shortDateLabel.format(new Date(iso))
