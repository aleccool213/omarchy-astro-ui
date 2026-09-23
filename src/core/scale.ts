/** Axis scales. Ticks land on 1/2/5×10ⁿ so the labels read like round numbers. */

export interface NiceScale {
  min: number;
  max: number;
  step: number;
  ticks: number[];
}

function niceNum(range: number, round: boolean): number {
  if (range <= 0) return 1;
  const exp = Math.floor(Math.log10(range));
  const frac = range / 10 ** exp;
  let nice: number;
  if (round) {
    if (frac < 1.5) nice = 1;
    else if (frac < 3) nice = 2;
    else if (frac < 7) nice = 5;
    else nice = 10;
  } else {
    if (frac <= 1) nice = 1;
    else if (frac <= 2) nice = 2;
    else if (frac <= 5) nice = 5;
    else nice = 10;
  }
  return nice * 10 ** exp;
}

/** Next value up the 1-2-5 ladder: 0.2 → 0.5 → 1 → 2 → 5 → 10. */
function nextNiceStep(step: number): number {
  const exp = Math.floor(Math.log10(step));
  const frac = step / 10 ** exp;
  if (frac < 1.5) return 2 * 10 ** exp;
  if (frac < 3.5) return 5 * 10 ** exp;
  return 10 ** (exp + 1);
}

/**
 * @param zeroBased force the axis to include 0 (bars must, lines must not —
 *        a line chart zoomed to its data is the point of a line chart).
 * @param minStep smallest tick step allowed. Pass 1 for counts: a count axis
 *        with a 0.25 step either shows fractional workouts or, rounded, shows
 *        "0, 0, 1, 1, 1".
 */
export function niceScale(
  rawMin: number,
  rawMax: number,
  tickCount = 4,
  zeroBased = false,
  minStep = 0,
): NiceScale {
  let min = Number.isFinite(rawMin) ? rawMin : 0;
  let max = Number.isFinite(rawMax) ? rawMax : 1;
  if (min > max) [min, max] = [max, min];
  if (zeroBased) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  }

  // A flat series still deserves a readable axis rather than a divide-by-zero.
  if (min === max) {
    if (zeroBased) {
      // Only an all-zero series is still flat after zero-basing. It is a count
      // with nothing in it, so 0..1 — not the -1..1 that padding would give.
      max = 1;
    } else {
      const pad = Math.abs(min) > 0 ? Math.abs(min) * 0.1 : 1;
      min -= pad;
      max += pad;
    }
  }

  let step = Math.max(minStep, niceNum(niceNum(max - min, false) / Math.max(1, tickCount), true));
  let niceMin = Math.floor(min / step) * step;
  let niceMax = Math.ceil(max / step) * step;

  // niceNum rounds the *step*, which can still leave more intervals than asked
  // for (a span of 1.2 at tickCount 4 lands on 0.2 — six gridlines in a 220px
  // frame). Walk the step up the 1-2-5 ladder until the axis fits.
  let guard = 0;
  while (Math.round((niceMax - niceMin) / step) > tickCount + 1 && guard < 12) {
    step = nextNiceStep(step);
    niceMin = Math.floor(min / step) * step;
    niceMax = Math.ceil(max / step) * step;
    guard += 1;
  }

  const ticks: number[] = [];
  // Accumulating `v += step` drifts on values like 0.1; multiply instead.
  const count = Math.round((niceMax - niceMin) / step);
  for (let i = 0; i <= count; i += 1) {
    ticks.push(Number((niceMin + i * step).toPrecision(12)));
  }

  return { min: niceMin, max: niceMax, step, ticks };
}

/** Evenly spaced band centres, the x-positions for categorical series. */
export function bandCentres(count: number, start: number, width: number): number[] {
  if (count <= 0) return [];
  const band = width / count;
  return Array.from({ length: count }, (_, i) => start + band * i + band / 2);
}

/** Thin labels until at most `max` remain; the last one is always kept so the
 *  axis ends on a real value. */
export function thinIndices(count: number, max: number): number[] {
  if (count <= 0) return [];
  if (count <= max) return Array.from({ length: count }, (_, i) => i);
  const stride = Math.ceil(count / max);
  const kept: number[] = [];
  for (let i = 0; i < count; i += stride) kept.push(i);
  const last = count - 1;
  if (kept[kept.length - 1] !== last) {
    // Replace rather than append when the penultimate keep would collide.
    if (last - kept[kept.length - 1] < stride / 2) kept[kept.length - 1] = last;
    else kept.push(last);
  }
  return kept;
}
