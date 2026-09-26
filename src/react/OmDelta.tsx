import { formatNumber, type NumberFormat } from "../core/format.ts";
import { deltaModel } from "../core/delta.ts";

export interface OmDeltaProps {
  value: number | null | undefined;
  format?: NumberFormat;
  unit?: string;
  goodDirection?: "up" | "down";
  className?: string;
}

export function OmDelta({ value, format = "fixed1", unit = "", goodDirection = "up", className }: OmDeltaProps) {
  if (value == null) return null;
  const model = deltaModel(value, goodDirection);
  return (
    <span className={["om-delta", `om-delta--${model.tone}`, className].filter(Boolean).join(" ")}>
      <span aria-hidden="true">{model.arrow}</span>
      {model.direction !== "flat" && <span className="om-sr-only">{model.direction}</span>}
      <span>
        {formatNumber(Math.abs(value), format)}
        {unit}
      </span>
    </span>
  );
}
