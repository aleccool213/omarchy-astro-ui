import { paginate, pageWindow } from "../core/paginate.ts";

/**
 * Progressive-enhancement pagination for OmDataList.
 *
 * The server renders every row and hides the pager. With JS the pager appears
 * and rows outside the page are hidden; without JS the full list is still
 * there and readable. For lists long enough that shipping every row is wrong,
 * use server pagination (`?page=`) and render one page — the same markup and
 * the same styles apply.
 */
export function mountList(root: HTMLElement): void {
  if (root.dataset.omReady === "list") return;
  const rowsHost = root.querySelector<HTMLElement>("[data-om-rows]");
  const pager = root.querySelector<HTMLElement>("[data-om-pager]");
  if (!rowsHost || !pager) return;
  const body: HTMLElement = rowsHost;

  const rows = Array.from(body.children) as HTMLElement[];
  const perPage = Number(root.dataset.omPerPage || "10") || 10;
  if (rows.length <= perPage) {
    pager.remove();
    root.dataset.omReady = "list";
    return;
  }

  root.dataset.omReady = "list";
  const syncUrl = root.dataset.omSyncUrl === "true";
  const param = root.dataset.omPageParam || "page";
  const status = root.querySelector<HTMLElement>("[data-om-range]");
  const list = root.querySelector<HTMLElement>("[data-om-pages]");
  const prev = root.querySelector<HTMLButtonElement>("[data-om-prev]");
  const next = root.querySelector<HTMLButtonElement>("[data-om-next]");

  const initial = syncUrl ? Number(new URLSearchParams(location.search).get(param)) || 1 : 1;
  let page = initial;

  function render(announce: boolean): void {
    const state = paginate(rows, page, perPage);
    page = state.page;

    const visible = new Set(state.items);
    for (const row of rows) row.hidden = !visible.has(row);

    if (status) {
      status.textContent = `${state.from}–${state.to} of ${state.total}`;
    }
    if (prev) prev.disabled = !state.hasPrev;
    if (next) next.disabled = !state.hasNext;

    if (list) {
      list.replaceChildren(
        ...pageWindow(state.page, state.pageCount).map((entry) => {
          if (entry === "gap") {
            const span = document.createElement("span");
            span.className = "om-pager__gap";
            span.textContent = "…";
            span.setAttribute("aria-hidden", "true");
            return span;
          }
          const button = document.createElement("button");
          button.type = "button";
          button.className = "om-pager__page";
          button.textContent = String(entry);
          if (entry === state.page) {
            button.setAttribute("aria-current", "page");
          }
          button.setAttribute("aria-label", `Page ${entry}`);
          button.addEventListener("click", () => {
            page = entry;
            render(true);
          });
          return button;
        }),
      );
    }

    if (syncUrl) {
      const url = new URL(location.href);
      if (state.page === 1) url.searchParams.delete(param);
      else url.searchParams.set(param, String(state.page));
      history.replaceState(null, "", url);
    }

    if (announce) {
      // Move focus to the list so a keyboard reader lands on the new page
      // rather than staying on a button that may have just been replaced.
      body.setAttribute("tabindex", "-1");
      body.focus({ preventScroll: true });
      root.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  prev?.addEventListener("click", () => {
    page -= 1;
    render(true);
  });
  next?.addEventListener("click", () => {
    page += 1;
    render(true);
  });

  pager.hidden = false;
  render(false);
}

export function mountLists(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-om-list]").forEach(mountList);
}
