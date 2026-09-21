import type { ReactNode } from "react";
import { OmThemeToggle } from "./OmThemeToggle.tsx";

export interface OmNavItem {
  href: string;
  label: string;
  active?: boolean;
  icon?: ReactNode;
}

export interface OmPageHeaderProps {
  title: string;
  href?: string;
  nav?: OmNavItem[];
  dock?: boolean;
  themeToggle?: boolean;
  logo?: ReactNode;
  actions?: ReactNode;
  /** Router-agnostic: split-log passes TanStack's <Link>, a blog passes <a>. */
  renderLink?: (item: OmNavItem, children: ReactNode, props: Record<string, unknown>) => ReactNode;
  className?: string;
}

export function OmPageHeader({
  title,
  href = "/",
  nav = [],
  dock = false,
  themeToggle = true,
  logo,
  actions,
  renderLink,
  className,
}: OmPageHeaderProps) {
  const link = (item: OmNavItem, children: ReactNode): ReactNode => {
    const props = { "aria-current": item.active ? ("page" as const) : undefined };
    if (renderLink) return renderLink(item, children, props);
    return (
      <a href={item.href} {...props}>
        {children}
      </a>
    );
  };

  return (
    <>
      <header className={["om-header", className].filter(Boolean).join(" ")}>
        <div className="om-header__inner">
          <a className="om-header__mark" href={href}>
            {logo}
            <span>{title}</span>
          </a>
          <div className="om-header__actions">
            {nav.length > 0 && (
              <nav className="om-header__nav" aria-label="Primary">
                {nav.map((item) => (
                  <span key={item.href}>{link(item, item.label)}</span>
                ))}
              </nav>
            )}
            {actions}
            {themeToggle && <OmThemeToggle />}
          </div>
        </div>
      </header>
      {dock && nav.length > 0 && (
        <nav className="om-dock" aria-label="Primary">
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                {link(
                  item,
                  <>
                    {item.icon}
                    {item.label}
                  </>,
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
