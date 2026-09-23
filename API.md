# @omarchy/ui

Tokens, themes and components for the omarchy-flavoured personal apps.

## Entry points

| Import | What |
|---|---|
| `@omarchy/ui/styles.css` | tokens + base + every component stylesheet |
| `@omarchy/ui/components.css` | tokens + components, **no base layer** — for an app that already has its own reset and body styles |
| `@omarchy/ui/themes/lupine.css` | light + dark periwinkle theme |
| `@omarchy/ui/themes/tokyo-night.css` | dark-only Tokyo Night theme |
| `@omarchy/ui/fonts.css` | the one canonical Google Fonts import |
| `@omarchy/ui/compat.css` | migration shim mapping old per-app token names |
| `@omarchy/ui/astro/<Name>.astro` | Astro renderers |
| `@omarchy/ui/react` | React renderers |
| `@omarchy/ui/core` | framework-free geometry, scales, pagination, theme helpers |
| `@omarchy/ui/client/<name>.ts` | the vanilla interaction modules, if you mount them yourself |

Import **exactly one theme**. `styles.css` carries no colour of its own.

## Token contract

A theme fills these; components read nothing else.

```
--om-bg --om-bg-deep --om-surface --om-surface-2
--om-fg --om-fg-muted --om-fg-subtle
--om-line --om-line-strong
--om-accent --om-accent-ink --om-accent-soft
--om-pos --om-neg --om-warn --om-focus --om-dot
--om-series-1 … --om-series-6     categorical, fixed order, never cycled
--om-ramp-0 … --om-ramp-4         sequential; 0 = "no data"
--om-toggle-display               set to `none` on a single-mode theme
```

Structural tokens (type scale, spacing, `--om-radius`, `--om-measure`,
`--om-page`, motion, chart geometry) live in `tokens.css` inside the
`om-tokens` cascade layer, so an unlayered theme file overrides any of them
regardless of stylesheet order.

## Components

### `OmStat` / `OmStatGrid`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `label` | `string` | — | |
| `value` | `string \| number \| null` | — | `null` renders an en dash |
| `unit` | `string` | — | |
| `format` | `NumberFormat` | `"int"` | `int \| locale \| fixed1 \| fixed2 \| k \| compact \| percent`. `locale` groups thousands ("3,386"); `int` does not, because axis ticks are tighter for space |
| `hint` | `string` | — | adds a `?` with a tooltip |
| `delta` | `number \| null` | `null` | |
| `deltaFormat` | `NumberFormat` | `"fixed1"` | |
| `goodDirection` | `"up" \| "down"` | `"up"` | which sign is green; the arrow still follows the sign |
| `unitPlacement` | `"inline" \| "block"` | `"inline"` | `block` drops the unit onto its own line under the figure; the delta stays on the figure's line either way |

`OmStatGrid` takes `cols` (default 2) and `colsSm` (default 3).

### `OmTimeSeriesChart`

| Prop | Type | Default |
|---|---|---|
| `series` | `ChartSeries[]` | — |
| `kind` | `"line" \| "area" \| "bar"` | `"line"` |
| `title` `unit` `note` | `string` | — |
| `format` | `NumberFormat` | `"int"` |
| `width` `height` | `number` | `640` / `220` |
| `reverseY` | `boolean` | `false` |
| `bare` | `boolean` | `false` |
| `table` | `boolean` | `true` |

```ts
interface ChartSeries { key: string; label: string; points: ChartPoint[] }
interface ChartPoint  { label: string; value: number | null; tip?: string }
```

Behaviour worth knowing:

- **A `null` value breaks the line and the area fill** rather than bridging it.
- **Bars are measured from zero; lines are not.** A line chart zoomed to its own
  range is the point of a line chart.
- **One series gets no legend** (the title names it). Two or more always get
  one; four or fewer non-bar series are also direct-labelled.
- **Seven series throws.** Cycling the palette would give two different things
  the same colour — fold the tail into "Other" or use small multiples.
- The collapsed **table view** is both the screen-reader fallback and the
  contrast relief the light palette requires. Only pass `table={false}` if the
  values are readable elsewhere on the page.
- The plot is focusable: ← → step columns, Home/End jump, Esc dismisses.

### `OmSparkline`

`values: (number | null)[]`, optional `width` / `height` / `label`. Inherits
`currentColor`. Renders nothing when there is not enough data for a line.

### `OmActivityHeatmap`

| Prop | Type | Default |
|---|---|---|
| `values` | `Record<string, number> \| Map<string, number>` | — |
| `weeks` | `number` | `16` |
| `end` | `string` (ISO) | today |
| `start` | `string` (ISO) | derived from `weeks` |
| `timeZone` | `string` | system |
| `thresholds` | `number[]` | quartiles of the observed max |
| `noun` | `[string, string]` | `["entry", "entries"]` |

Columns are always whole Monday-start weeks; dates are UTC-anchored so a cell
never shifts when the viewer changes timezone. Days after `end` render blank.
Cells cap at 20px so a 13-week calendar is not twice the height of a 26-week one.

### `OmDataList`

| Prop | Type | Default |
|---|---|---|
| `density` | `"stack" \| "rows" \| "table"` | `"stack"` |
| `perPage` | `number` | `10` |
| `title` | `string` | — |
| `total` | `number` | — (Astro: needed for the SSR count) |
| `showCount` | `boolean` | `true` |
| `emptyLabel` | `string` | `"Nothing to show."` |
| `syncUrl` / `pageParam` | `boolean` / `string` | `false` / `"page"` |

**Astro** takes rows through the default slot, each with `class="om-list__row"`
(a `<tr>` for `density="table"`, plus a `head` slot). It renders every row and
hides the pager, then the client script hides the off-page rows — so the full
list is still readable with JavaScript off. For lists long enough that shipping
every row is wrong, paginate on the server with `?page=` and render one page;
the markup and styles are the same.

**React** takes `items`, `renderRow` and `rowKey` and paginates with real state.

### `OmPageHeader` / `OmThemeToggle` / `OmThemeScript`

`OmThemeScript` must sit in `<head>` before any stylesheet — it writes `.dark`
or `.light` onto `<html>` synchronously, which is what prevents the flash. One
storage key, `om-theme`, for every app.

`OmPageHeader` takes `title`, `href`, `nav`, `dock`, `themeToggle`, and slots for
`logo` and `actions`. The React version adds `renderLink` so a router's `<Link>`
can be injected without the library depending on a router.

`OmThemeToggle` renders an empty label on the server and stamps ☾/☀ on mount —
SSR cannot know the stored choice, and a guess would contradict it. It removes
itself under a theme that sets `--om-toggle-display: none`.

## Palettes

Both themes' chart colours were validated, not chosen by eye, against the
lightness band, chroma floor, adjacent-pair separation under simulated
protanopia and deuteranopia, a normal-vision floor and contrast on their own
surface:

| Palette | Worst adjacent CVD ΔE | Normal-vision ΔE | Contrast |
|---|---|---|---|
| lupine light (`#fafafa`) | 9.1 | 19.6 | 3 slots below 3:1 — relief required |
| lupine dark (`#121212`) | 8.4 | 19.3 | all ≥ 3:1 |
| tokyo-night (`#1a1b26`) | 14.8 | 22.9 | all ≥ 3:1 |

Tokyo Night's source pastels sit at OKLCH L 0.72–0.82, above the 0.48–0.67 dark
band, so the series steps are the same hues stepped down into the band.

The three light slots below 3:1 are why every multi-series chart ships a legend,
direct labels and a table view — that combination is the relief channel that
makes the palette legal. **Do not re-order the series slots**: the order is the
colourblind-safety mechanism, not a mood board.

If you change a colour, re-validate before committing:

```sh
node scripts/validate_palette.js "<hex,hex,…>" --mode light --surface "#fafafa"
```

## Core

```ts
import {
  buildChart, buildHeatmap, paginate, pageWindow, niceScale,
  formatNumber, addDaysISO, mondayOf, todayISO,
  noFlashScript, applyTheme, toggleTheme, THEME_KEY,
} from "@omarchy/ui/core";
```

All pure, all unit-tested (`npm test` at the repo root).
