# Changelog

Consumers install from a tag — `"@omarchy/ui": "github:aleccool213/omarchy-astro-ui#v0.4.0"`.
To take a new release, change the tag in the app's package.json and run
`npm install`. Changing the string is what makes npm fetch again: an unchanged
`#main` is treated as already satisfied, locally and in a cached CI build.

## 0.4.0

Found while moving household-money onto the library.

**Added**
- `OmStackedBar` — one part-to-whole bar with a legend carrying every number.
  Percentages round by largest remainder so they always sum to 100; `slot`
  pins a category's colour across bars; a seventh colour throws. Core:
  `buildShares`.
- `OmDelta` — the inline "▲ 1.2%" change on its own, for table cells and
  anywhere a full `OmStat` is too much. Core: `deltaModel`, now shared with
  `OmStat` so the two never disagree.
- `OmCallout` — a boxed note with an `info` / `ok` / `warn` / `alert` tone bar.
- `OmSection` — a titled, `aria-labelledby` page section with an optional
  note and an `actions` slot.
- `OmStat` `variant="hero"` — the page's one big figure, unboxed, with the
  label as an eyebrow and the delta underneath.
- `OmStat` `deltaUnit` — e.g. `"%"` when the delta is a percentage change.

**Fixed**
- A delta's direction was only an `aria-hidden` arrow, so screen readers heard
  "1.2" with no sign. `OmStat` and `OmDelta` now speak "up" / "down".

## 0.3.0

Found while moving split-log onto the library.

**Added**
- `formatNumber` `"clock"` — seconds as a time ("2:50.4", "1:02:05.0"), for
  paces and durations. Chart axes stepping in whole seconds tick "2:50", so a
  reversed pace chart reads like the erg's monitor rather than "170".

## 0.2.0

Everything found while moving health-board onto the library.

**Added**
- `components.css` — tokens + components without the base layer, for an app
  that already owns its reset, body, typography and links.
- `OmStat` `unitPlacement="block"` — the unit on its own line under the figure.
- `OmActivityHeatmap` `formatTip` and `cellSize`.
- `OmTimeSeriesChart` `markers` — a dot on every point of a line or area.
- `OmThemeScript` `legacyKey` — carries a choice saved under an app's old key
  over to `om-theme`, so switching keys resets nobody's light/dark preference.
- `formatNumber` `"locale"` — grouped thousands ("3,386").

**Fixed**
- `OmStat` never mounted its tooltip, so its `?` hint was dead on a page with
  no chart or heatmap.
- Charts sat 40px in from both edges: `<figure>`'s default margin was never reset.
- An `int` axis ticked in fractions and, rounded, read "0, 0, 1, 1, 1"; it now
  ticks in whole numbers. An all-zero bar chart no longer grows a -1..1 axis.
- The stat unit inherited the value's bold weight.
- The theme toggles hard-coded `om-theme`, so a custom `storageKey` left the
  script and the toggle disagreeing. They now follow the script's key.
- lupine didn't set `color-scheme`, so scrollbars and form controls stayed
  light in dark mode unless `base.css` was imported.
- Heatmap day column read M/W/F/S; a lone "S" beside a blank Saturday was ambiguous.
- `formatNumber("k")` wrote "5.0k" for a round thousand.

**Changed**
- The library lives at the repo root, so a plain `github:` dependency installs it.

## 0.1.0

Initial tokens, lupine and tokyo-night themes, five components and the storyboard.
