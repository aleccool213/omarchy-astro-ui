# Migrating the apps

Suggested order — each phase is independently shippable, and the first one
proves the whole pipeline on the lowest-risk app.

## Phase 1 — health-board: `OmStat` + theme

The app with the most duplication and no build complexity.

1. Add `"@omarchy/ui": "github:aleccool213/omarchy-astro-ui#v0.2.0"` and the
   `vite.ssr.noExternal` line in `astro.config.mjs`.
2. In `src/layouts/Base.astro`, replace the inline no-flash script with
   `<OmThemeScript />` and import `styles.css` + `themes/lupine.css` +
   `compat.css`.
3. Delete the `:root` / `html.dark` blocks at the top of
   `src/styles/global.css`. `compat.css` keeps `--bg`, `--ink`, `--line` and the
   rest alive, driven by `--om-*` underneath, so the remaining CSS keeps working
   untouched.
4. Replace `src/components/Stat.astro` with `OmStat`. The `.tile` rules in
   `global.css` can go with it.
5. Swap the header/dock markup for `OmPageHeader … dock`.

⚠️ The theme key changes from `health-board-theme` to `om-theme`. Everyone's
stored preference resets once. If that matters, migrate it in the no-flash
script before first paint.

## Phase 2 — charts and heatmap

- **health-board**: `TrendChart.astro` → `OmTimeSeriesChart` (its maths is what
  `core/series.ts` was ported from), `WorkoutGraph.astro` →
  `OmActivityHeatmap`.
- **split-log**: `charts.tsx` → `OmTimeSeriesChart` from `@omarchy/ui/react`,
  `heatmap.tsx` → `OmActivityHeatmap`. **This drops the `recharts` dependency.**
  Point split-log's Tailwind `@theme` block at `var(--om-*)` rather than
  re-declaring hexes, or you are back to two sources of truth.

## Phase 3 — `OmDataList`

- **household-money**: `Ledger.astro` → `density="table"`, and
  `Sparkline.astro` → `OmSparkline`.
- **split-log**: the `SessionRow` list → `density="stack"`.
- **bigal**: `.post-index` → `density="rows"`.

## Phase 4 — bigal onto `tokyo-night`

Swap `src/styles/global.css`'s `--t-*` block for
`themes/tokyo-night.css` + `compat.css`. bigal keeps its exact look and gains
every component. This is the proof that the theme layer is real rather than
decorative.

## Notes

- `household-money` is on Astro 7 while the others are on Astro 5. The package
  ships `.astro` source so each app's own Astro compiles it — that is what makes
  this work. Keep the storyboard building on both majors before publishing.
- `bigal` is dark-only. `tokyo-night.css` sets `--om-toggle-display: none` and
  the toggle removes itself; give the theme a light block and it comes back with
  no component change.
