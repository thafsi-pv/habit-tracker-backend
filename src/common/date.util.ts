/**
 * Parses a YYYY-MM-DD string into a Date at UTC midnight, matching how
 * Prisma's @db.Date columns store calendar days (no time component).
 * Callers are responsible for resolving "today" in the *user's* timezone
 * before formatting it into this string — this util does no timezone math.
 */
export function parseCalendarDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Returns today's date string (YYYY-MM-DD) as observed in the given IANA timezone. */
export function todayInTimezone(timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA formats as YYYY-MM-DD
  return formatter.format(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const d = parseCalendarDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return formatCalendarDate(d);
}
