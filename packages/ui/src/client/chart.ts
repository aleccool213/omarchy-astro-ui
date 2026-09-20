import { showTip, hideTip, escapeHtml } from "./tooltip.ts";

/** Crosshair + tooltip for OmTimeSeriesChart. The chart ships its column hit
 *  areas as JSON so this file never re-derives the geometry the core computed. */

interface Column {
  index: number;
  label: string;
  x: number;
  x0: number;
  x1: number;
  values: { key: string; label: string; slot: number; value: number | null; tip: string }[];
}

export function mountChart(root: HTMLElement): void {
  if (root.dataset.omReady === "chart") return;
  const svg = root.querySelector<SVGSVGElement>("svg");
  const payload = root.querySelector<HTMLScriptElement>("script[data-om-columns]");
  if (!svg || !payload) return;

  let columns: Column[];
  try {
    columns = JSON.parse(payload.textContent || "[]");
  } catch {
    return;
  }
  if (!columns.length) return;

  root.dataset.omReady = "chart";
  const crosshair = svg.querySelector<SVGLineElement>("[data-om-crosshair]");
  const focus = svg.querySelector<SVGGElement>("[data-om-focus]");
  const viewBox = svg.viewBox.baseVal;
  const single = columns[0].values.length === 1;
  let active = -1;

  function toViewBoxX(clientX: number): number {
    const rect = svg!.getBoundingClientRect();
    if (!rect.width) return 0;
    // width:100% / height:auto preserves the aspect ratio, so one scale factor
    // covers both axes.
    return ((clientX - rect.left) / rect.width) * viewBox.width;
  }

  function nearest(x: number): Column | null {
    let best: Column | null = null;
    let bestDistance = Infinity;
    for (const column of columns) {
      if (x >= column.x0 && x <= column.x1) return column;
      const distance = Math.abs(column.x - x);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = column;
      }
    }
    return best;
  }

  function render(column: Column, clientX: number, clientY: number): void {
    const rows = column.values
      .map((v) => {
        const swatch = single
          ? ""
          : `<span class="om-tip__swatch" style="background:var(--om-series-${v.slot})"></span>`;
        const name = single ? "" : `<span class="om-tip__name">${escapeHtml(v.label)}</span>`;
        return `<div class="om-tip__row">${swatch}${name}<span class="om-tip__value">${escapeHtml(v.tip)}</span></div>`;
      })
      .join("");
    showTip(`<div class="om-tip__title">${escapeHtml(column.label)}</div>${rows}`, clientX, clientY);
  }

  function moveFocus(column: Column): void {
    if (crosshair) {
      crosshair.setAttribute("x1", String(column.x));
      crosshair.setAttribute("x2", String(column.x));
      crosshair.classList.remove("om-hidden");
    }
    if (focus) {
      focus.querySelectorAll<SVGCircleElement>("circle").forEach((circle) => {
        const cx = circle.dataset.omX?.split(",")[column.index];
        const cy = circle.dataset.omY?.split(",")[column.index];
        if (cx === undefined || cy === undefined || cx === "" || cy === "") {
          circle.classList.add("om-hidden");
          return;
        }
        circle.setAttribute("cx", cx);
        circle.setAttribute("cy", cy);
        circle.classList.remove("om-hidden");
      });
    }
  }

  function clear(): void {
    active = -1;
    hideTip();
    crosshair?.classList.add("om-hidden");
    focus?.querySelectorAll("circle").forEach((c) => c.classList.add("om-hidden"));
  }

  function onMove(event: PointerEvent): void {
    const column = nearest(toViewBoxX(event.clientX));
    if (!column) return;
    if (column.index !== active) {
      active = column.index;
      moveFocus(column);
    }
    render(column, event.clientX, event.clientY);
  }

  svg.addEventListener("pointermove", onMove);
  svg.addEventListener("pointerdown", onMove);
  svg.addEventListener("pointerleave", clear);
  svg.addEventListener("pointercancel", clear);

  // Keyboard parity: the chart is focusable and arrows step through columns.
  svg.addEventListener("keydown", (event: KeyboardEvent) => {
    let next = active;
    if (event.key === "ArrowRight") next = Math.min(columns.length - 1, active + 1);
    else if (event.key === "ArrowLeft") next = Math.max(0, active - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = columns.length - 1;
    else if (event.key === "Escape") return clear();
    else return;
    event.preventDefault();
    if (next < 0) next = 0;
    active = next;
    const column = columns[next];
    moveFocus(column);
    const rect = svg.getBoundingClientRect();
    const scale = rect.width / viewBox.width;
    render(column, rect.left + column.x * scale, rect.top + rect.height / 2);
  });
  svg.addEventListener("blur", clear);
}

export function mountCharts(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-om-chart]").forEach(mountChart);
}
