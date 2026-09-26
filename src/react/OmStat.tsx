import { useEffect, type ReactNode } from "react";
import { formatNumber, type NumberFormat } from "../core/format.ts";
import { mountTips } from "../client/hover.ts";
import { deltaModel } from "../core/delta.ts";

export interface OmStatProps {
  label: string;
  value: string | number | null;
  unit?: string;
  format?: NumberFormat;
  hint?: string;
  delta?: number | null;
  deltaFormat?: NumberFormat;
  /** Appended to the delta, e.g. "%" when the delta is a percentage change. */
  deltaUnit?: string;
  goodDirection?: "up" | "down";
  /** "inline" (default) keeps the unit on the figure's line; "block" drops it
   *  underneath, which reads better for a long unit like "hours avg". */
  unitPlacement?: "inline" | "block";
  /** "card" (default) is a tile; "hero" is the page's one big figure, unboxed. */
  variant?: "card" | "hero";
  className?: string;
  children?: ReactNode;
}

export function OmStat({
  label,
  value,
  unit,
  format = "int",
  hint,
  delta = null,
  deltaFormat = "fixed1",
  deltaUnit = "",
  goodDirection = "up",
  unitPlacement = "inline",
  variant = "card",
  className,
  children,
}: OmStatProps) {
  // The hint is a tooltip trigger, so the component that renders it mounts the
  // tooltip. mountTips is idempotent and delegated, so N stats cost one binding.
  useEffect(() => {
    if (hint) mountTips();
  }, [hint]);

  const display = value == null ? "–" : typeof value === "number" ? formatNumber(value, format) : value;
  const { direction, tone, arrow } = deltaModel(delta ?? 0, goodDirection);

  return (
    <div
      className={[
        "om-stat",
        unitPlacement === "block" && "om-stat--unit-block",
        variant === "hero" && "om-stat--hero",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="om-stat__label">
        <span>{label}</span>
        {hint && (
          <button className="om-stat__hint" type="button" data-om-tip={hint} aria-label={`${label} explained`}>
            ?
          </button>
        )}
      </div>
      <div className="om-stat__value">
        {display}
        {unit && <span className="om-stat__unit">{unit}</span>}
        {delta != null && (
          <span className={`om-stat__delta om-stat__delta--${tone}`}>
            <span aria-hidden="true">{arrow}</span>
            {direction !== "flat" && <span className="om-sr-only">{direction}</span>}
            <span>
              {formatNumber(Math.abs(delta), deltaFormat)}
              {deltaUnit}
            </span>
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export function OmStatGrid({
  cols = 2,
  colsSm = 3,
  className,
  children,
}: {
  cols?: number;
  colsSm?: number;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={["om-stat-grid", className].filter(Boolean).join(" ")}
      style={{ "--om-stat-cols": cols, "--om-stat-cols-sm": colsSm } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
