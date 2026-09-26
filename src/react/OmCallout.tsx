import type { ReactNode } from "react";

export interface OmCalloutProps {
  title?: string;
  tone?: "info" | "ok" | "warn" | "alert";
  className?: string;
  children?: ReactNode;
}

export function OmCallout({ title, tone = "info", className, children }: OmCalloutProps) {
  return (
    <div className={["om-callout", `om-callout--${tone}`, className].filter(Boolean).join(" ")}>
      {title && <strong className="om-callout__title">{title}</strong>} {children}
    </div>
  );
}
