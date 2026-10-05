import { z } from "astro/zod";
import { resolveColor } from "./colors.ts";
import {
  addYears,
  type CalendarDate,
  daysInMonth,
  lifeEndDayNumber,
  parseIsoDate,
  toDayNumber,
} from "./dates.ts";

export const PERIODS = ["yearly", "monthly", "weekly", "daily"] as const;
export type Period = (typeof PERIODS)[number];

/** Colour used for events of type "birthday" that do not set their own colour. */
export const DEFAULT_BIRTHDAY_COLOR = "red-600";
/** Colour used for other events that do not set their own colour. */
export const DEFAULT_EVENT_COLOR = "sky-500";

const isoDate = z.string().refine(
  (value) => {
    try {
      parseIsoDate(value);
      return true;
    } catch {
      return false;
    }
  },
  { message: "Expected an existing date in YYYY-MM-DD format" },
);

const eventSchema = z
  .object({
    date: isoDate,
    event: z.string().min(1),
    type: z.enum(["birthday", "event"]).default("event"),
    color: z.string().min(1).optional(),
    recurring: z.boolean().default(false),
    period: z.enum(PERIODS).optional(),
    /** Alias for `period`. */
    frequency: z.enum(PERIODS).optional(),
    /** Last date (inclusive) on which a recurring event can occur. */
    until: isoDate.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.period && value.frequency && value.period !== value.frequency) {
      ctx.addIssue({
        code: "custom",
        message: '"period" and "frequency" are both set and differ',
      });
    }
    if (value.recurring && !value.period && !value.frequency) {
      ctx.addIssue({
        code: "custom",
        message: 'Recurring events need a "period" (or "frequency")',
      });
    }
    if (!value.recurring && (value.period || value.frequency || value.until)) {
      ctx.addIssue({
        code: "custom",
        message:
          '"period", "frequency", and "until" are only valid when "recurring" is true',
      });
    }
  });

export const lifeDataSchema = z
  .object({
    life: z
      .object({
        birthday: isoDate,
        expectancy_years: z.number().positive().max(150),
      })
      .strict(),
    events: z.array(eventSchema).default([]),
  })
  .strict();

export type LifeData = z.infer<typeof lifeDataSchema>;
type EventInput = LifeData["events"][number];

export interface LifeEvent {
  id: number;
  name: string;
  type: "birthday" | "event";
  /** Resolved CSS colour value. */
  color: string;
  period: Period | null;
  /** Number of days inside the life span on which this event occurs. */
  occurrences: number;
}

export interface LifeModel {
  /** Day number of the date of birth (first dot). */
  birthDay: number;
  /** Exclusive end day number (first day after the last dot). */
  endDay: number;
  totalDays: number;
  expectancyYears: number;
  events: LifeEvent[];
  /**
   * Event ids per dot index, ordered by priority. The first id decides the dot
   * colour; all names are listed in the tooltip.
   */
  dayEvents: Map<number, number[]>;
}

/** One-off events win over recurring ones; rarer periods win over frequent ones. */
const PRIORITY: Record<Period | "once", number> = {
  once: 0,
  yearly: 1,
  monthly: 2,
  weekly: 3,
  daily: 4,
};

function addMonthsClamped(anchor: CalendarDate, months: number): CalendarDate {
  const zeroBased = anchor.month - 1 + months;
  const year = anchor.year + Math.floor(zeroBased / 12);
  const month = (((zeroBased % 12) + 12) % 12) + 1;
  return { year, month, day: Math.min(anchor.day, daysInMonth(year, month)) };
}

/** All day numbers in [from, to) on which an event occurs. */
export function occurrenceDays(
  anchor: CalendarDate,
  period: Period | null,
  from: number,
  to: number,
): number[] {
  const start = toDayNumber(anchor);
  if (period === null) {
    return start >= from && start < to ? [start] : [];
  }

  const days: number[] = [];
  if (period === "daily" || period === "weekly") {
    const step = period === "daily" ? 1 : 7;
    const first =
      start >= from ? start : start + Math.ceil((from - start) / step) * step;
    for (let day = first; day < to; day += step) {
      days.push(day);
    }
    return days;
  }

  // Yearly and monthly steps are computed from the anchor each time, so a
  // 31st or a 29 February clamps for one occurrence and recovers afterwards.
  for (let k = 0; ; k += 1) {
    const day = toDayNumber(
      period === "yearly" ? addYears(anchor, k) : addMonthsClamped(anchor, k),
    );
    if (day >= to) {
      break;
    }
    if (day >= from) {
      days.push(day);
    }
  }
  return days;
}

function eventColor(input: EventInput): string {
  const raw =
    input.color ??
    (input.type === "birthday" ? DEFAULT_BIRTHDAY_COLOR : DEFAULT_EVENT_COLOR);
  try {
    return resolveColor(raw);
  } catch (error) {
    throw new Error(
      `Event "${input.event}" (${input.date}): ${(error as Error).message}`,
    );
  }
}

export function buildLifeModel(data: LifeData): LifeModel {
  const birth = parseIsoDate(data.life.birthday);
  const birthDay = toDayNumber(birth);
  const endDay = lifeEndDayNumber(birth, data.life.expectancy_years);

  const events: LifeEvent[] = [];
  const dayEvents = new Map<number, number[]>();

  data.events.forEach((input, id) => {
    const period = input.recurring
      ? (input.period ?? input.frequency ?? null)
      : null;
    const until = input.until
      ? toDayNumber(parseIsoDate(input.until)) + 1
      : endDay;
    const days = occurrenceDays(
      parseIsoDate(input.date),
      period,
      birthDay,
      Math.min(until, endDay),
    );

    for (const day of days) {
      const index = day - birthDay;
      const list = dayEvents.get(index);
      if (list) {
        list.push(id);
      } else {
        dayEvents.set(index, [id]);
      }
    }

    events.push({
      id,
      name: input.event,
      type: input.type,
      color: eventColor(input),
      period,
      occurrences: days.length,
    });
  });

  const rank = (id: number): number => PRIORITY[events[id]?.period ?? "once"];
  for (const list of dayEvents.values()) {
    // Stable sort: equal priority keeps the order of the data file.
    list.sort((a, b) => rank(a) - rank(b));
  }

  return {
    birthDay,
    endDay,
    totalDays: endDay - birthDay,
    expectancyYears: data.life.expectancy_years,
    events,
    dayEvents,
  };
}

export function parseLifeData(raw: unknown, source = "life data"): LifeData {
  const result = lifeDataSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map(
        (issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`,
      )
      .join("\n");
    throw new Error(`Invalid ${source}:\n${details}`);
  }
  return result.data;
}
