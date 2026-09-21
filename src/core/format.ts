/** Number and date helpers shared by every renderer. No DOM, no framework. */

export type NumberFormat = "int" | "fixed1" | "fixed2" | "k" | "compact" | "percent" | "locale";

export function formatNumber(n: number, format: NumberFormat = "int"): string {
  if (!Number.isFinite(n)) return "–";
  switch (format) {
    case "fixed1":
      return n.toFixed(1);
    case "fixed2":
      return n.toFixed(2);
    case "percent":
      return `${Math.round(n)}%`;
    case "k":
      if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(Math.abs(n) >= 10000 ? 0 : 1)}k`;
      return String(Math.round(n));
    case "locale":
      // Grouped thousands: "3,386". Deliberately not the default, because axis
      // ticks are tighter for space than a stat value is.
      return new Intl.NumberFormat("en-CA").format(n);
    case "compact":
      return new Intl.NumberFormat("en-CA", { notation: "compact", maximumFractionDigits: 1 }).format(n);
    case "int":
    default:
      return String(Math.round(n));
  }
}

/** Tick labels need to agree with each other, not just be individually correct:
 *  a 0.5 step must not render "0, 1, 1, 2". Decimals are derived from the step. */
export function formatTick(value: number, step: number, format: NumberFormat = "int"): string {
  if (format !== "int") return formatNumber(value, format);
  if (step >= 1) return formatNumber(value, "int");
  const decimals = Math.min(4, Math.ceil(-Math.log10(step)));
  return value.toFixed(decimals);
}

const DAY_MS = 86_400_000;

/** All date helpers are ISO-string in, ISO-string out and UTC-anchored, so a
 *  calendar grid never shifts a cell when the viewer crosses a timezone. */
export function parseISO(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`);
}

export function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number): string {
  return toISO(new Date(parseISO(iso).getTime() + days * DAY_MS));
}

export function diffDaysISO(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / DAY_MS);
}

/** Monday-first, matching every existing app. 0 = Monday … 6 = Sunday. */
export function weekdayIndex(iso: string): number {
  return (parseISO(iso).getUTCDay() + 6) % 7;
}

export function mondayOf(iso: string): string {
  return addDaysISO(iso, -weekdayIndex(iso));
}

export function todayISO(timeZone?: string): string {
  if (!timeZone) return toISO(new Date());
  // en-CA formats as YYYY-MM-DD, which is the shape we want back.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(),
  );
}

export function formatDateShort(iso: string): string {
  const d = parseISO(iso);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

export function formatDateLong(iso: string): string {
  return parseISO(iso).toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function monthLabel(iso: string): string {
  return parseISO(iso).toLocaleString("en-CA", { month: "short", timeZone: "UTC" });
}
