const millisecondsPerDay = 86_400_000

function utcTimestamp(dateIso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
    throw new Error('Use an ISO calendar date (YYYY-MM-DD) in UTC.')
  }

  const timestamp = Date.parse(`${dateIso}T00:00:00Z`)
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== dateIso) {
    throw new Error(`Invalid UTC calendar date: ${dateIso}.`)
  }
  return timestamp
}

export function utcDayIndex(startIso: string, dateIso: string) {
  return (utcTimestamp(dateIso) - utcTimestamp(startIso)) / millisecondsPerDay
}

export function historicalWindow(startYear: number) {
  if (!Number.isInteger(startYear) || startYear < 1 || startYear > 9998) {
    throw new Error('Use a valid historical starting year.')
  }

  const startIso = `${String(startYear).padStart(4, '0')}-11-01`
  const endIso = `${String(startYear + 1).padStart(4, '0')}-01-15`
  const start = utcTimestamp(startIso)
  const dayCount = utcDayIndex(startIso, endIso) + 1
  const dates = Array.from({ length: dayCount }, (_, index) =>
    new Date(start + index * millisecondsPerDay).toISOString().slice(0, 10),
  )
  return { startIso, endIso, dates }
}
