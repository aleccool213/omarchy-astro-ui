import { useEffect, useMemo, type ReactNode } from "react";
import { formatNumber, type NumberFormat } from "../core/format.ts";
import { buildShares, type ShareSegment } from "../core/share.ts";
import { mountTips } from "../client/hover.ts";

export interface OmStackedBarProps {
  segments: ShareSegment[];
  title?: string;
  format?: NumberFormat;
  formatValue?: (value: number) => string;
  legend?: boolean;
  bare?: boolean;
  className?: string;
  /** Rendered under the legend — notes, nudges, a link. */
  children?: ReactNode;
}

export function OmStackedBar({
  segments,
  title,
  format = "locale",
  formatValue,
  legend = true,
  bare = false,
  className,
  children,
}: OmStackedBarProps) {
  useEffect(() => mountTips(), []);
  const model = useMemo(() => buildShares(segments), [segments]);
  if (model.empty) return null;

  const fmt = (v: number) => (formatValue ? formatValue(v) : formatNumber(v, format));
  const summary = model.slices.map((s) => `${s.label} ${s.pct}%`).join(", ");

  return (
    <figure className={["om-share", bare && "om-share--bare", className].filter(Boolean).join(" ")}>
      {title && <figcaption className="om-share__title">{title}</figcaption>}
      <div className="om-share__bar" role="img" aria-label={title ? `${title}: ${summary}` : summary}>
        {model.slices.map((s) => (
          <span
            key={s.key}
            className={`om-share__seg om-slot-${s.slot}`}
            style={{ width: `${s.pct}%` }}
            data-om-tip={s.tip ?? `${s.label} · ${s.pct}% · ${fmt(s.value)}`}
          />
        ))}
      </div>
      {legend && (
        <ul className="om-share__legend">
          {model.slices.map((s) => (
            <li key={s.key}>
              <span className={`om-share__swatch om-slot-${s.slot}`} aria-hidden="true" />
              <span>{s.label}</span>
              <span className="om-share__pct">{s.pct}%</span>
              <span className="om-share__value">{fmt(s.value)}</span>
            </li>
          ))}
        </ul>
      )}
      {children}
    </figure>
  );
}
