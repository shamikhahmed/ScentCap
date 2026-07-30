# Documented screen gallery — ScentCap 2.0.9

Indexed by tab. Captures live under `docs/screenshots/gallery/` (`npm run gallery`).  
Each entry: **what** · **how selected** · **state store** · **why organised**.

## Today (`/`)

| State | File hint | What | Selection | State kept | Why |
|-------|-----------|------|-----------|------------|-----|
| Empty | `home-empty*` | First-run museum empty | CTA → `/add` | No collection in IDB | One primary idea: start wardrobe |
| Demo / many | `home-demo*` | Bottle hero + Wear | Mood chips; Wear button | `prefs`, `wear_history`, advisor run in memory | Bottle first; mood/stats below fold |
| Loading | boot spinner | Quiet status | n/a | Suspense | No boutique theater |
| Dark | theme toggle in Settings | Same layout, dark tokens | Appearance → Dark | `preferences.theme` IDB | Tokens, not hardcoded |

## Collection (`/collection`)

| State | What | Selection | State | Why |
|-------|------|-----------|-------|-----|
| Empty owned | Cabinet empty | Add FAB | `collection` | Clear empty, one CTA |
| Many / shelves | Wardrobe rows | Search, family chips, tab Owned/Want/Tested | URL `?tab=` + local q/family | Inventory home |
| Search open | Filtered shelf | `collection-search` | Ephemeral `q` | Find without leaving tab |

## Add (`/add`)

| State | What | Selection | State | Why |
|-------|------|-----------|-------|-----|
| Search tab | Catalog results | Search / Manual tabs (`aria-selected`) | Ephemeral query | Catalog first path |
| Manual | Name/brand labels | Concentration select | Local form until save | Labels above fields |
| Keyboard open | Fields scroll into view | Focus | Ephemeral | No hidden submit |

## Advisor (`/advisor`)

| State | What | Selection | State | Why |
|-------|------|-----------|-------|-----|
| Empty wardrobe | Prompt to add | Link `/add` | — | Can't advise without bottles |
| Result | Primary pick + why | Occasion / Get recommendation | Rules engines in memory; prefs for filters | Explainable, not AI |

## Calendar (`/calendar`)

| State | What | Selection | State | Why |
|-------|------|-----------|-------|-----|
| Empty / many | Month grid | Prev/next month | `wear_history` | Time dimension separate from Collection |

## You / Settings (`/settings`)

| State | What | Selection | State | Why |
|-------|------|-----------|-------|-----|
| Groups | Account→About order | Section headings | See IA-RATIONALE.md | Mature settings convention |
| Theme | Light/Dark | `aria-pressed` | `preferences.theme` | Appearance alone |
| Import error | Alert on bad JSON | File `import-backup` | No write on fail | Security |

## Tools (from Settings)

| Route | What | Why under You |
|-------|------|---------------|
| `/analytics` | Charts | Power feature, ≤2 taps |
| `/layering` | Combos | Not daily-tab frequency |
| `/travel` | Trip kit | Persists trip fields in prefs/local |

## Cross-cutting states

- **Reduced motion:** Framer respects `prefers-reduced-motion` where SPRING used; CSS spin still present on loader (decorative).
- **Offline:** SW + IDB; weather/catalog network optional — proven in e2e offline reload.
- **Demo banner:** Thin strip; exit → onboarding.

Regenerate: `npm run gallery` → update `docs/screenshots/gallery/gallery-manifest.json` version to 2.0.9.
