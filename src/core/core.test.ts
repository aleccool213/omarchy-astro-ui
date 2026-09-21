import { test } from "node:test";
import assert from "node:assert/strict";
import { niceScale, thinIndices, bandCentres } from "./scale.ts";
import { paginate, pageWindow } from "./paginate.ts";
import { buildChart } from "./series.ts";
import { buildHeatmap } from "./heatmap.ts";
import { addDaysISO, mondayOf, weekdayIndex, formatTick, formatNumber } from "./format.ts";

test("niceScale lands on round steps", () => {
  const s = niceScale(3, 97, 4);
  assert.equal(s.min, 0);
  assert.equal(s.max, 100);
  assert.equal(s.step, 20);
  assert.deepEqual(s.ticks, [0, 20, 40, 60, 80, 100]);
});

test("niceScale does not force zero for line data", () => {
  const s = niceScale(120, 140, 4);
  assert.ok(s.min >= 100, `expected a zoomed axis, got min ${s.min}`);
});

test("niceScale forces zero when asked (bars)", () => {
  const s = niceScale(120, 140, 4, true);
  assert.equal(s.min, 0);
});

test("niceScale survives a flat series", () => {
  const s = niceScale(5, 5, 4);
  assert.ok(s.max > s.min);
  assert.ok(s.ticks.length >= 2);
});

test("niceScale survives all-zero data", () => {
  const s = niceScale(0, 0, 4, true);
  assert.ok(s.max > s.min);
  assert.ok(Number.isFinite(s.step) && s.step > 0);
});

test("niceScale ticks do not drift on fractional steps", () => {
  const s = niceScale(0, 1, 4);
  for (const t of s.ticks) {
    assert.equal(t, Number(t.toFixed(6)), `tick ${t} carries float noise`);
  }
});

test("formatTick agrees with its step", () => {
  assert.equal(formatTick(0.5, 0.5), "0.5");
  assert.equal(formatTick(1, 0.5), "1.0");
  assert.equal(formatTick(25, 25), "25");
});

test("formatNumber k-notation", () => {
  assert.equal(formatNumber(950, "k"), "950");
  assert.equal(formatNumber(1500, "k"), "1.5k");
  assert.equal(formatNumber(12000, "k"), "12k");
});

test("thinIndices keeps first and last", () => {
  const kept = thinIndices(50, 8);
  assert.equal(kept[0], 0);
  assert.equal(kept[kept.length - 1], 49);
  assert.ok(kept.length <= 9);
});

test("thinIndices is identity below the cap", () => {
  assert.deepEqual(thinIndices(4, 8), [0, 1, 2, 3]);
});

test("bandCentres centres each band", () => {
  assert.deepEqual(bandCentres(2, 0, 100), [25, 75]);
});

test("paginate clamps an out-of-range page", () => {
  const items = Array.from({ length: 12 }, (_, i) => i);
  assert.equal(paginate(items, 99, 5).page, 3);
  assert.equal(paginate(items, -4, 5).page, 1);
  assert.equal(paginate(items, Number.NaN, 5).page, 1);
});

test("paginate reports a human range", () => {
  const items = Array.from({ length: 57 }, (_, i) => i);
  const p = paginate(items, 2, 10);
  assert.equal(p.from, 11);
  assert.equal(p.to, 20);
  assert.equal(p.pageCount, 6);
  assert.ok(p.hasPrev && p.hasNext);
});

test("paginate handles an empty list", () => {
  const p = paginate([], 1, 10);
  assert.equal(p.pageCount, 1);
  assert.equal(p.from, 0);
  assert.equal(p.to, 0);
  assert.equal(p.hasNext, false);
});

test("pageWindow always shows first and last", () => {
  const w = pageWindow(10, 20, 5);
  assert.equal(w[0], 1);
  assert.equal(w[w.length - 1], 20);
  assert.ok(w.includes("gap"));
  assert.ok(w.includes(10));
});

test("pageWindow stays un-elided when it fits", () => {
  assert.deepEqual(pageWindow(2, 5, 5), [1, 2, 3, 4, 5]);
});

test("buildChart breaks the line at nulls instead of bridging them", () => {
  const g = buildChart([
    {
      key: "a",
      label: "A",
      points: [
        { label: "1", value: 1 },
        { label: "2", value: null },
        { label: "3", value: 3 },
        { label: "4", value: 4 },
      ],
    },
  ]);
  assert.equal(g.series[0].segments.length, 1, "the single-point run before the gap is not a segment");
  assert.equal(g.series[0].markers.length, 3);
});

test("buildChart refuses to cycle the categorical palette", () => {
  const many = Array.from({ length: 7 }, (_, i) => ({
    key: `s${i}`,
    label: `S${i}`,
    points: [{ label: "1", value: i }],
  }));
  assert.throws(() => buildChart(many), /exceeds the 6-slot categorical palette/);
});

test("buildChart flags legend and direct labels by series count", () => {
  const mk = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ key: `s${i}`, label: `S${i}`, points: [{ label: "1", value: 1 }] }));
  assert.equal(buildChart(mk(1)).showLegend, false, "one series is named by the title");
  assert.equal(buildChart(mk(2)).showLegend, true);
  assert.equal(buildChart(mk(4)).showDirectLabels, true);
  assert.equal(buildChart(mk(5)).showDirectLabels, false);
});

test("buildChart leaves room for wide y labels", () => {
  const wide = buildChart([
    { key: "a", label: "A", points: [{ label: "1", value: 0 }, { label: "2", value: 100000 }] },
  ]);
  const narrow = buildChart([
    { key: "a", label: "A", points: [{ label: "1", value: 0 }, { label: "2", value: 4 }] },
  ]);
  assert.ok(wide.pad.left > narrow.pad.left);
});

test("buildChart survives an all-null series", () => {
  const g = buildChart([{ key: "a", label: "A", points: [{ label: "1", value: null }] }]);
  assert.equal(g.empty, true);
  assert.ok(Number.isFinite(g.scale.step) && g.scale.step > 0);
});

test("buildChart gives grouped bars a gap between fills", () => {
  const g = buildChart(
    [
      { key: "a", label: "A", points: [{ label: "1", value: 5 }] },
      { key: "b", label: "B", points: [{ label: "1", value: 7 }] },
    ],
    { kind: "bar" },
  );
  const [a, b] = [g.series[0].bars[0], g.series[1].bars[0]];
  assert.ok(b.x >= a.x + a.width, "adjacent bar fills must not touch");
});

test("buildChart bars are measured from zero", () => {
  const g = buildChart([{ key: "a", label: "A", points: [{ label: "1", value: 50 }] }], { kind: "bar" });
  assert.equal(g.scale.min, 0);
});

test("weekday maths is Monday-first", () => {
  assert.equal(weekdayIndex("2026-09-21"), 0, "2026-09-21 is a Monday");
  assert.equal(weekdayIndex("2026-09-27"), 6);
  assert.equal(mondayOf("2026-09-24"), "2026-09-21");
  assert.equal(mondayOf("2026-09-21"), "2026-09-21");
});

test("addDaysISO crosses a month boundary", () => {
  assert.equal(addDaysISO("2026-01-31", 1), "2026-02-01");
  assert.equal(addDaysISO("2026-03-01", -1), "2026-02-28");
});

test("buildHeatmap builds whole Monday weeks ending on the end date", () => {
  const g = buildHeatmap({ "2026-09-15": 3 }, { end: "2026-09-24", weeks: 4 });
  assert.equal(g.weeks.length, 4);
  for (const col of g.weeks) assert.equal(col.length, 7);
  assert.equal(weekdayIndex(g.weeks[0][0].date), 0);
  assert.equal(g.total, 3);
  assert.equal(g.activeDays, 1);
});

test("buildHeatmap blanks days after the end date", () => {
  const g = buildHeatmap({}, { end: "2026-09-24", weeks: 2 });
  const last = g.weeks[g.weeks.length - 1];
  assert.equal(last[6].blank, true, "Sunday after a Thursday end date is blank");
  assert.equal(last[0].blank, false);
});

test("buildHeatmap scales levels to the observed max", () => {
  const g = buildHeatmap({ "2026-09-21": 1, "2026-09-22": 100 }, { end: "2026-09-24", weeks: 1 });
  const byDate = new Map(g.weeks.flat().map((c) => [c.date, c]));
  assert.equal(byDate.get("2026-09-21")!.level, 1);
  assert.equal(byDate.get("2026-09-22")!.level, 4);
  assert.equal(byDate.get("2026-09-23")!.level, 0);
});

test("buildHeatmap honours explicit thresholds", () => {
  const g = buildHeatmap({ "2026-09-21": 2 }, { end: "2026-09-24", weeks: 1, thresholds: [1, 2, 3] });
  const cell = g.weeks.flat().find((c) => c.date === "2026-09-21")!;
  assert.equal(cell.level, 2);
});

test("buildHeatmap survives no data at all", () => {
  const g = buildHeatmap({}, { end: "2026-09-24", weeks: 3 });
  assert.equal(g.max, 0);
  assert.equal(g.total, 0);
  assert.ok(g.weeks.flat().every((c) => c.level === 0));
});

test("buildChart closes one area fill per run, never across a gap", () => {
  const g = buildChart(
    [
      {
        key: "a",
        label: "A",
        points: [
          { label: "1", value: 1 },
          { label: "2", value: 2 },
          { label: "3", value: null },
          { label: "4", value: 3 },
          { label: "5", value: 4 },
        ],
      },
    ],
    { kind: "area" },
  );
  assert.equal(g.series[0].areaPaths.length, 2, "a gap splits the fill in two");
  for (const d of g.series[0].areaPaths) {
    assert.equal((d.match(/M/g) || []).length, 1, "each fill is a single closed subpath");
    assert.ok(d.endsWith("Z"));
  }
});

test("buildChart only fills an area for a single series", () => {
  const two = buildChart(
    [
      { key: "a", label: "A", points: [{ label: "1", value: 1 }, { label: "2", value: 2 }] },
      { key: "b", label: "B", points: [{ label: "1", value: 2 }, { label: "2", value: 3 }] },
    ],
    { kind: "area" },
  );
  assert.deepEqual(two.series[0].areaPaths, [], "stacked areas are a different chart");
});

test("buildChart omits direct labels on bars", () => {
  const bars = buildChart(
    [
      { key: "a", label: "A", points: [{ label: "1", value: 1 }] },
      { key: "b", label: "B", points: [{ label: "1", value: 2 }] },
    ],
    { kind: "bar" },
  );
  assert.equal(bars.showLegend, true);
  assert.equal(bars.showDirectLabels, false, "a label would land on top of the last column");
});

test("niceScale never returns more ticks than asked for, plus one", () => {
  for (const [min, max] of [[5, 5], [3, 97], [0, 1], [120, 140], [6.4, 8], [0, 0.03], [-12, 47]]) {
    const s = niceScale(min, max, 4);
    assert.ok(s.ticks.length <= 6, `niceScale(${min},${max}) produced ${s.ticks.length} ticks`);
  }
});

test("formatNumber locale groups thousands", () => {
  assert.equal(formatNumber(3386, "locale"), "3,386");
  assert.equal(formatNumber(999, "locale"), "999");
  assert.equal(formatNumber(1234567, "locale"), "1,234,567");
  assert.equal(formatNumber(3386, "int"), "3386", "int stays ungrouped for axis ticks");
});
