# Roka

A personal productivity web app. Features a suite of small, focused tools for CSV data wrangling and shipping workflows.

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

### Ship It

A Shopify → Japan Post shipping label generator. Load a Shopify orders CSV export, configure your sender profile, and get a YuPack-formatted CSV ready to upload to Japan Post — encoded in Shift-JIS as required.

- **Shopify import** — drag-and-drop a Shopify orders CSV; duplicate orders are automatically deduplicated
- **Sender profile** — save your return address and contact details; persisted in localStorage
- **Address overrides** — correct or override individual recipient addresses before export
- **Zipcode lookup** — auto-fill address fields from a Japanese postal code
- **YuPack export** — outputs a Shift-JIS CSV in Japan Post's YuPack import format

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

### Zipcode lookup

The zipcode lookup (`/api/postal-lookup`) runs as a Cloudflare Pages Function. `pnpm dev` won't serve it — you need Wrangler to handle the function alongside the Vite dev server:

```bash
pnpm pages:dev
```

Then open http://localhost:8788 instead of http://localhost:5173.
This runs Wrangler as a proxy in front of the Vite dev server so the `/api/postal-lookup` function is available. It proxies requests to [zipcloud.ibsnet.co.jp](https://zipcloud.ibsnet.co.jp) — no API key required. Without it, the lookup silently fails and addresses can still be filled in manually.
