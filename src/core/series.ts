import { niceScale, thinIndices, type NiceScale } from "./scale.ts";
import { formatNumber, formatTick, type NumberFormat } from "./format.ts";

/** Chart geometry. Pure maths — every renderer (Astro, React, anything else)
 *  draws the same numbers, so a fix here fixes every app at once. */

export type ChartKind = "line" | "area" | "bar";

export interface ChartPoint {
  label: string;
  value: number | null;
  /** Tooltip body. Falls back to "<label> · <value><unit>". */
  tip?: string;
}

export interface ChartSeries {
  key: string;
  label: string;
  points: ChartPoint[];
}

export interface ChartOptions {
  kind?: ChartKind;
  width?: number;
  height?: number;
  format?: NumberFormat;
  unit?: string;
  tickCount?: number;
  maxXLabels?: number;
  /** Sparkline mode: no axes, no labels, no padding. */
  spark?: boolean;
  /** Lower values are better (pace, resting HR) — flips the y axis. */
  reverseY?: boolean;
}

export interface RenderMarker {
  index: number;
  x: number;
  y: number;
  value: number;
}

export interface RenderBar {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
}

export interface RenderSeries {
  key: string;
  label: string;
  /** 1–6. Series 7+ reuse no colour — they are rejected upstream. */
  slot: number;
  colorVar: string;
  /** One path per unbroken run; a null value ends a run rather than
   *  interpolating across a gap the data does not have. */
  segments: string[];
  /** One closed fill per unbroken run. A single path spanning a gap would
   *  draw a wedge across data that does not exist. */
  areaPaths: string[];
  markers: RenderMarker[];
  bars: RenderBar[];
  /** Last real point, for the direct label the palette's contrast relief needs. */
  last: RenderMarker | null;
}

export interface ChartColumn {
  index: number;
  label: string;
  x: number;
  x0: number;
  x1: number;
  values: { key: string; label: string; slot: number; value: number | null; tip: string }[];
}

export interface ChartGeometry {
  kind: ChartKind;
  width: number;
  height: number;
  pad: { top: number; right: number; bottom: number; left: number };
  innerW: number;
  innerH: number;
  scale: NiceScale;
  series: RenderSeries[];
  xTicks: { index: number; label: string; x: number }[];
  yTicks: { value: number; label: string; y: number }[];
  columns: ChartColumn[];
  zeroY: number | null;
  spark: boolean;
  /** ≥2 series means a legend is mandatory; ≤4 non-bar series also get
   *  direct labels (on bars they land on top of the last column). */
  showLegend: boolean;
  showDirectLabels: boolean;
  empty: boolean;
}

export const MAX_SERIES = 6;

const SPARK_PAD = { top: 2, right: 2, bottom: 2, left: 2 };

export function buildChart(input: ChartSeries[], options: ChartOptions = {}): ChartGeometry {
  const spark = options.spark ?? false;
  const kind: ChartKind = options.kind ?? "line";
  const format = options.format ?? "int";
  const unit = options.unit ?? "";
  const width = options.width ?? (spark ? 80 : 640);
  const height = options.height ?? (spark ? 28 : 220);

  const series = input.slice(0, MAX_SERIES);
  if (input.length > MAX_SERIES) {
    // Cycling hues would make two different things the same colour. Fold or facet.
    throw new Error(
      `@omarchy/ui: ${input.length} series exceeds the ${MAX_SERIES}-slot categorical palette. ` +
        `Fold the tail into "Other" or split into small multiples.`,
    );
  }

  const count = Math.max(...series.map((s) => s.points.length), 0);
  const allValues = series.flatMap((s) => s.points.map((p) => p.value)).filter((v): v is number => v != null);
  const empty = allValues.length === 0;

  // Bars are read against zero; lines are read against their own range.
  const zeroBased = kind === "bar";
  const scale = niceScale(
    empty ? 0 : Math.min(...allValues),
    empty ? 1 : Math.max(...allValues),
    spark ? 2 : (options.tickCount ?? 4),
    zeroBased,
  );

  // Left padding has to fit the widest y label, or the axis clips.
  const widestTick = scale.ticks.reduce((w, t) => Math.max(w, formatTick(t, scale.step, format).length), 1);
  const pad = spark
    ? SPARK_PAD
    : { top: 12, right: 14, bottom: 26, left: Math.max(30, widestTick * 7 + 10) };

  const innerW = Math.max(1, width - pad.left - pad.right);
  const innerH = Math.max(1, height - pad.top - pad.bottom);
  const span = scale.max - scale.min || 1;

  // Bars sit in bands; lines run edge to edge so the shape fills the frame.
  const banded = kind === "bar";
  const band = count > 0 ? innerW / count : innerW;
  const xOf = (i: number): number => {
    if (banded) return pad.left + band * i + band / 2;
    if (count <= 1) return pad.left + innerW / 2;
    return pad.left + (i / (count - 1)) * innerW;
  };
  const yOf = (v: number): number => {
    const t = (v - scale.min) / span;
    return options.reverseY ? pad.top + t * innerH : pad.top + innerH - t * innerH;
  };

  const baselineY = scale.min <= 0 && scale.max >= 0 ? yOf(0) : yOf(scale.min);

  // Grouped bars: each series gets a lane inside the band, with a 2px surface
  // gap between neighbouring fills so adjacent colours never touch.
  const laneCount = banded ? Math.max(1, series.length) : 1;
  const groupWidth = band * 0.72;
  const laneWidth = groupWidth / laneCount;
  const barWidth = Math.max(1, laneWidth - (laneCount > 1 ? 2 : 0));

  const rendered: RenderSeries[] = series.map((s, si) => {
    const slot = si + 1;
    const markers: RenderMarker[] = [];
    const bars: RenderBar[] = [];
    const segments: string[] = [];
    const runs: RenderMarker[][] = [];
    let run: string[] = [];
    let runMarkers: RenderMarker[] = [];

    for (let i = 0; i < count; i += 1) {
      const value = s.points[i]?.value ?? null;
      if (value == null) {
        if (run.length > 1) segments.push(run.join(" "));
        if (runMarkers.length > 1) runs.push(runMarkers);
        run = [];
        runMarkers = [];
        continue;
      }
      const x = xOf(i);
      const y = yOf(value);
      const marker: RenderMarker = { index: i, x, y, value };
      markers.push(marker);

      if (banded) {
        const laneX = pad.left + band * i + (band - groupWidth) / 2 + laneWidth * si;
        const top = Math.min(y, baselineY);
        const h = Math.abs(baselineY - y);
        bars.push({
          index: i,
          x: laneX + (laneWidth - barWidth) / 2,
          y: top,
          width: barWidth,
          // A zero-height bar is invisible; give a real zero a 1px presence.
          height: Math.max(h, value === 0 ? 0 : 1),
          value,
        });
      } else {
        run.push(`${run.length === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
        runMarkers.push(marker);
      }
    }
    if (run.length > 1) segments.push(run.join(" "));
    if (runMarkers.length > 1) runs.push(runMarkers);

    // Area fill only makes sense for a single series; stacked areas are a
    // different chart and are not what any of these apps draw.
    const areaPaths =
      kind === "area" && series.length === 1
        ? runs.map((r) => {
            const head = `M${r[0].x.toFixed(1)} ${r[0].y.toFixed(1)}`;
            const body = r.slice(1).map((m) => `L${m.x.toFixed(1)} ${m.y.toFixed(1)}`).join(" ");
            const base = baselineY.toFixed(1);
            return `${head} ${body} L${r[r.length - 1].x.toFixed(1)} ${base} L${r[0].x.toFixed(1)} ${base} Z`;
          })
        : [];

    return {
      key: s.key,
      label: s.label,
      slot,
      colorVar: `var(--om-series-${slot})`,
      segments,
      areaPaths,
      markers,
      bars,
      last: markers.length ? markers[markers.length - 1] : null,
    };
  });

  const labelsSource = series[0]?.points ?? [];
  const xTicks = spark
    ? []
    : thinIndices(count, options.maxXLabels ?? 8).map((i) => ({
        index: i,
        label: labelsSource[i]?.label ?? "",
        x: xOf(i),
      }));

  const yTicks = spark
    ? []
    : scale.ticks.map((value) => ({
        value,
        label: formatTick(value, scale.step, format),
        y: yOf(value),
      }));

  const columns: ChartColumn[] = Array.from({ length: count }, (_, i) => {
    const x = xOf(i);
    const half = banded ? band / 2 : count > 1 ? innerW / (count - 1) / 2 : innerW / 2;
    return {
      index: i,
      label: labelsSource[i]?.label ?? "",
      x,
      x0: Math.max(pad.left, x - half),
      x1: Math.min(pad.left + innerW, x + half),
      values: series.map((s, si) => {
        const p = s.points[i];
        const v = p?.value ?? null;
        return {
          key: s.key,
          label: s.label,
          slot: si + 1,
          value: v,
          tip: p?.tip ?? (v == null ? "no data" : `${formatNumber(v, format)}${unit ? ` ${unit}` : ""}`),
        };
      }),
    };
  });

  return {
    kind,
    width,
    height,
    pad,
    innerW,
    innerH,
    scale,
    series: rendered,
    xTicks,
    yTicks,
    columns,
    zeroY: scale.min < 0 && scale.max > 0 ? yOf(0) : null,
    spark,
    showLegend: !spark && series.length >= 2,
    showDirectLabels: !spark && kind !== "bar" && series.length >= 2 && series.length <= 4,
    empty,
  };
}
