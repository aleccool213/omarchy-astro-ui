/** Part-to-whole geometry for OmStackedBar. No DOM, no framework. */

export interface ShareSegment {
  key: string;
  label: string;
  value: number;
  /** Pin a categorical slot (1–6) so the same thing keeps its colour across
   *  bars whose order differs. Omit and slots follow segment order. */
  slot?: number;
  tip?: string;
}

export interface ShareSlice {
  key: string;
  label: string;
  value: number;
  /** Share of the total, 0–100, one decimal. The set sums to exactly 100. */
  pct: number;
  slot: number;
  tip?: string;
}

export interface ShareModel {
  total: number;
  slices: ShareSlice[];
  empty: boolean;
}

export const MAX_SLOTS = 6;

/**
 * Non-positive values are dropped: a bar cannot draw a negative share, and a
 * liability belongs beside the bar, not inside it.
 *
 * Percentages use largest-remainder rounding at one decimal, so a legend of
 * 33.3 / 33.3 / 33.3 reads 33.4 / 33.3 / 33.3 and always adds to 100.0.
 *
 * More than six distinct slots throws, for the same reason the chart does:
 * cycling the palette gives two different things the same colour. Fold the
 * tail into "Other" before passing it in.
 */
export function buildShares(segments: ShareSegment[]): ShareModel {
  const kept = segments.filter((s) => Number.isFinite(s.value) && s.value > 0);
  const total = kept.reduce((sum, s) => sum + s.value, 0);
  if (kept.length === 0 || total <= 0) return { total: 0, slices: [], empty: true };

  // Pinned slots are reserved up front so an unpinned segment never lands on
  // a colour a later segment asked for. Two segments may pin the same slot on
  // purpose (e.g. every registered account type in one colour).
  const slots = new Set<number>(kept.flatMap((s) => (s.slot == null ? [] : [s.slot])));
  let next = 1;
  const withSlots = kept.map((s) => {
    let slot = s.slot;
    if (slot == null) {
      while (slots.has(next)) next++;
      if (next > MAX_SLOTS) {
        throw new Error(`buildShares: more than ${MAX_SLOTS} colours — fold the tail into "Other".`);
      }
      slot = next;
    }
    if (!Number.isInteger(slot) || slot < 1 || slot > MAX_SLOTS) {
      throw new Error(`buildShares: slot ${slot} for "${s.key}" is outside 1–${MAX_SLOTS}.`);
    }
    slots.add(slot);
    return { ...s, slot };
  });

  // Largest remainder, in tenths of a percent.
  const raw = withSlots.map((s) => (s.value / total) * 1000);
  const floors = raw.map(Math.floor);
  let spare = 1000 - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - floors[i], i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) {
    if (spare <= 0) break;
    floors[i]++;
    spare--;
  }

  return {
    total,
    empty: false,
    slices: withSlots.map((s, i) => ({
      key: s.key,
      label: s.label,
      value: s.value,
      pct: floors[i] / 10,
      slot: s.slot,
      tip: s.tip,
    })),
  };
}
