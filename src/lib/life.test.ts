import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveColor } from "./colors.ts";
import {
  formatIsoDate,
  fromDayNumber,
  parseIsoDate,
  toDayNumber,
} from "./dates.ts";
import { buildLifeModel, occurrenceDays, parseLifeData } from "./life.ts";

const day = (iso: string): number => toDayNumber(parseIsoDate(iso));
const iso = (n: number): string => formatIsoDate(fromDayNumber(n));

describe("occurrenceDays", () => {
  it("repeats yearly and recovers after 29 February", () => {
    const days = occurrenceDays(
      parseIsoDate("2024-02-29"),
      "yearly",
      day("2024-01-01"),
      day("2029-01-01"),
    ).map(iso);
    assert.deepEqual(days, [
      "2024-02-29",
      "2025-02-28",
      "2026-02-28",
      "2027-02-28",
      "2028-02-29",
    ]);
  });

  it("repeats monthly on the last day of shorter months", () => {
    const days = occurrenceDays(
      parseIsoDate("2025-01-31"),
      "monthly",
      day("2025-01-01"),
      day("2025-05-01"),
    ).map(iso);
    assert.deepEqual(days, [
      "2025-01-31",
      "2025-02-28",
      "2025-03-31",
      "2025-04-30",
    ]);
  });

  it("starts weekly events at the first occurrence inside the range", () => {
    const days = occurrenceDays(
      parseIsoDate("2025-01-01"),
      "weekly",
      day("2025-01-10"),
      day("2025-01-31"),
    ).map(iso);
    assert.deepEqual(days, ["2025-01-15", "2025-01-22", "2025-01-29"]);
  });

  it("includes one-off events only inside the range", () => {
    assert.deepEqual(
      occurrenceDays(
        parseIsoDate("2025-01-01"),
        null,
        day("2025-01-02"),
        day("2026-01-01"),
      ),
      [],
    );
  });
});

describe("buildLifeModel", () => {
  const data = parseLifeData({
    life: { birthday: "1975-07-05", expectancy_years: 80.5 },
    events: [
      {
        date: "1975-07-05",
        event: "Birthday",
        type: "birthday",
        recurring: true,
        period: "yearly",
      },
      {
        date: "1976-01-01",
        event: "New Year",
        color: "#a3e635",
        recurring: true,
        frequency: "yearly",
      },
      { date: "2000-07-05", event: "Party", color: "rgb(1 2 3)" },
    ],
  });
  const life = buildLifeModel(data);

  it("counts every yearly birthday inside the life span", () => {
    // 1975 to 2055 inclusive; the life ends before 2056-07-05.
    assert.equal(life.events[0]?.occurrences, 81);
  });

  it("colours birthdays red by default", () => {
    assert.equal(life.events[0]?.color, resolveColor("red-600"));
  });

  it("puts one-off events before recurring events on the same day", () => {
    assert.deepEqual(
      life.dayEvents.get(day("2000-07-05") - life.birthDay),
      [2, 0],
    );
  });
});

describe("parseLifeData", () => {
  it("rejects recurring events without a period", () => {
    assert.throws(
      () =>
        parseLifeData({
          life: { birthday: "1975-07-05", expectancy_years: 80 },
          events: [{ date: "1975-07-05", event: "x", recurring: true }],
        }),
      /period/,
    );
  });

  it("rejects unknown colours at build time", () => {
    const data = parseLifeData({
      life: { birthday: "1975-07-05", expectancy_years: 80 },
      events: [{ date: "1975-07-05", event: "x", color: "nope-123" }],
    });
    assert.throws(() => buildLifeModel(data), /Unknown colour/);
  });
});

describe("resolveColor", () => {
  it("accepts hex, rgb, and Tailwind colours", () => {
    assert.equal(resolveColor("#c2410c"), "#c2410c");
    assert.equal(resolveColor("rgb(194 65 12)"), "rgb(194 65 12)");
    assert.match(resolveColor("orange-700"), /^oklch\(/);
    assert.equal(resolveColor("bg-orange-700"), resolveColor("orange-700"));
  });
});
