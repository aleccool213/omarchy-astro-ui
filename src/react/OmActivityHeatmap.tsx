import { useEffect, useMemo } from "react";
import { buildHeatmap, type HeatmapOptions } from "../core/heatmap.ts";
import { formatDateLong, formatNumber, type NumberFormat } from "../core/format.ts";
import { mountTips } from "../client/hover.ts";

export interface OmActivityHeatmapProps extends HeatmapOptions {
  values: Record<string, number> | Map<string, number>;
  noun?: [string, string];
  format?: NumberFormat;
  caption?: string;
  className?: string;
}

const DOW = ["M", "", "W", "", "F", "", "S"];

export function OmActivityHeatmap({
  values,
  noun = ["entry", "entries"],
  format = "int",
  caption,
  className,
  ...options
}: OmActivityHeatmapProps) {
  const geo = useMemo(
    () => buildHeatmap(values, options),
    [values, options.end, options.start, options.weeks, options.timeZone, options.thresholds],
  );

  useEffect(() => {
    mountTips();
  }, []);

  const tip = (date: string, value: number): string => {
    if (value <= 0) return `${formatDateLong(date)} · nothing logged`;
    return `${formatDateLong(date)} · ${formatNumber(value, format)} ${value === 1 ? noun[0] : noun[1]}`;
  };

  return (
    <div className={["om-heatmap", className].filter(Boolean).join(" ")}>
      <div className="om-heatmap__frame" style={{ "--om-weeks": geo.weeks.length } as React.CSSProperties}>
        <div className="om-heatmap__dow" aria-hidden="true">
          <span />
          {DOW.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="om-heatmap__panel">
          <div
            className="om-heatmap__months"
            style={{ "--om-weeks": geo.weeks.length } as React.CSSProperties}
            aria-hidden="true"
          >
            {geo.weeks.map((_, i) => {
              const month = geo.months.find((m) => m.column === i);
              return <span key={i}>{month ? month.label : ""}</span>;
            })}
          </div>
          <div className="om-heatmap__grid" role="grid" aria-label={caption ?? "Activity calendar"}>
            {geo.weeks.flatMap((week) =>
              week.map((cell) =>
                cell.blank ? (
                  <div key={cell.date} className="om-heatmap__cell" data-blank="true" data-level={0} role="presentation" />
                ) : (
                  <button
                    key={cell.date}
                    type="button"
                    className="om-heatmap__cell"
                    data-level={cell.level}
                    data-om-tip={tip(cell.date, cell.value)}
                    aria-label={tip(cell.date, cell.value)}
                  />
                ),
              ),
            )}
          </div>
        </div>
      </div>

      <div className="om-heatmap__foot">
        <span>
          {formatNumber(geo.total, format)} {geo.total === 1 ? noun[0] : noun[1]} · {geo.activeDays} active{" "}
          {geo.activeDays === 1 ? "day" : "days"}
        </span>
        <span className="om-heatmap__legend">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className="om-heatmap__cell" data-level={l} aria-hidden="true" />
          ))}
          <span>More</span>
        </span>
      </div>
      {caption && <p className="om-chart__note">{caption}</p>}
    </div>
  );
}
