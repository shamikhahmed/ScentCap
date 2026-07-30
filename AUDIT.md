# ScentCap AUDIT — living map

**Date:** 2026-07-30 · **Version:** 2.0.9 · **Live:** https://shamikhahmed.github.io/ScentCap/

## Map

| Layer | Fact |
|-------|------|
| Stack | React 19 + Vite 8 + Tailwind 4 + TS · PWA (vite-plugin-pwa) · Capacitor iOS only |
| Entry | `index.html` → `main.tsx` → `App.tsx` (Router + AppProvider + Guard) |
| State | Single `AppContext` · IndexedDB `scentcap-v1` v5 (12 stores) |
| Catalog | Fraganty API + local seed/demo · Open-Meteo weather |
| Engines | Rules advisor / layering / scoring / spray (not LLM) |
| Design | `--sc-*` tokens · Figtree + Newsreader · CSS craft layers |
| Deploy | GitHub Pages · CI `verify` then build · SW `scentcap-v209` |
| Tests | Playwright e2e · gallery · screenshots · axe smoke |

### Routes

`/` Home · `/collection` · `/add` · `/advisor` · `/calendar` · `/settings` · `/analytics` · `/layering` · `/travel` · `/fragrance/:id` · `/onboarding` · `*`→`/`

`/daily` rewrite → `/` (vite + Pages).

### Why core parts exist

- **Local-first IDB:** privacy promise — no accounts/cloud.
- **Advisor engines:** wearable pick without LLM cost/latency.
- **Capacitor iOS:** shell for App Store path; web remains primary.
- **Demo wardrobe:** first-run conversion; Fraganty hydrates real bottle photos after seed.

## Residual risks (post 2.0.9)

1. **Med** — CSP `unsafe-inline` · third-party Fraganty trust
2. **Med** — SW stuck-boot / stale cache (mitigated via boot Reset UI)
3. **Med** — CSS override stack (maintainability)
4. **Low** — `react-router` GHSA-qwww (RSC CSRF). SPA `BrowserRouter` only — no RSC/SSR path. Stay on latest 7.x; do not force-downgrade to 7.11 (older advisories).
5. **Low** — Chart a11y / dense Home below-fold chrome

## Closed in 2.0.7–2.0.9

- Dead Three.js CapScene / boutique chrome · Settings IA groups · form labels
- Backup import schema validation (fragrance + collection fields)
- Placeholder catalog art (SVG / perfume-nobg) → Fraganty hydrate
- Advisor/Home pick race guards · FragranceDetail cancel + object URL revoke
- Hex-only colors where UI appends alpha suffixes
- Axe smoke + offline SPA e2e

## Decision notes

- Keep Capricorn local-first / free / rules-advisor — do not reintroduce Pro.
- Prefer reversible deletes; never strip advisor/scoring business logic.
