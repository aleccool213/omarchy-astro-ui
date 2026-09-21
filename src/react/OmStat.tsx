import { useEffect, type ReactNode } from "react";
import { formatNumber, type NumberFormat } from "../core/format.ts";
import { mountTips } from "../client/hover.ts";

export interface OmStatProps {
  label: string;
  value: string | number | null;
  unit?: string;
  format?: NumberFormat;
  hint?: string;
  delta?: number | null;
  deltaFormat?: NumberFormat;
  goodDirection?: "up" | "down";
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
  goodDirection = "up",
  className,
  children,
}: OmStatProps) {
  // The hint is a tooltip trigger, so the component that renders it mounts the
  // tooltip. mountTips is idempotent and delegated, so N stats cost one binding.
  useEffect(() => {
    if (hint) mountTips();
  }, [hint]);

  const display = value == null ? "–" : typeof value === "number" ? formatNumber(value, format) : value;
  const direction = delta == null || delta === 0 ? "flat" : delta > 0 ? "up" : "down";
  const tone =
    direction === "flat" ? "flat" : (direction === "up") === (goodDirection === "up") ? "up" : "down";
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "–";

  return (
    <div className={["om-stat", className].filter(Boolean).join(" ")}>
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
            <span>{formatNumber(Math.abs(delta), deltaFormat)}</span>
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
