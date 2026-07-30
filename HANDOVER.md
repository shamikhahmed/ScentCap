# ScentCap — Handover

> Read this + `ROADMAP.md` + `~/Capricorn-Brain/01 Projects/ScentCap.md` before working here.
> Last updated: 2026-07-27 · Fleet-wide standard: `capricorn-tooling/shared/CAP-STANDARD.md`

## What this is
Fragrance wardrobe OS — Atelier chalk/forest UI, weather-aware picks, layering lab, analytics. CAP STANDARD REFERENCE APP.

## Facts
**Version:** 2.0.9
**Live:** https://shamikhahmed.github.io/ScentCap/
**Repo:** https://github.com/shamikhahmed/ScentCap
**Stack:** React 19 + TypeScript + Vite 8 + Tailwind v4. IndexedDB (idb). vite-plugin-pwa. Capacitor iOS shell. Playwright.
**Data:** IndexedDB via idb (v5: fragrances, catalog, images blob cache). Optional Open-Meteo + Fraganty. No accounts. SW `scentcap-v209`.

## Run & verify
```bash
npm install
npm run verify       # lint + build + 13 e2e — CI gate
npm run gallery      # regen 20-shot gallery
npm run gallery:view # http://127.0.0.1:8771/screen-gallery.html
```

## Architecture
- `src/` — pages per route (PAGE_TITLES in App.tsx enumerates all)
- `e2e/` — app.spec, viewport.spec, screenshots.spec (App Store shots), gallery.spec (full gallery, CAPTURE_GALLERY-gated), helpers (mocks, demo load)
- `screen-gallery.html` + `docs/screenshots/gallery/` + manifest
- `.github/workflows/deploy.yml` — test job (verify) gates build -> deploy
- `ios/` — Capacitor
- Brand assets: `public/mark.svg`, `favicon.svg`, `icon-192/512/1024.png`, `icon-maskable-*`, `apple-touch-icon-180.png`

## Cap Standard status (2026-07-19)
| Cap Standard item | Status |
|---|---|
| Docs pack | ✅ |
| Screen gallery | ✅ |
| Version discipline | ✅ |
| QA / e2e | ✅ |
| CI gate | ✅ |
| PWA polish | ✅ |
| Demo mode | ✅ |

Gaps are tracked as tasks in `ROADMAP.md`.

## Gotchas — read before coding
- Completely free: no Stripe, IAP, Pro gates, or bottle limits. All routes open.
- Playwright mocks geolocation + Open-Meteo + fraganty.ai in helpers.ts — new network calls need mocks or CI flakes.

## Where decisions live
- Dated decisions: Capricorn-Brain project note (path above)
- Release history: `CHANGELOG.md`
- Fleet-level events: `Cap-Apps/docs/CHANGELOG.md` (master)
