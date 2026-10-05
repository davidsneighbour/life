/** Data the browser script needs. Shared by the server (writer) and the client (reader). */
export interface ClientLifeData {
  birthDay: number;
  totalDays: number;
  events: { name: string; color: string }[];
  /** [dot index, event ids ordered by priority] */
  days: [number, number[]][];
}

export const CLIENT_DATA_ID = "life-data";
export const TODAY_STYLE_ID = "life-today";

/**
 * CSS that greys out days not lived yet and marks today. `todayIndex` is the
 * 0-based dot index of today; values outside the life span are allowed.
 */
export function todayCss(todayIndex: number, totalDays: number): string {
  const rules: string[] = [];
  const firstFuture = Math.max(todayIndex + 1, 0);
  if (firstFuture < totalDays) {
    rules.push(
      `#life-grid>i:nth-child(n+${firstFuture + 1}){background-color:var(--dot-future)}`,
    );
  }
  if (todayIndex >= 0 && todayIndex < totalDays) {
    rules.push(
      `#life-grid>i:nth-child(${todayIndex + 1}){background-color:var(--dot-today);outline:1px solid var(--dot-today);outline-offset:-1px}`,
    );
  }
  return rules.join("\n");
}

export interface LifeStats {
  lived: number;
  remaining: number;
  percent: string;
}

export function lifeStats(todayIndex: number, totalDays: number): LifeStats {
  const lived = Math.min(Math.max(todayIndex + 1, 0), totalDays);
  return {
    lived,
    remaining: totalDays - lived,
    percent: ((lived / totalDays) * 100).toLocaleString("en-GB", {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    }),
  };
}
