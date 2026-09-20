import { useMemo } from "react";
import { buildChart } from "../core/series.ts";

export interface OmSparklineProps {
  values: (number | null)[];
  width?: number;
  height?: number;
  label?: string;
  className?: string;
}

export function OmSparkline({ values, width = 80, height = 28, label, className }: OmSparklineProps) {
  const geo = useMemo(
    () =>
      buildChart(
        [{ key: "spark", label: label ?? "trend", points: values.map((value, i) => ({ label: String(i), value })) }],
        { spark: true, width, height },
      ),
    [values, width, height, label],
  );

  if (geo.empty || geo.series[0].segments.length === 0) return null;

  return (
    <svg
      className={["om-spark", className].filter(Boolean).join(" ")}
      viewBox={`0 0 ${width} ${height}`}
      style={{ "--om-spark-w": `${width}px`, "--om-spark-h": `${height}px` } as React.CSSProperties}
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {geo.series[0].segments.map((d, i) => (
        <path key={i} className="om-spark__line" d={d} />
      ))}
    </svg>
  );
}
