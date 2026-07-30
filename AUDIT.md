# ScentCap AUDIT — Phase 1

**Date:** 2026-07-30 · **Version:** 2.0.7 · **Live:** https://shamikhahmed.github.io/ScentCap/

## Map

| Layer | Fact |
|-------|------|
| Stack | React 19 + Vite 8 + Tailwind 4 + TS · PWA (vite-plugin-pwa) · Capacitor iOS only |
| Entry | `index.html` → `main.tsx` → `App.tsx` (Router + AppProvider + Guard) |
| State | Single `AppContext` · IndexedDB `scentcap-v1` v5 (12 stores) |
| Catalog | Fraganty API + local seed/demo · Open-Meteo weather |
| Engines | Rules advisor / layering / scoring / spray (not LLM) |
| Design | `--sc-*` tokens · Figtree + Newsreader · 5 CSS layers (~2.7k lines) |
| Deploy | GitHub Pages · CI `verify` then build · SW `scentcap-v208` |
| Tests | Playwright e2e · gallery · screenshots · no unit tests |

### Routes

`/` Home · `/collection` · `/add` · `/advisor` · `/calendar` · `/settings` · `/analytics` · `/layering` · `/travel` · `/fragrance/:id` · `/onboarding` · `*`→`/`

Dead shortcut: manifest `/daily` (no route).

### Why core parts exist

- **Local-first IDB:** privacy promise — no accounts/cloud.
- **Advisor engines:** wearable pick without LLM cost/latency.
- **Capacitor iOS:** shell for App Store path; web remains primary.
- **Demo wardrobe:** first-run conversion without catalog network.

## Top risks (priority)

1. **High** — `importAllData` no schema validation → IDB poison
2. **High** — CSP `unsafe-inline` · third-party Fraganty trust
3. **High** — SW stuck-boot / stale cache (mitigated, still fragile)
4. **Med** — Three.js ambient on empty/onboarding (perf)
5. **Med** — CSS override stack (maintainability)
6. **Med** — Theme meta/manifest color drift
7. **Med** — Settings IA amateur (links scattered, no groups)
8. **Med** — Home still busy (mood/stats compete with bottle)
9. **Med** — A11y uneven (charts, modals, focus)
10. **Low** — Dead components/CSS/assets · `/daily` · empty `marble/`

## Dead / duplicate candidates

| Item | Action |
|------|--------|
| `src/App.css` | Delete |
| `src/components/marble/` | Delete empty |
| `MistBackground.tsx` | Delete |
| `BlotterCard.tsx` | Delete |
| `CapKineticHeadline.tsx` | Delete |
| `OfflineBanner.tsx` | Delete (StatusBar wins) |
| `.paywall-*` CSS | Delete |
| `src/assets/react.svg`, `vite.svg` | Delete if unused |
| Manifest `/daily` | Fix or remove |

## Prioritized plan (Phases 2–13)

1. Purge dead code + fix `/daily` + import validation
2. Settings/Home IA restructure + IA-RATIONALE.md
3. Token consolidation; kill hardcoded leftovers; screen polish
4. Forms (Add/Profile/Travel) labels + validation
5. Responsive/dark/safe-area pass
6. A11y: focus, labels, axe in CI
7. Perf: drop Three on boot path if unused; measure LCP
8. Security: CSP tighten where safe; backup schema
9. Offline prove + SW version
10. Persona QA via Playwright + live screenshots
11. Documented gallery + README/CHANGELOG
12. Ship **v2.0.7**

## Decision notes

- Keep Capricorn local-first / free / rules-advisor — do not reintroduce Pro.
- Prefer reversible deletes; never strip advisor/scoring business logic.
