# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev            # Dev server
pnpm build          # Production build
pnpm check          # Svelte + type check
pnpm lint           # Prettier + ESLint
pnpm format         # Auto-format
pnpm test           # Unit tests (vitest --run)
pnpm coverage       # Coverage report
```

To run a single test file: `pnpm vitest run src/path/to/file.test.ts`

## Stack

SvelteKit 2 (Svelte 5 runes — **runes mode is forced globally**) + TypeScript (strict) + Tailwind CSS v4 + shadcn-svelte components. Deployed as a static SPA to Cloudflare Pages. i18n via `wuchale` (English + Japanese).

## Architecture

### Route structure

```
src/routes/
├── +layout.svelte              # Root: ModeWatcher, Toaster
├── +page.svelte                # Landing page
└── (app)/
    ├── +layout.svelte          # App shell with AppHeader
    └── csv-studio/
        ├── +page.svelte
        ├── csv-studio.svelte.ts  # All CSV Studio state (Svelte runes)
        ├── CsvTable.svelte
        ├── CsvToolbar.svelte
        ├── CsvSidebar.svelte
        └── SaveFilterButton/     # Preset save/load UI
```

### State management

All CSV Studio state lives in `src/routes/(app)/csv-studio/csv-studio.svelte.ts` as a single Svelte 5 runes module. It holds:

- **Data**: `rows[]`, `columns[]`, `columnIndex` (inverted index: column → value → row indices)
- **Filters**: `colFilters` (value lists), `colDateFilters` (date ranges), `colEmptyFilters` (empty/nonempty)
- **UI**: `colVisible[]`, `colRename[]`, `sortCol`, `sortDir`
- **Presets**: saved filter sets in localStorage (max 10)
- **Derived**: `visibleColumns`, `filteredRows`, `sortedRows`, `colAvailableValues` — all via `$derived`

### Filter/column logic

`src/lib/csv-studio/detect-columns.ts` handles:

- `buildColumnIndex()` — inverted index for fast row lookups
- `computeFilteredRows()` — applies all active filter types
- `computeCrossFilteredValues()` — dropdown options that exclude the current column's own filter (prevents orphaned selections)
- `isLikelyDate()` — column type detection (>80% valid dates → date type)

### Export

- **CSV** (`export-csv.ts`): PapaParse serialization, File Picker API with blob-download fallback
- **PDF** (`export-pdf.ts`): jsPDF + jsPDF-autotable; embeds OxaniumVariable (headers) and Noto Sans JP (CJK) fonts

### Testing

Two Vitest projects defined in `vite.config.ts`:

- **client** — Playwright headless Chromium, matches `*.svelte.test.ts`
- **server** — Node environment, matches `*.test.ts` excluding `*.svelte.test.ts`

Coverage excludes `src/lib/components/ui/*` and locales.

## Key constraints

- **Row cap**: Display truncated at 5000 rows (warning shown to user).
- **Encoding**: Shift-JIS fallback when UTF-8 decoding produces corruption (for Japanese CSVs).
- **No SSR**: Static adapter + SPA fallback; all filtering/export is purely client-side.
- **Shadcn components**: Add new UI primitives via `pnpm dlx shadcn-svelte@latest add <component>`, not by hand.
- **Localization**: All user-facing strings must go through wuchale. Locale files are in `src/locales/`.
