import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addYears,
  formatIsoDate,
  fromDayNumber,
  isLeapYear,
  lifeEndDayNumber,
  parseIsoDate,
  toDayNumber,
} from "./dates.ts";

describe("dates", () => {
  it("detects leap years", () => {
    assert.equal(isLeapYear(1976), true);
    assert.equal(isLeapYear(1900), false);
    assert.equal(isLeapYear(2000), true);
    assert.equal(isLeapYear(2023), false);
  });

  it("rejects dates that do not exist", () => {
    assert.throws(() => parseIsoDate("2023-02-29"));
    assert.throws(() => parseIsoDate("1975-7-5"));
    assert.deepEqual(parseIsoDate("2024-02-29"), {
      year: 2024,
      month: 2,
      day: 29,
    });
  });

  it("round-trips day numbers", () => {
    const day = toDayNumber(parseIsoDate("1975-07-05"));
    assert.equal(formatIsoDate(fromDayNumber(day)), "1975-07-05");
    assert.equal(toDayNumber(parseIsoDate("1970-01-01")), 0);
  });

  it("clamps 29 February in non-leap years", () => {
    assert.deepEqual(addYears(parseIsoDate("2024-02-29"), 1), {
      year: 2025,
      month: 2,
      day: 28,
    });
    assert.deepEqual(addYears(parseIsoDate("2024-02-29"), 4), {
      year: 2028,
      month: 2,
      day: 29,
    });
  });

  it("computes the life span with leap years", () => {
    const birth = parseIsoDate("1975-07-05");
    const end = lifeEndDayNumber(birth, 80.5);
    // 80 calendar years to 2055-07-05, then half of the 366-day year to 2056-07-05.
    assert.equal(end - toDayNumber(addYears(birth, 80)), 183);
    assert.equal(formatIsoDate(fromDayNumber(end)), "2056-01-04");
    // 80 × 365 days + 20 leap days (1976 to 2052) + 183 days.
    assert.equal(end - toDayNumber(birth), 80 * 365 + 20 + 183);
  });
});
