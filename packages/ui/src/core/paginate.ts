/** Client-side pagination. Pure, so the same call runs during SSR for the
 *  first page and in the browser for every page after it. */

export interface PageState<T> {
  items: T[];
  page: number;
  perPage: number;
  pageCount: number;
  total: number;
  /** 1-indexed, inclusive, for "showing 11–20 of 57". 0 when empty. */
  from: number;
  to: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export function paginate<T>(items: T[], page = 1, perPage = 10): PageState<T> {
  const total = items.length;
  const size = Math.max(1, Math.floor(perPage));
  const pageCount = Math.max(1, Math.ceil(total / size));
  // Clamp rather than trust: page numbers arrive from URLs and stale clicks.
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const offset = (current - 1) * size;
  const slice = items.slice(offset, offset + size);

  return {
    items: slice,
    page: current,
    perPage: size,
    pageCount,
    total,
    from: total === 0 ? 0 : offset + 1,
    to: total === 0 ? 0 : offset + slice.length,
    hasPrev: current > 1,
    hasNext: current < pageCount,
  };
}

/** Page numbers to render, with "gap" where a run was elided.
 *  Always includes the first and last page. */
export function pageWindow(page: number, pageCount: number, span = 5): (number | "gap")[] {
  if (pageCount <= span + 2) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const half = Math.floor(span / 2);
  let start = Math.max(2, page - half);
  let end = Math.min(pageCount - 1, page + half);

  // Keep the window a constant width even at the ends, so the control does not
  // change size as the reader pages through.
  if (page - half < 2) end = Math.min(pageCount - 1, start + span - 1);
  if (page + half > pageCount - 1) start = Math.max(2, end - span + 1);

  const out: (number | "gap")[] = [1];
  if (start > 2) out.push("gap");
  for (let i = start; i <= end; i += 1) out.push(i);
  if (end < pageCount - 1) out.push("gap");
  out.push(pageCount);
  return out;
}
