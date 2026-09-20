import { addDaysISO, formatDateShort } from "@omarchy/ui/core";

/** Sample data shaped like the real apps: weekly health averages, rowing
 *  volume, account balances. Deterministic, so the storyboard renders the
 *  same thing on every deploy. */

// A small LCG — Math.random would make every build a visual diff.
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const END = "2026-09-20";

export function weekLabels(count: number): string[] {
  return Array.from({ length: count }, (_, i) => formatDateShort(addDaysISO(END, -7 * (count - 1 - i))));
}

const labels13 = weekLabels(13);

/** One generator per series, advanced once per point. Seeding per-index (the
 *  obvious mistake) makes consecutive values nearly identical and every chart
 *  comes out a straight line. */
function series(seed: number, fn: (r: number, i: number) => number | null) {
  const next = rng(seed);
  return labels13.map((label, i) => ({ label, value: fn(next(), i) }));
}

const withTip = (
  points: { label: string; value: number | null }[],
  tip: (v: number | null, label: string) => string,
) => points.map((p) => ({ ...p, tip: tip(p.value, p.label) }));

export const steps = withTip(
  series(11, (r, i) => Math.round(6800 + r * 4200 + i * 70)),
  (v, label) => `${label} · ${v?.toLocaleString("en-CA")} steps/day`,
);

export const sleep = withTip(
  // Week 6 logged nothing — the chart must break the line, not bridge it.
  series(29, (r, i) => (i === 5 ? null : Number((6.2 + r * 2.1).toFixed(2)))),
  (v, label) => (v == null ? `${label} · no nights logged` : `${label} · ${v} h`),
);

export const restingHr = withTip(
  series(47, (r, i) => Math.round(63 + r * 7 - i * 0.45)),
  (v, label) => `${label} · ${v} bpm resting`,
);

export const hrv = withTip(
  series(83, (r) => Math.round(38 + r * 28)),
  (v, label) => `${label} · ${v} ms HRV`,
);

export const weeklyVolume = withTip(
  series(101, (r) => Math.round((8 + r * 26) * 10) / 10),
  (v, label) => `${label} · ${v} km`,
);

export const allocation = ["Equities", "Bonds", "Cash", "Property"].map((name, s) => {
  const base = [46, 27, 14, 13][s];
  const next = rng(211 + s * 97);
  return {
    key: name.toLowerCase(),
    label: name,
    points: labels13.map((label) => {
      const value = Math.round((base + (next() - 0.5) * 9) * 10) / 10;
      return { label, value, tip: `${label} · ${name} ${value}%` };
    }),
  };
});

/** Daily workout counts for the calendar heatmap. */
export const workoutDays: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  const r = rng(7);
  for (let i = 0; i < 7 * 26; i += 1) {
    const date = addDaysISO(END, -i);
    const roll = r();
    // Weekends lean heavier, and a rest day is a real zero, not a gap.
    const weekend = [0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay());
    if (roll > (weekend ? 0.35 : 0.55)) out[date] = roll > 0.9 ? 3 : roll > 0.75 ? 2 : 1;
  }
  return out;
})();

export interface Session {
  id: string;
  date: string;
  description: string;
  meters: number;
  minutes: number;
  split: string;
}

const PIECES = [
  "4 × 1000m",
  "Steady state 8k",
  "2 × 20 min",
  "30r20 intervals",
  "6k test",
  "5 × 500m",
  "Long row 12k",
  "3 × 10 min",
];

const sessionRng = rng(307);

export const sessions: Session[] = Array.from({ length: 57 }, (_, i) => {
  const r = sessionRng;
  const meters = Math.round((4000 + r() * 9000) / 100) * 100;
  const minutes = Math.round(meters / (190 + r() * 60));
  const secondsPer500 = Math.round((minutes * 60) / (meters / 500));
  return {
    id: `s${i}`,
    date: addDaysISO(END, -i * 2),
    description: PIECES[i % PIECES.length],
    meters,
    minutes,
    split: `${Math.floor(secondsPer500 / 60)}:${String(secondsPer500 % 60).padStart(2, "0")}`,
  };
});

export interface Account {
  id: string;
  name: string;
  institution: string;
  kind: string;
  amount: number;
  change: number;
  history: number[];
}

const accountRng = rng(401);

export const accounts: Account[] = [
  ["RRSP", "Questrade", "Registered", 148_200, 2.4],
  ["TFSA", "Questrade", "Registered", 96_450, 1.1],
  ["Chequing", "Tangerine", "Cash", 8_320, -0.6],
  ["Emergency fund", "EQ Bank", "Cash", 24_000, 0.3],
  ["Mortgage", "Scotiabank", "Debt", -412_900, -0.4],
  ["FHSA", "Wealthsimple", "Registered", 16_000, 3.2],
  ["Joint savings", "EQ Bank", "Cash", 31_750, 0.9],
  ["RESP", "Questrade", "Registered", 22_100, 1.8],
  ["Car loan", "Scotiabank", "Debt", -9_400, -1.2],
  ["Crypto", "Coinbase", "Other", 4_260, -6.5],
  ["LIRA", "Questrade", "Registered", 61_300, 1.4],
  ["Cash ISA", "EQ Bank", "Cash", 12_800, 0.2],
].map(([name, institution, kind, amount, change], i) => {
  const r = accountRng;
  return {
    id: `a${i}`,
    name: name as string,
    institution: institution as string,
    kind: kind as string,
    amount: amount as number,
    change: change as number,
    history: Array.from({ length: 12 }, () => Math.round(r() * 100)),
  };
});

export function formatCAD(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}
