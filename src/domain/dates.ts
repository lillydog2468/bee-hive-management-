const PRAGUE = 'Europe/Prague'

/** Calendar date in Europe/Prague, as YYYY-MM-DD. */
export function todayInPrague(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PRAGUE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function formatUkDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) return isoDate
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function formatLitres(litres: number): string {
  const rounded = Math.round(litres * 100) / 100
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded)
  return rounded === 1 ? '1 litre' : `${text} litres`
}
