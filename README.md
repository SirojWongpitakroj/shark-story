# Shark Attacks: Perception vs Reality

This directory is the complete website Git repository. Its historical name is `dist`, but it now contains both the editable sources and the generated static website. A clone builds and runs without any parent-folder files.

## Build, check, and preview

Use Node.js 22 or newer. There are no third-party npm dependencies to install.

From this repository directory:

```powershell
node build-story.js
npm test
node preview.mjs
```

Equivalent commands are `npm run build` and `npm run preview`. Open http://localhost:4173/#hero/1.

From the original `DataViz` workspace, the new paths are:

```powershell
node .\shark-story\dist\build-story.js
node .\shark-story\dist\preview.mjs
```

The old build and preview scripts in `shark-story/` were moved into this repository. Preview serves this directory and does not rebuild automatically. Stop a running preview with Ctrl+C before starting another on port 4173. For a separate test server, set the optional `SHARK_STORY_PORT` environment variable.

## What to edit

| File | Purpose |
| --- | --- |
| `story-chapters.js` | Narrative text, headings, blue highlights, and figure order |
| `story-pages.js` | Which related ideas share one snap page |
| `build-story.js` | Generates `index.html`, including the hero and final source pages |
| `presentation-charts.js` | Renders transparent inline charts from local summary CSVs |
| `map-markup.js` | Generates the interactive map's HTML and country-year data |
| `styles.css` | Shared dark-blue underwater identity and typography |
| `screens.css` | Full-screen page layout, sizing, hierarchy, and snap boundaries |
| `story.js` | Wheel/keyboard/touch navigation, momentum blocking, bookmarks, and focus |
| `map-core.js`, `country-map.js`, `map.css` | Map calculations, interaction, and presentation |

`index.html` and `data/country_year_counts.json` are generated; edit their source scripts instead. All other runtime files, input data, and chart assets are preserved by the build.

## Repository-local inputs

`data/` contains the cleaned incidents, audited chart summaries, cleaning audit, and figure manifest. These files are the website's authoritative inputs. `figures/` contains the complete existing SVG/PNG chart assets. `build-story.js`, `presentation-charts.js`, and `map-markup.js` read only these repository-local inputs.

The original analysis project can remain outside the repository for research, but the website no longer reads its `derived_data/`, `figures/`, raw CSV, or scripts. New analysis results must be deliberately placed in this repository's `data/` and `figures/` directories before rebuilding.

## GitHub Pages

`.github/workflows/pages.yml` checks out this repository, sets up Node.js 22, builds the website, runs the checks, and deploys the site from the repository root. Pushing source changes to `main` therefore rebuilds the deployed HTML; manually regenerating and committing `index.html` is optional for deployment.

The workflow also supports manual dispatch. Existing Pages permissions, deployment environment, and artifact path are preserved.

## Current story and interaction

The site has 40 full-screen snap pages across nine narrative chapters, followed by About the Data and Data & Sources. Every settled page is one `100dvh` viewport with no internal scrolling. A fresh wheel/trackpad gesture, Arrow/Page key, Space, or vertical swipe advances one page; Shift+Space reverses. Momentum cannot skip another page. Transitions last 600ms, or are instant for reduced motion. Focus remains in the active page.

The opening takeaway and highlighted danger question share one page. Encounters ↑ and Fatality ↓ share another. The circumstances sentence is small and unhighlighted above “Where do they happen?”. The unknown-species question and its smaller, cautious explanation share a page. The historical-record interpretation has the Survivorship Bias topic and highlights “what was documented.” The ending keeps only About the Data and the Kaggle source link.

Shareable URLs include `#surface/3`, `#fatality/3`, `#where/2`, `#unidentified/3`, `#data-gaps/7`, and `#sources/1`. Hash changes use `history.replaceState()` without reloading. Legacy bookmark aliases remain supported.

## Interactive map and offline boundaries

The map retains year filters, hover/tap selection, live values, fixed bins, the Robinson projection, and a secondary paginated country table. If the published boundary download fails, country counts remain available in the table.

To bundle the identical published World Atlas geometry for offline use:

```powershell
node cache-boundaries.mjs
node build-story.js
```

This writes `world-boundaries.js` directly in the repository root. Natural Earth attribution and the projection license remain in the repository.

## Verification

`npm test` runs six checks:

- `check-data.js`: all cleaned records, summaries, eligibility rules, ten PNGs/SVGs, and manifest.
- `check-site.js`: generated figures, inline SVG descriptions, unique IDs, links, and chart totals.
- `check-panels.js`: current page combinations, narrative order, highlights, and source-page trimming.
- `check-map.js`: totals, inclusive periods, aliases, projection, and geometry decoding.
- `check-map-controls.js`: selection, filtering, pagination, modal focus, and offline fallback.
- `check-scroll.js`: viewport boundaries, gestures, momentum, keyboard/touch, reduced motion, bookmarks, and focus.

Each check can also run directly with Node from any working directory. Browser visual review is a separate check when browser access is available.

Author and course attribution remain unset in the displayed site.
