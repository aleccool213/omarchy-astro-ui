import { showTip, hideTip, escapeHtml } from "./tooltip.ts";

/** Generic hover/focus tooltip for anything carrying data-om-tip: heatmap
 *  cells, stat hint buttons, legend swatches. Delegated, so rows added later
 *  work without re-mounting. */

export function mountTips(root: ParentNode = document): void {
  const host = (root === document ? document.body : root) as HTMLElement;
  if (!host || host.dataset?.omTips === "on") return;
  if (host.dataset) host.dataset.omTips = "on";

  const tipFor = (target: EventTarget | null): HTMLElement | null => {
    if (!(target instanceof Element)) return null;
    return target.closest<HTMLElement>("[data-om-tip]");
  };

  const show = (el: HTMLElement): void => {
    const text = el.dataset.omTip;
    if (!text) return;
    const rect = el.getBoundingClientRect();
    showTip(escapeHtml(text), rect.left + rect.width / 2, rect.top);
  };

  host.addEventListener("pointerover", (event) => {
    const el = tipFor(event.target);
    if (el) show(el);
  });
  host.addEventListener("pointerout", (event) => {
    if (tipFor(event.target)) hideTip();
  });
  host.addEventListener("focusin", (event) => {
    const el = tipFor(event.target);
    if (el) show(el);
  });
  host.addEventListener("focusout", (event) => {
    if (tipFor(event.target)) hideTip();
  });
  // Touch: a tap on a cell should show its value, not require a hover.
  host.addEventListener("click", (event) => {
    const el = tipFor(event.target);
    if (el) show(el);
  });
  window.addEventListener("scroll", hideTip, { passive: true });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideTip();
  });
}
