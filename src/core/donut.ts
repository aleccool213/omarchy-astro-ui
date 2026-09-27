import { buildShares, type ShareModel, type ShareSegment, type ShareSlice } from "./share.ts";

/** Donut geometry for OmDonut. Pure maths in a 100×100 viewBox; no DOM. */

export interface DonutArc extends ShareSlice {
  /** Annular-sector path: outer arc, down to the inner radius, back along it. */
  d: string;
  /** Angles in degrees, 0 at twelve o'clock, clockwise. */
  start: number;
  end: number;
}

export interface DonutModel extends ShareModel {
  arcs: DonutArc[];
  /** Inner radius as a share of the outer, for sizing whatever sits in the hole. */
  hole: number;
}

export interface DonutOptions {
  /** Ring thickness as a share of the radius, 0–1. Default 0.28. */
  thickness?: number;
}

const C = 50;
const R = 50;
/** A slice thinner than this is widened to stay visible past the 2px gap (degrees). */
export const MIN_SWEEP = 4;

function point(radius: number, deg: number): string {
  const rad = ((deg - 90) * Math.PI) / 180;
  return `${(C + radius * Math.cos(rad)).toFixed(3)} ${(C + radius * Math.sin(rad)).toFixed(3)}`;
}

function circle(radius: number): string {
  return `M ${point(radius, 0)} A ${radius} ${radius} 0 1 1 ${point(radius, 180)} A ${radius} ${radius} 0 1 1 ${point(radius, 0)} Z`;
}

/**
 * One annular sector. A full turn is two whole circles filled even-odd: an
 * SVG arc cannot start and end on the same point, and two half sectors would
 * leave seams where their gap strokes meet.
 */
export function sectorPath(start: number, end: number, inner: number, outer = R): string {
  if (end - start >= 360) return `${circle(outer)} ${circle(inner)}`;
  const large = end - start > 180 ? 1 : 0;
  return [
    `M ${point(outer, start)}`,
    `A ${outer} ${outer} 0 ${large} 1 ${point(outer, end)}`,
    `L ${point(inner, end)}`,
    `A ${inner} ${inner} 0 ${large} 0 ${point(inner, start)}`,
    "Z",
  ].join(" ");
}

/**
 * Slices come from `buildShares`, so a donut and a stacked bar fed the same
 * segments agree on percentages, colours and the six-colour limit. Sweeps are
 * measured from the raw values rather than the rounded percentages; a slice
 * too thin to see is widened to a sliver and the rest shrink to make room.
 */
export function buildDonut(segments: ShareSegment[], options: DonutOptions = {}): DonutModel {
  const shares = buildShares(segments);
  const thickness = Math.min(0.9, Math.max(0.05, options.thickness ?? 0.28));
  if (shares.empty) return { ...shares, arcs: [], hole: 1 - thickness };

  const inner = R * (1 - thickness);

  const raw = shares.slices.map((s) => (s.value / shares.total) * 360);
  const thin = raw.filter((sweep) => sweep < MIN_SWEEP).length;
  const thick = raw.filter((sweep) => sweep >= MIN_SWEEP).reduce((sum, sweep) => sum + sweep, 0);
  const scale = thick > 0 ? (360 - thin * MIN_SWEEP) / thick : 1;
  const sweeps = raw.map((sweep) => (sweep < MIN_SWEEP ? MIN_SWEEP : sweep * scale));

  let at = 0;
  const arcs = shares.slices.map((slice, i) => {
    const start = at;
    const end = i === shares.slices.length - 1 ? 360 : at + sweeps[i];
    at = end;
    return { ...slice, start, end, d: sectorPath(start, end, inner) };
  });
  return { ...shares, arcs, hole: 1 - thickness };
}
