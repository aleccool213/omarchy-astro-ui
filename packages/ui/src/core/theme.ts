/** One theme key, one no-flash snippet, one toggle. This replaced three
 *  near-identical inline scripts with three different localStorage keys. */

export type ThemeMode = "light" | "dark";

export const THEME_KEY = "om-theme";

/**
 * Inline this in <head>, before any stylesheet, via a raw <script> tag. It must
 * run synchronously during head parsing — a deferred or bundled module runs
 * after first paint, which is the flash it exists to prevent.
 *
 * Sets BOTH classes explicitly so the CSS never has to infer the unset case.
 */
export function noFlashScript(key: string = THEME_KEY): string {
  return `(function(){try{var k=${JSON.stringify(key)},t=localStorage.getItem(k),` +
    `d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches),` +
    `r=document.documentElement;r.classList.toggle("dark",d);r.classList.toggle("light",!d);}catch(e){}})();`;
}

export function currentTheme(key: string = THEME_KEY): ThemeMode {
  if (typeof document === "undefined") return "light";
  if (document.documentElement.classList.contains("dark")) return "dark";
  if (document.documentElement.classList.contains("light")) return "light";
  try {
    const stored = localStorage.getItem(key);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    /* private mode, blocked storage — fall through to the OS preference */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(mode: ThemeMode, key: string = THEME_KEY): void {
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.classList.toggle("light", mode === "light");
  try {
    localStorage.setItem(key, mode);
  } catch {
    /* the class is applied either way; only persistence is lost */
  }
  root.dispatchEvent(new CustomEvent("om:themechange", { detail: { mode }, bubbles: true }));
}

export function toggleTheme(key: string = THEME_KEY): ThemeMode {
  const next: ThemeMode = currentTheme(key) === "dark" ? "light" : "dark";
  applyTheme(next, key);
  return next;
}
