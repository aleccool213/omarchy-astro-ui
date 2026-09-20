import { mountCharts } from "./chart.ts";
import { mountTips } from "./hover.ts";
import { mountLists } from "./list.ts";
import { mountThemeToggles } from "./theme.ts";

export { mountChart, mountCharts } from "./chart.ts";
export { mountTips } from "./hover.ts";
export { mountList, mountLists } from "./list.ts";
export { mountThemeToggles } from "./theme.ts";
export { showTip, hideTip } from "./tooltip.ts";

/** Idempotent — safe to call after any client-side navigation or re-render. */
export function mountAll(root: ParentNode = document): void {
  mountTips(root);
  mountCharts(root);
  mountLists(root);
  mountThemeToggles(root);
}

export function autoInit(): void {
  if (typeof document === "undefined") return;
  const run = () => mountAll(document);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
  // Astro view transitions swap the document without a fresh page load.
  document.addEventListener("astro:page-load", run);
}
