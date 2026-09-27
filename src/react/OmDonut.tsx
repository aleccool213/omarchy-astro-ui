import { useEffect, useMemo, type ReactNode } from "react";
import { formatNumber, type NumberFormat } from "../core/format.ts";
import { buildDonut } from "../core/donut.ts";
import type { ShareSegment } from "../core/share.ts";
import { mountTips } from "../client/hover.ts";

export interface OmDonutProps {
  segments: ShareSegment[];
  title?: string;
  format?: NumberFormat;
  formatValue?: (value: number) => string;
  /** The figure in the hole. Defaults to the formatted total; pass "" for none. */
  center?: string;
  centerLabel?: string;
  thickness?: number;
  size?: number;
  legend?: boolean;
  bare?: boolean;
  className?: string;
  /** Rendered under the ring and legend — notes, nudges, a link. */
  children?: ReactNode;
}

export function OmDonut({
  segments,
  title,
  format = "locale",
  formatValue,
  center,
  centerLabel,
  thickness,
  size = 168,
  legend = true,
  bare = false,
  className,
  children,
}: OmDonutProps) {
  useEffect(() => mountTips(), []);
  const model = useMemo(() => buildDonut(segments, { thickness }), [segments, thickness]);
  if (model.empty) return null;

  const fmt = (v: number) => (formatValue ? formatValue(v) : formatNumber(v, format));
  const summary = model.slices.map((s) => `${s.label} ${s.pct}%`).join(", ");
  const hole = center ?? fmt(model.total);

  return (
    <figure className={["om-donut", "om-share", bare && "om-share--bare", className].filter(Boolean).join(" ")}>
      {title && <figcaption className="om-share__title">{title}</figcaption>}
      <div className="om-donut__body">
        <div className="om-donut__ring" style={{ ["--om-donut-size" as string]: `${size}px`, ["--om-donut-hole" as string]: model.hole }}>
          <svg viewBox="0 0 100 100" role="img" aria-label={title ? `${title}: ${summary}` : summary}>
            {model.arcs.map((a) => (
              <path
                key={a.key}
                fillRule="evenodd"
                className={`om-donut__arc om-slot-${a.slot}`}
                d={a.d}
                data-om-tip={a.tip ?? `${a.label} · ${a.pct}% · ${fmt(a.value)}`}
              />
            ))}
          </svg>
          {(hole || centerLabel) && (
            <div className="om-donut__center" aria-hidden="true">
              {hole && <span className="om-donut__value">{hole}</span>}
              {centerLabel && <span className="om-donut__label">{centerLabel}</span>}
            </div>
          )}
        </div>
        {legend && (
          <ul className="om-share__legend om-donut__legend">
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
      </div>
      {children}
    </figure>
  );
}
