import { useEffect, useId, useMemo, useRef } from "react";
import { buildChart, type ChartKind, type ChartSeries } from "../core/series.ts";
import { formatNumber, type NumberFormat } from "../core/format.ts";
import { mountChart } from "../client/chart.ts";
import { mountTips } from "../client/hover.ts";

export interface OmTimeSeriesChartProps {
  title?: string;
  series: ChartSeries[];
  kind?: ChartKind;
  unit?: string;
  format?: NumberFormat;
  height?: number;
  width?: number;
  note?: string;
  reverseY?: boolean;
  bare?: boolean;
  table?: boolean;
  className?: string;
}

export function OmTimeSeriesChart({
  title,
  series,
  kind = "line",
  unit,
  format = "int",
  height = 220,
  width = 640,
  note,
  reverseY = false,
  bare = false,
  table = true,
  className,
}: OmTimeSeriesChartProps) {
  const root = useRef<HTMLElement>(null);
  const titleId = useId();

  const geo = useMemo(
    () => buildChart(series, { kind, unit, format, height, width, reverseY }),
    [series, kind, unit, format, height, width, reverseY],
  );

  useEffect(() => {
    if (!root.current) return;
    // The geometry changed, so the mounted handlers hold stale columns.
    delete root.current.dataset.omReady;
    mountChart(root.current);
    mountTips();
  }, [geo]);

  const { pad, innerW, innerH } = geo;
  const plotBottom = pad.top + innerH;

  const focus = geo.series.map((s) => {
    const xs: string[] = new Array(geo.columns.length).fill("");
    const ys: string[] = new Array(geo.columns.length).fill("");
    for (const m of s.markers) {
      xs[m.index] = m.x.toFixed(1);
      ys[m.index] = m.y.toFixed(1);
    }
    return { slot: s.slot, xs: xs.join(","), ys: ys.join(",") };
  });

  const columnsJson = JSON.stringify(geo.columns).replace(/</g, "\\u003c");

  return (
    <figure
      ref={root}
      className={["om-chart", bare && "om-chart--bare", className].filter(Boolean).join(" ")}
      data-om-chart
    >
      {(title || unit) && (
        <figcaption className="om-chart__head">
          {title && (
            <h3 className="om-chart__title" id={titleId}>
              {title}
            </h3>
          )}
          {unit && <span className="om-chart__unit">{unit}</span>}
        </figcaption>
      )}

      {geo.empty ? (
        <p className="om-chart__empty">No data yet.</p>
      ) : (
        <svg
          className="om-chart__svg"
          viewBox={`0 0 ${geo.width} ${geo.height}`}
          role="img"
          tabIndex={0}
          aria-labelledby={title ? titleId : undefined}
          aria-label={title ? undefined : "Chart"}
        >
          <g aria-hidden="true">
            {geo.yTicks.map((t) => (
              <line key={`g${t.value}`} className="om-chart__grid" x1={pad.left} x2={pad.left + innerW} y1={t.y} y2={t.y} />
            ))}
            {geo.zeroY != null && (
              <line className="om-chart__zero" x1={pad.left} x2={pad.left + innerW} y1={geo.zeroY} y2={geo.zeroY} />
            )}
            {geo.yTicks.map((t) => (
              <text key={`y${t.value}`} className="om-chart__tick om-chart__tick--y" x={pad.left - 8} y={t.y + 4}>
                {t.label}
              </text>
            ))}
            {geo.xTicks.map((t) => (
              <text key={`x${t.index}`} className="om-chart__tick om-chart__tick--x" x={t.x} y={geo.height - 8}>
                {t.label}
              </text>
            ))}
          </g>

          {geo.series.map((s) => (
            <g key={s.key} aria-hidden="true">
              {s.areaPaths.map((d, i) => (
                <path key={`a${i}`} className="om-chart__area" d={d} fill={s.colorVar} />
              ))}
              {s.segments.map((d, i) => (
                <path key={i} className="om-chart__line" d={d} stroke={s.colorVar} />
              ))}
              {s.bars.map((b) => (
                <rect
                  key={b.index}
                  className="om-chart__bar"
                  x={b.x}
                  y={b.y}
                  width={b.width}
                  height={b.height}
                  fill={s.colorVar}
                />
              ))}
              {s.segments.length === 0 &&
                s.bars.length === 0 &&
                s.markers.map((m) => <circle key={m.index} cx={m.x} cy={m.y} r={3} fill={s.colorVar} />)}
            </g>
          ))}

          {geo.showDirectLabels &&
            geo.series.map((s) =>
              s.last ? (
                <text
                  key={`d${s.key}`}
                  className="om-chart__direct"
                  x={Math.min(s.last.x + 6, geo.width - 2)}
                  y={Math.max(10, s.last.y - 6)}
                  aria-hidden="true"
                >
                  {s.label}
                </text>
              ) : null,
            )}

          <line className="om-chart__crosshair om-hidden" data-om-crosshair y1={pad.top} y2={plotBottom} x1={0} x2={0} />
          <g className="om-chart__focus" data-om-focus>
            {focus.map((f) => (
              <circle key={f.slot} className="om-hidden" r={4} fill={`var(--om-series-${f.slot})`} data-om-x={f.xs} data-om-y={f.ys} />
            ))}
          </g>
          <rect className="om-chart__hit" x={pad.left} y={pad.top} width={innerW} height={innerH} />
        </svg>
      )}

      {note && <p className="om-chart__note">{note}</p>}

      {geo.showLegend && (
        <ul className="om-chart__legend">
          {geo.series.map((s) => (
            <li key={s.key}>
              <span className="om-chart__swatch" style={{ background: s.colorVar }} aria-hidden="true" />
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      )}

      {!geo.empty && table && (
        <details className="om-chart__table">
          <summary>Table view</summary>
          <table>
            <thead>
              <tr>
                <th scope="col">Point</th>
                {geo.series.map((s) => (
                  <th key={s.key} scope="col">
                    {s.label}
                    {unit ? ` (${unit})` : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {geo.columns.map((c) => (
                <tr key={c.index}>
                  <th scope="row">{c.label}</th>
                  {c.values.map((v) => (
                    <td key={v.key}>{v.value == null ? "–" : formatNumber(v.value, format)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      <script type="application/json" data-om-columns dangerouslySetInnerHTML={{ __html: columnsJson }} />
    </figure>
  );
}
