import { useEffect, useState } from "react";
import { activeThemeKey, currentTheme, toggleTheme, type ThemeMode } from "../core/theme.ts";

export function OmThemeToggle({ className }: { className?: string }) {
  // Never guess during SSR: the label stays empty until the client resolves it,
  // so the markup cannot contradict the stored choice.
  const [mode, setMode] = useState<ThemeMode | null>(null);

  useEffect(() => {
    setMode(currentTheme(activeThemeKey()));
  }, []);

  return (
    <button
      type="button"
      className={["om-theme-toggle", className].filter(Boolean).join(" ")}
      aria-pressed={mode === "dark"}
      aria-label={mode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setMode(toggleTheme(activeThemeKey()))}
    >
      <span aria-hidden="true">{mode == null ? "" : mode === "dark" ? "☀" : "☾"}</span>
    </button>
  );
}
