import { activeThemeKey, currentTheme, toggleTheme } from "../core/theme.ts";

/** Binds every [data-om-theme-toggle] on the page and keeps their labels in
 *  sync — including across two toggles in one layout, or an OS-level change. */
export function mountThemeToggles(root: ParentNode = document): void {
  const toggles = Array.from(root.querySelectorAll<HTMLElement>("[data-om-theme-toggle]"));
  if (!toggles.length) return;

  const key = activeThemeKey();

  const sync = (): void => {
    const mode = currentTheme(key);
    for (const toggle of toggles) {
      toggle.setAttribute("aria-pressed", String(mode === "dark"));
      toggle.setAttribute("aria-label", mode === "dark" ? "Switch to light theme" : "Switch to dark theme");
      const label = toggle.querySelector("[data-om-theme-label]");
      if (label) label.textContent = mode === "dark" ? "☀" : "☾";
    }
  };

  for (const toggle of toggles) {
    if (toggle.dataset.omReady === "theme") continue;
    toggle.dataset.omReady = "theme";
    toggle.addEventListener("click", () => {
      toggleTheme(key);
      sync();
    });
  }

  // An explicit choice wins; until then, follow the OS.
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      /* unreadable storage means no explicit choice was recorded */
    }
    sync();
  });

  sync();
}
