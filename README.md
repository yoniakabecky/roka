# Roka

A personal productivity web app. Features a suite of small, focused tools — currently centered on CSV data wrangling, with more on the way.

**Live demo:** _coming soon_

\* Roka means filtration in Japanese - ろか【濾過】-

---

## Features

### CSV Studio

A safe import → export tool for CSV files. Load your file, filter down to exactly what you need, and export — original data is never modified. Useful when you want to share a filtered subset without risking accidental edits that can happen in Excel or similar tools.

- **Filtering** — per-column value filters, date range filters, and empty-value filters
- **Sorting** — click any column header to sort ascending/descending
- **Column visibility** — hide columns you don't want in the export
- **Column renaming** — rename headers in the output without touching the source data
- **Export** — download the result as CSV or PDF

---

## Tech Stack

| Layer      | Choice                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------- |
| Framework  | [SvelteKit](https://kit.svelte.dev/) (Svelte 5 runes)                                         |
| Styling    | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn-svelte](https://www.shadcn-svelte.com/) |
| Language   | TypeScript                                                                                    |
| i18n       | [wuchale](https://github.com/wuchale/wuchale)                                                 |
| Deployment | Cloudflare Pages (static adapter)                                                             |
| Testing    | Vitest + Playwright                                                                           |

---

## Roadmap

- [ ] **Auth** — Cloudflare Access integration
- [ ] **Inventory Manager** — connect to an open API to track and manage inventory data
- [ ] **More tools** — TBD based on personal workflow needs

---

## Local Development

```bash
pnpm install
pnpm dev
```

```bash
pnpm test        # unit tests
pnpm build       # production build
```
