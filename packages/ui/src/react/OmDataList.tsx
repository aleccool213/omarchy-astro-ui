import { useMemo, useState, type ReactNode } from "react";
import { paginate, pageWindow } from "../core/paginate.ts";

export interface OmDataListProps<T> {
  items: T[];
  renderRow: (item: T, index: number) => ReactNode;
  rowKey: (item: T, index: number) => string | number;
  title?: string;
  density?: "stack" | "rows" | "table";
  perPage?: number;
  emptyLabel?: string;
  /** Required for density="table" — the <tr> of <th>s. */
  head?: ReactNode;
  showCount?: boolean;
  className?: string;
}

/** React takes real state rather than the DOM-hiding the Astro version uses:
 *  there is already a render pass here, so paging should re-render. */
export function OmDataList<T>({
  items,
  renderRow,
  rowKey,
  title,
  density = "stack",
  perPage = 10,
  emptyLabel = "Nothing to show.",
  head,
  showCount = true,
  className,
}: OmDataListProps<T>) {
  const [page, setPage] = useState(1);
  const state = useMemo(() => paginate(items, page, perPage), [items, page, perPage]);
  const window = useMemo(() => pageWindow(state.page, state.pageCount), [state.page, state.pageCount]);

  const rows = state.items.map((item, i) => (
    <Row key={rowKey(item, i)} density={density}>
      {renderRow(item, (state.page - 1) * state.perPage + i)}
    </Row>
  ));

  return (
    <section className={["om-list", `om-list--${density}`, className].filter(Boolean).join(" ")}>
      {(title || showCount) && (
        <header className="om-list__head">
          {title && <h2 className="om-list__title">{title}</h2>}
          {showCount && (
            <span className="om-list__count">
              {state.total} {state.total === 1 ? "item" : "items"}
            </span>
          )}
        </header>
      )}

      {state.total === 0 ? (
        <p className="om-list__empty">{emptyLabel}</p>
      ) : density === "table" ? (
        <table className="om-list__table">
          <thead>{head}</thead>
          <tbody className="om-list__rows">{rows}</tbody>
        </table>
      ) : (
        <div className="om-list__rows">{rows}</div>
      )}

      {state.pageCount > 1 && (
        <nav className="om-pager" aria-label="Pagination">
          <span className="om-pager__range" aria-live="polite">
            {state.from}–{state.to} of {state.total}
          </span>
          <div className="om-pager__controls">
            <button
              type="button"
              className="om-pager__btn"
              onClick={() => setPage((p) => p - 1)}
              disabled={!state.hasPrev}
              aria-label="Previous page"
            >
              ‹
            </button>
            <span className="om-pager__pages">
              {window.map((entry, i) =>
                entry === "gap" ? (
                  <span key={`gap${i}`} className="om-pager__gap" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <button
                    key={entry}
                    type="button"
                    className="om-pager__page"
                    aria-current={entry === state.page ? "page" : undefined}
                    aria-label={`Page ${entry}`}
                    onClick={() => setPage(entry)}
                  >
                    {entry}
                  </button>
                ),
              )}
            </span>
            <button
              type="button"
              className="om-pager__btn"
              onClick={() => setPage((p) => p + 1)}
              disabled={!state.hasNext}
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </nav>
      )}
    </section>
  );
}

function Row({ density, children }: { density: string; children: ReactNode }) {
  // A table row must be a <tr>; the caller's renderRow supplies the <td>s.
  if (density === "table") return <tr className="om-list__row">{children}</tr>;
  return <div className="om-list__row">{children}</div>;
}
