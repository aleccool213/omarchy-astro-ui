import type { ReactNode } from "react";

export interface OmSectionProps {
  title: string;
  id?: string;
  note?: string;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function OmSection({ title, id, note, actions, className, children }: OmSectionProps) {
  const headingId =
    id ??
    `${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}-heading`;
  return (
    <section className={["om-section", className].filter(Boolean).join(" ")} aria-labelledby={headingId}>
      <header className="om-section__head">
        <h2 className="om-section__title" id={headingId}>
          {title}
        </h2>
        {actions}
      </header>
      {note && <p className="om-section__note">{note}</p>}
      {children}
    </section>
  );
}
