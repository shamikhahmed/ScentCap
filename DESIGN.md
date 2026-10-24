# ScentCap 3 — Design system

Sober, product-first, Apple HIG-aligned. The bottle is the hero; chrome stays quiet.
Source of truth: `src/design/system.css` (tokens + primitives) and `src/components/kit/index.tsx` (React kit).

## Principles

1. **Content first.** White product plinths carry real bottle photos; UI is grey/white (light) or black/graphite (dark).
2. **One accent.** Bronze tint (`--tint`) marks the single primary action per screen, selection and links. Never decorative.
3. **System type.** SF (`--font-ui`) for all UI at 17pt body; New York serif (`.serif`, `--font-serif`) only for fragrance names.
4. **Native patterns.** Large titles on top-level screens, inset-grouped lists for settings/forms, segmented controls for 2–5 options,
   sheets with grabber + Cancel/Done, floating glass tab bar (phone) / sidebar (≥700px).
5. **Accessible by default.** 44pt targets, AA contrast in light/dark/increased-contrast, reduced motion + transparency honoured,
   colour never the only signal, every icon button has `aria-label`.

## Tokens (`:root`, dark under `body:not(.light)`)

| Token | Use |
|---|---|
| `--bg` | Page background (grouped) |
| `--surface`, `--surface-2`, `--surface-elevated` | Cards, lists, sheets |
| `--fill`, `--fill-2` | Gray controls, chips, search, skeletons |
| `--separator` | Hairlines (0.5px) |
| `--plinth` | Bottle stage background (white; light grey in dark) |
| `--label`, `--label-2`, `--label-3`, `--label-4` | Text hierarchy (primary → disabled) |
| `--tint`, `--tint-soft`, `--on-tint`, `--tint-hover` | Accent |
| `--success`, `--warning`, `--danger` | Status only |
| `--t-large` … `--t-caption2` | iOS text styles (34 → 11pt, rem-based so Dynamic Type scales) |
| `--r-sm/md/lg/xl` | 10 / 14 / 20 / 28 radii |
| `--shadow-1/2/3` | Resting card / raised card / sheet |
| `--ease`, `--dur`, `--hit`, `--gutter`, `--tabbar-h` | Motion + layout |

**Do not** use hex values, legacy `--sc-*` / `--color-*` variables, or legacy classes (`atelier-*`, `museum-*`, `tile-premium`,
`glass-premium`, `btn-glow`) in new code. Legacy CSS lives in the `legacy` cascade layer and will be deleted once every screen is migrated.

## Primitives (CSS classes, `@layer components`)

| Class | What |
|---|---|
| `ui-page` | Screen container (safe-area + tab-bar padding, max 1100px) |
| `ui-header`, `ui-eyebrow`, `ui-largetitle`, `ui-title2` | Header pieces (prefer `<PageHeader>`) |
| `ui-section`, `ui-section-head`, `ui-section-title`, `ui-section-link` | Sections (prefer `<Section>`) |
| `ui-card`, `ui-card--lg` | Surfaces |
| `ui-list`, `ui-row`, `ui-row--media`, `ui-row__main/__title/__sub/__value`, `ui-chevron`, `ui-list-header/-footer` | Inset grouped list |
| `ui-btn` + `--primary / --secondary / --gray / --plain / --danger`, `--sm`, `--block` | Buttons (50pt; `--sm` 44pt pill) |
| `ui-icon-btn`, `ui-icon-btn--tint` | 44pt round icon buttons |
| `ui-chip` (`aria-pressed`) | Filter / choice chips |
| `ui-tag`, `ui-tag--tint` | Static metadata pills |
| `ui-segmented` (child `button[aria-pressed]`) | Segmented control |
| `ui-search` (wraps `<input>`) | Search field |
| `ui-field`, `ui-field--left` | Inline inputs/selects inside `ui-row` |
| `ui-switch` (`<input type=checkbox>`) | iOS switch |
| `ui-widgets`, `ui-widget`, `ui-widget__label/__value/__unit` | Dashboard tiles |
| `ui-meter` (child `<span style="width:%">`) | Progress bar |
| `ui-grid` | Product grid (2 → 3 → 4 columns) |
| `ui-plinth` | Square bottle stage (use via `FragranceThumb variant="plinth"`) |
| `ui-scroller` | Horizontal snap carousel, bleeds to screen edge on phone |
| `ui-skeleton`, `ui-rise` | Loading shimmer, entrance motion (transform-only) |
| `ui-sheet*` | Sheet internals (prefer `<Sheet>`) |

## Kit (`@/components/kit`)

- `<PageHeader eyebrow title subtitle trailing />`
- `<Section title action={{label,to}}>…</Section>`
- `<BottleCard fragrance to|onClick meta badge photoUrl selected />` — plinth + brand + serif name
- `<Sheet open title onClose done={{label,onClick,disabled}}>…</Sheet>` — portal, focus, Esc, backdrop
- `<Ring value size stroke label />` — match / progress ring
- `<FragranceThumb fragrance variant="plinth" size="sm|md|lg|hero" />` — resolves bundled photo → user photo → remote → monogram flacon

## Bottle imagery

- Bundled: `public/bottles/<id>.webp` (512px) + `-sm.webp` (256px), white background, trimmed + padded. Built by `npm run catalog`.
- Always render on `--plinth`. In dark mode the image is dimmed (`--photo-filter`) per HIG.
- Credit line wherever images are listed: “Bottle images © their respective brands, via Parfumo.”

## Layout

- Phone (<700px): floating glass tab bar (Today · Collection · Advisor · Diary · Settings). Tabs are navigation only; "Add" lives in headers.
- ≥700px: glass sidebar (tabs + Tools + Add button). Two-column hero/detail layouts switch on at `lg` (1024px).
- Gutter 20px phone, 40px tablet+. Section spacing 32px.

## Copy

Plain, warm, short. Sentence case. No exclamation marks. Explain value, not mechanics
(“A pick for every day” — not “Advisor engine output”). Fictional data is always labelled (“sample wardrobe”).
