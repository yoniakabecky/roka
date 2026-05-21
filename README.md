# Roka — ろか【濾過】

> _Filtration_ — load your data, filter it down to exactly what you need, export it clean.

**[Live Demo →](https://roka-udy.pages.dev/)**

![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=flat&logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-F38020?style=flat&logo=cloudflare&logoColor=white)

## Overview

A browser-based toolkit for CSV wrangling and Japan Post shipping. No server — all filtering, encoding, and export happen entirely in the browser, so your data never leaves your machine.

Built as a personal productivity project and a testbed for AI-driven development with [Claude Code](https://claude.ai/code).

<!-- Add a screenshot or GIF here once you have one -->

### Why this project exists

A friend runs a small business in Japan. The SaaS she uses for toB sales only filters a handful of columns and exports full pages regardless of what's filtered — CSV Studio fills that gap.  
Separately, for her online shop on Shopify (toC), she was copy-pasting each order address into Japan Post's web form by hand; Ship It bridges Shopify's order export to the exact CSV format Japan Post accepts for bulk import.

---

## Tools

### CSV Studio

A safe import → export tool for CSV files. Load your file, slice it down to exactly what you need, and export — the original data is never modified.

- **Filtering** — per-column value filters, date range filters, and empty/non-empty filters
- **Sorting** — click any column header to sort ascending/descending
- **Column visibility** — hide columns before export
- **Column renaming** — rename headers in the output without touching source data
- **Export** — download as CSV or PDF (with embedded Japanese font support)

### Ship It

A Shopify → Japan Post shipping label generator. Drop in a Shopify orders export, configure your sender profile, and get a YuPack-formatted CSV ready to upload to Japan Post.

- **Shopify import** — drag-and-drop orders CSV; duplicate orders are automatically deduplicated
- **Sender profile** — save your return address and contact details in localStorage
- **Address overrides** — correct individual recipient addresses before export
- **Zipcode lookup** — auto-fill address fields from a Japanese postal code
- **YuPack export** — Shift-JIS CSV in Japan Post's exact import format

---

## Under the Hood

A few things that were worth solving carefully:

- **Cross-filter isolation** — dropdown options per column are derived by excluding that column's own active filter, so selecting a value in one column never orphans selections in another. Backed by an inverted index (`column → value → row[]`) and recomputed via `$derived`.
- **Client-side Shift-JIS encoding** — Japan Post's YuPack format requires Shift-JIS. Since the browser's `TextEncoder` only outputs UTF-8, a custom encoder handles the conversion entirely client-side.
- **PDF with Japanese fonts** — Exports embed OxaniumVariable (headers) and Noto Sans JP (CJK) via jsPDF, so exported PDFs render correctly with no font fallback issues.
- **Svelte 5 runes as the state layer** — All CSV Studio state lives in a single `.svelte.ts` runes module. No stores, no context — just reactive state that's straightforward to follow and test in isolation.
- **Shift-JIS input detection** — When UTF-8 decoding produces garbled output, the parser falls back to Shift-JIS automatically, handling Japanese CSVs without any user action.

---

## Tech Stack

| Layer      | Choice                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------- |
| Framework  | [SvelteKit](https://kit.svelte.dev/) (Svelte 5 runes)                                         |
| Styling    | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn-svelte](https://www.shadcn-svelte.com/) |
| Language   | TypeScript (strict)                                                                           |
| i18n       | [wuchale](https://github.com/wuchale/wuchale) — English + Japanese                            |
| Deployment | Cloudflare Pages (static adapter)                                                             |
| Testing    | Vitest + Playwright                                                                           |

---

## Local Development

```bash
pnpm install
pnpm dev
```

```bash
pnpm test        # unit tests
pnpm build       # production build
pnpm check       # Svelte + type check
```

### Zipcode lookup

The zipcode lookup (`/api/postal-lookup`) runs as a Cloudflare Pages Function. `pnpm dev` won't serve it — use Wrangler instead:

```bash
pnpm pages:dev
```

Open `http://localhost:8788` (not `:5173`). Wrangler proxies the Vite dev server and handles the `/api/postal-lookup` function, which in turn proxies [zipcloud.ibsnet.co.jp](https://zipcloud.ibsnet.co.jp) — no API key required. Without it, the lookup silently fails and addresses can still be entered manually.
