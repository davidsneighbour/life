/**
 * Calendar helpers that work on "day numbers": whole days since 1970-01-01 (UTC).
 * Working in UTC avoids daylight saving shifts; leap years follow from the
 * Gregorian calendar implemented by `Date.UTC`.
 */

export const MS_PER_DAY = 86_400_000;

export interface CalendarDate {
  year: number;
  /** 1-12 */
  month: number;
  /** 1-31 */
  day: number;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Parse a strict `YYYY-MM-DD` string. Throws on invalid input such as `2023-02-29`. */
export function parseIsoDate(value: string): CalendarDate {
  const match = ISO_DATE.exec(value);
  if (!match) {
    throw new Error(`Invalid date "${value}": expected YYYY-MM-DD.`);
  }
  const date: CalendarDate = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
  if (
    date.month < 1 ||
    date.month > 12 ||
    date.day < 1 ||
    date.day > daysInMonth(date.year, date.month)
  ) {
    throw new Error(
      `Invalid date "${value}": day does not exist in the calendar.`,
    );
  }
  return date;
}

export function toDayNumber(date: CalendarDate): number {
  return Math.round(Date.UTC(date.year, date.month - 1, date.day) / MS_PER_DAY);
}

export function fromDayNumber(dayNumber: number): CalendarDate {
  const d = new Date(dayNumber * MS_PER_DAY);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

export function formatIsoDate(date: CalendarDate): string {
  const pad = (n: number, width = 2): string => String(n).padStart(width, "0");
  return `${pad(date.year, 4)}-${pad(date.month)}-${pad(date.day)}`;
}

/**
 * Add whole years. A 29 February start falls back to 28 February in
 * non-leap years.
 */
export function addYears(date: CalendarDate, years: number): CalendarDate {
  const year = date.year + years;
  return {
    year,
    month: date.month,
    day: Math.min(date.day, daysInMonth(year, date.month)),
  };
}

/**
 * Day number of the end of a life that starts on `birth` and lasts
 * `years` years (fractions allowed). The result is exclusive: the last lived
 * day is `end - 1`.
 *
 * Whole years are calendar years. The fraction is applied to the length of
 * the following year, so 0.5 years is 183 days when that year contains a
 * 29 February and 182.5 → 183 days otherwise.
 */
export function lifeEndDayNumber(birth: CalendarDate, years: number): number {
  if (!Number.isFinite(years) || years <= 0) {
    throw new Error(`Life expectancy must be a positive number, got ${years}.`);
  }
  const whole = Math.floor(years);
  const fraction = years - whole;
  const wholeEnd = toDayNumber(addYears(birth, whole));
  const nextYearLength = toDayNumber(addYears(birth, whole + 1)) - wholeEnd;
  return wholeEnd + Math.round(fraction * nextYearLength);
}

/** The local calendar date of `now` as a day number (what the viewer calls "today"). */
export function localTodayDayNumber(now: Date = new Date()): number {
  return toDayNumber({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  });
}
