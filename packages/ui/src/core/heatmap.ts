import { addDaysISO, diffDaysISO, mondayOf, monthLabel, todayISO, weekdayIndex } from "./format.ts";

/** Calendar heatmap geometry — the grid health-board and split-log each built
 *  separately, with different week alignment and different level maths. */

export interface HeatmapCell {
  date: string;
  value: number;
  /** 0 = nothing logged, 1–4 = magnitude. 0 wears --om-ramp-0, a surface tone. */
  level: number;
  /** Padding cells outside the requested range, and days after today. */
  blank: boolean;
}

export interface HeatmapOptions {
  /** Defaults to today in `timeZone`. */
  end?: string;
  /** Number of week columns. Ignored when `start` is given. */
  weeks?: number;
  start?: string;
  timeZone?: string;
  /** Explicit upper bounds for levels 1–3; anything above is level 4.
   *  Omit for quartiles of the observed maximum. */
  thresholds?: number[];
}

export interface HeatmapGeometry {
  weeks: HeatmapCell[][];
  months: { label: string; column: number }[];
  max: number;
  total: number;
  activeDays: number;
  start: string;
  end: string;
  /** Upper bound of each level, for the legend. */
  thresholds: number[];
}

function toMap(values: Record<string, number> | Map<string, number>): Map<string, number> {
  return values instanceof Map ? values : new Map(Object.entries(values));
}

export function buildHeatmap(
  values: Record<string, number> | Map<string, number>,
  options: HeatmapOptions = {},
): HeatmapGeometry {
  const byDate = toMap(values);
  const end = options.end ?? todayISO(options.timeZone);
  const weekCount = options.weeks ?? 16;

  // Columns are whole Monday-start weeks, so weekday rows line up across apps.
  const lastMonday = mondayOf(end);
  const start = options.start ? mondayOf(options.start) : addDaysISO(lastMonday, -7 * (weekCount - 1));
  const columns = Math.max(1, Math.floor(diffDaysISO(start, lastMonday) / 7) + 1);

  const observed = [...byDate.entries()]
    .filter(([date]) => date >= start && date <= end)
    .map(([, v]) => v)
    .filter((v) => v > 0);
  const max = observed.length ? Math.max(...observed) : 0;

  const thresholds =
    options.thresholds ??
    (max > 0 ? [max * 0.25, max * 0.5, max * 0.75].map((v) => Number(v.toFixed(4))) : [1, 2, 3]);

  const level = (value: number): number => {
    if (value <= 0) return 0;
    if (value <= thresholds[0]) return 1;
    if (value <= thresholds[1]) return 2;
    if (value <= thresholds[2]) return 3;
    return 4;
  };

  const weeks: HeatmapCell[][] = [];
  for (let c = 0; c < columns; c += 1) {
    const column: HeatmapCell[] = [];
    for (let d = 0; d < 7; d += 1) {
      const date = addDaysISO(start, c * 7 + d);
      const blank = date > end;
      const value = byDate.get(date) ?? 0;
      column.push({ date, value: blank ? 0 : value, level: blank ? 0 : level(value), blank });
    }
    weeks.push(column);
  }

  const months: { label: string; column: number }[] = [];
  let previous = "";
  weeks.forEach((column, index) => {
    const label = monthLabel(column[0].date);
    if (label !== previous) {
      months.push({ label, column: index });
      previous = label;
    }
  });

  let total = 0;
  let activeDays = 0;
  for (const column of weeks) {
    for (const cell of column) {
      if (cell.blank || cell.value <= 0) continue;
      total += cell.value;
      activeDays += 1;
    }
  }

  return { weeks, months, max, total, activeDays, start, end, thresholds };
}

export { weekdayIndex };
