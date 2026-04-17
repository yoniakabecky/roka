# Roka Design System

**Version:** 1.0.0  
**Stack:** SvelteKit 5 · Tailwind CSS v4 · shadcn-svelte · bits-ui · Oxanium Variable

---

## Design Philosophy

Roka is a data-tool SaaS — its UI is a workspace, not a brochure. The design reflects three principles:

1. **Dense but not cramped.** Information density is high by intention: compact buttons, xs-sized labels, tight padding. Every pixel earns its place.
2. **Warm precision.** Most data tools default to cold blues. Roka uses a warm orange primary against a neutral base — technical but approachable. The secondary blue provides a cool counterpoint for data values and highlights.
3. **Dark mode is a first-class citizen.** Both themes are fully specified and tested. Token names are semantic, never literal (never `--orange-500`, always `--primary`).

---

## Color

### Palette Rationale

Colors are specified in **oklch** — a perceptually uniform color space that makes lightness adjustments predictable and avoids the muddy mid-tones of HSL.

| Token                  | Light Value               | Dark Value              | Role                                         |
| ---------------------- | ------------------------- | ----------------------- | -------------------------------------------- |
| `--background`         | white                     | near-black `#1c1c24`    | Page canvas                                  |
| `--foreground`         | near-black `#1c1c24`      | near-white              | Primary text                                 |
| `--primary`            | **orange** `#c45d1f`      | darker orange `#a84d18` | CTA buttons, active states, focus rings      |
| `--primary-foreground` | warm cream                | warm cream              | Text on primary                              |
| `--secondary`          | **blue** `#3d8bc0`        | darker blue `#2d78ae`   | Stat highlights, export buttons, data values |
| `--muted`              | very light gray `#f4f4f8` | dark muted `#3d3d4a`    | Sidebar, tag backgrounds, stripped rows      |
| `--muted-foreground`   | medium gray `#72728a`     | medium-light gray       | Labels, metadata, placeholder text           |
| `--destructive`        | red `#e0361a`             | vivid red `#f05a3a`     | Delete, clear, error states                  |
| `--border`             | light cool gray `#e6e6ec` | white at 10% opacity    | All dividers and outlines                    |

**Why orange for primary?**  
Orange is energetic and warm without feeling corporate. It creates clear visual hierarchy in a dense UI — your eye finds the primary action instantly. The exact hue (chroma 0.195, hue 38°) sits between amber and red-orange, making it readable on both light and dark backgrounds.

**Why blue for secondary?**  
Blue at hue 210° is maximally distinct from the orange primary (separated by ~170° on the hue wheel). It's used for data values (`<strong class="text-secondary">`) and secondary export actions — cool to contrast against the warm primary.

**Chart palette**  
Five steps of a neutral cool-gray ramp (`chart-1` through `chart-5`). These are intentionally desaturated so data values stand out against them in visualizations.

### Dark Mode

Dark mode inverts lightness while preserving hue identity. Primary orange dims slightly (L 0.553 → 0.47) to stay readable against the dark canvas. Borders become semi-transparent white at 10% rather than a solid gray, which lets card backgrounds show through naturally.

---

## Typography

### Typeface: Oxanium Variable

Oxanium is a geometric variable font from the sci-fi/technical design tradition. Key properties:

- **Angular, slightly condensed** — packs more characters per line
- **Single weight axis** — smooth interpolation from 300 to 800 via `font-variation-settings`
- **Excellent legibility at small sizes** — critical for xs text in table cells and labels
- **Distinctive personality** — immediately communicates "technical tool" without being monospace

Both `--font-sans` and `--font-heading` resolve to Oxanium. There is no separate heading font — consistency over variety for a tool UI.

**Noto Sans JP** is available for Japanese locale support (the app uses `wuchale` for i18n).

### Type Scale

| Step        | Size | Usage                                                |
| ----------- | ---- | ---------------------------------------------------- |
| `text-xs`   | 12px | **Default** — table cells, buttons, labels, metadata |
| `text-sm`   | 14px | Body descriptions, input text                        |
| `text-base` | 16px | N/A (rarely used)                                    |
| `text-2xl`  | 24px | Page titles, brand wordmark                          |

This is an unusually small scale. The `xs` default is intentional: the app is a dense data grid, not editorial content. Everything that can be `xs` is `xs`.

### Patterns

```
Section label:   text-xs font-semibold tracking-wider uppercase text-muted-foreground
Metadata/label:  text-sm text-muted-foreground
Button text:     text-xs/relaxed font-medium
Page title:      text-2xl font-bold text-foreground
Data value:      <strong class="text-secondary">
```

---

## Spacing

Base grid: **4px**. Tailwind's default scale applies. Common patterns:

| Context             | Classes     | Computed   |
| ------------------- | ----------- | ---------- |
| Header height       | `h-14`      | 56px       |
| Header padding      | `px-6`      | 24px sides |
| Sidebar width       | `w-64`      | 256px      |
| Row padding (dense) | `px-3 py-1` | 12px / 4px |
| Toolbar padding     | `px-4 py-2` | 16px / 8px |
| Standard gap        | `gap-3`     | 12px       |
| Tight gap           | `gap-1`     | 4px        |
| Drop zone padding   | `p-12`      | 48px       |

The sidebar row pattern (`px-3 py-1`) establishes the minimum comfortable touch target for the app's primary interaction: toggling column visibility.

---

## Border Radius

Base: **0.45rem (~7px)**. Derived scale:

| Token          | Value   | Feel                         |
| -------------- | ------- | ---------------------------- |
| `rounded-sm`   | 0.27rem | Almost sharp — inline badges |
| `rounded-md`   | 0.36rem | Default for most elements    |
| `rounded-lg`   | 0.45rem | Base radius                  |
| `rounded-xl`   | 0.63rem | Drop zone, larger cards      |
| `rounded-full` | 9999px  | Tags, pills                  |

The low base radius (7px vs the shadcn-svelte default of 8-12px) contributes to the precise, tool-like aesthetic. Corners are softened but not bubbly.

---

## Shadows

Elevation is conveyed through **background contrast and borders**, not shadows. The muted sidebar reads as "lower" than the white content area because it's a different background — no shadow needed. This keeps the UI clean and avoids the visual noise of layered drop shadows.

Shadows (`shadow-sm`, `shadow-md`) exist in the system but are used sparingly — only for floating elements (popovers, tooltips, dropdowns).

---

## Component Sizing

### Buttons

Roka's buttons are deliberately **compact** — the default `h-7` (28px) is smaller than most design systems (36–40px). This is correct for a dense data tool where buttons live inside toolbars and sidebars, not as large page-level CTAs.

| Size      | Height | Usage                              |
| --------- | ------ | ---------------------------------- |
| `icon-xs` | 20px   | Inline filter icon in sidebar rows |
| `xs`      | 20px   | "All / None" column toggles        |
| `sm`      | 24px   | Secondary compact actions          |
| `default` | 28px   | Standard toolbar buttons           |
| `lg`      | 32px   | Primary CTA (if needed)            |

### Layout Shell

```
┌─────────────────────────────────────────────────┐
│  Header h-14 (56px)  border-b                   │
├──────────────┬──────────────────────────────────┤
│ Sidebar w-64 │  Toolbar  shrink-0               │
│ overflow-y   │  Stats row shrink-0              │
│ border-r     │  Table flex-1 overflow-hidden    │
│              │                                  │
└──────────────┴──────────────────────────────────┘
```

The layout is a classic app shell: fixed header, scrollable sidebar, flexible content area. The content pane uses `flex flex-col` with the table taking `flex-1 overflow-hidden` — the shell never scrolls, only the table body does.

---

## Animation

- **Duration:** fast (100ms) for hover/focus, normal (150ms) for state transitions
- **Easing:** `ease-in-out` (Tailwind default / `transition-all`)
- **What animates:** button press (`active:translate-y-px`), color transitions on hover, backdrop blur on filter loading state
- **What doesn't animate:** layout changes, sidebar open/close (none — sidebar is always visible), page transitions

The rule: animate interactive affordances, not layout structure.

---

## Iconography

All icons from **Lucide** (`@lucide/svelte`). Size conventions:

| Context                 | Size              | Example                |
| ----------------------- | ----------------- | ---------------------- |
| Inside `size-xs` button | `size-2.5` (10px) | —                      |
| Inside `size-sm` button | `size-3` (12px)   | Filter icon            |
| Inside default button   | `size-3.5` (14px) | Upload, Download       |
| Inside `size-lg` button | `size-4` (16px)   | —                      |
| Empty state / hero      | `size-12` (48px)  | FolderOpen in Dropzone |
| Loading state           | `size-5` (20px)   | TurtleIcon             |

---

## Dark Mode Implementation

Mode is managed by `mode-watcher`. The `.dark` class is applied to the root element. All token values are duplicated in the `.dark` block in `styles.css`.

The `@custom-variant dark (&:is(.dark *))` directive ensures Tailwind `dark:` utilities work with class-based dark mode (not `prefers-color-scheme`).

---

## Files

| File                                         | Purpose                                                      |
| -------------------------------------------- | ------------------------------------------------------------ |
| `src/routes/styles.css`                      | All CSS custom properties, theme definition, Tailwind import |
| `src/lib/components/ui/button/button.svelte` | Button variants via `tailwind-variants`                      |
| `src/lib/components/ui/tabs/`                | Tabs with `size` and `color` variant props                   |
| `docs/design-system/design-tokens.json`      | Machine-readable token reference                             |
| `docs/design-system/design-preview.html`     | Interactive visual preview                                   |
