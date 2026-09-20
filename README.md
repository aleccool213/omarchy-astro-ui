# omarchy-astro-ui

Shared component library for my personal web apps — `split-log`, `health-board`,
`household-money` and `bigal`. One token contract, two themes, five components,
and a storyboard that renders every specimen in every theme/mode combination.

The repo is `omarchy-astro-ui` (Astro is the main consumer); the package it
publishes is `@omarchy/ui`, which also ships React renderers for `split-log`.

```
packages/ui/          @omarchy/ui — the library
apps/storyboard/      live specimens, deployable to Vercel
```

## Why it is shaped this way

Three of the four apps are Astro with plain CSS and no JS framework; the fourth
(`split-log`) is React + Tailwind. A React component library would have forced a
React runtime into three currently zero-JS sites, so instead:

- **The CSS is written once.** Components are `om-`prefixed classes driven
  entirely by tokens — not Tailwind utilities — so the same stylesheet serves
  Astro and React and the library never needs to be in anyone's Tailwind content
  scan.
- **The hard part is framework-free.** Chart geometry, calendar grids and
  pagination live in `@omarchy/ui/core` as pure functions with unit tests. The
  `.astro` and `.tsx` renderers are thin markup over identical numbers.
- **The package ships source, not a build.** Every consumer is Vite-based
  (Astro 5, Astro 7, TanStack Start), so they compile it themselves. That is
  what lets one package serve an Astro 5 app and an Astro 7 app at the same time
  without a peer-dependency fight.

## Install

```sh
npm install @omarchy/ui
```

Not published yet. Until it is, link it from a local checkout — a `github:`
dependency will not work, because npm installs a git dependency from the repo
root and the package lives in `packages/ui`:

```sh
# in this repo
npm link --workspace=@omarchy/ui
# in the consuming app
npm link @omarchy/ui
```

When you do publish: `npm publish --access public --workspace=@omarchy/ui`.

Astro needs one line of config, because the package is source rather than a
build output:

```js
// astro.config.mjs
export default defineConfig({
  vite: { ssr: { noExternal: ["@omarchy/ui"] } },
});
```

## Use

```astro
---
import "@omarchy/ui/styles.css";          // tokens + base + components
import "@omarchy/ui/themes/lupine.css";   // exactly one theme
import "@omarchy/ui/fonts.css";           // optional; or self-host the two families

import OmThemeScript from "@omarchy/ui/astro/OmThemeScript.astro";
import OmPageHeader from "@omarchy/ui/astro/OmPageHeader.astro";
import OmStat from "@omarchy/ui/astro/OmStat.astro";
---
<html lang="en">
  <head>
    <OmThemeScript />   <!-- must be in <head>, before any stylesheet -->
  </head>
  <body>
    <OmPageHeader title="Health board" nav={[{ href: "/", label: "Board" }]} dock />
    <main class="om-shell">
      <OmStat label="Steps / day" value={9240} format="k" />
    </main>
  </body>
</html>
```

React is the same CSS and the same core:

```tsx
import "@omarchy/ui/styles.css";
import "@omarchy/ui/themes/lupine.css";
import { OmStat, OmTimeSeriesChart } from "@omarchy/ui/react";
```

## Components

| Component | Astro | React |
|---|---|---|
| `OmStat` / `OmStatGrid` | ✅ | ✅ |
| `OmTimeSeriesChart` (line / area / bar) | ✅ | ✅ |
| `OmSparkline` | ✅ | ✅ |
| `OmActivityHeatmap` | ✅ | ✅ |
| `OmDataList` (stack / rows / table + pagination) | ✅ | ✅ |
| `OmPageHeader` / `OmThemeToggle` / `OmThemeScript` | ✅ | ✅ (script is Astro-only) |

Full prop reference: [`packages/ui/README.md`](packages/ui/README.md).

## Storyboard

```sh
npm install
npm run dev        # http://localhost:4321
npm run build
```

Deploy: import this repo into Vercel and accept the defaults. The root
`vercel.json` already points the build at the storyboard workspace, so **leave
the Vercel "Root Directory" at the repository root** — do not set it to
`apps/storyboard`, or the workspace install will not resolve `@omarchy/ui`.

## Tests

```sh
npm test           # 34 unit tests over the core geometry, scales and pagination
```

The chart palettes are validated rather than eyeballed — see
[`packages/ui/README.md#palettes`](packages/ui/README.md#palettes) for the
numbers and the re-validation command.

## Adding a component

1. Tokens first — if it needs a colour that is not in the contract, add it to
   **both** theme files before writing markup.
2. Put any real logic in `src/core/` as a pure function, with tests.
3. Write `src/styles/components/<name>.css` against tokens only.
4. Write the `.astro` renderer, then the `.tsx` one. They take the same props.
5. Add a page to the storyboard covering the empty, single, many and
   overflowing cases.
