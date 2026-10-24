# ScentCap — Handover

> Read this + `DESIGN.md` + `ROADMAP.md` + `~/Capricorn-Brain/01 Projects/ScentCap.md` before working here.
> Last updated: 2026-10-14 · Fleet-wide standard: `capricorn-tooling/shared/CAP-STANDARD.md`

## What this is
Fragrance wardrobe — Atelier chalk/forest UI, weather-aware picks, layering lab, analytics. Cap Standard pilot.

## Facts
**Version:** 3.0.0 · tag `v3.0.0` · SW `scentcap-v300`
**Live:** https://shamikhahmed.github.io/ScentCap/
**Repo:** https://github.com/shamikhahmed/ScentCap
**Stack:** React 19 + TypeScript + Vite 8 + Tailwind v4. IndexedDB (idb). vite-plugin-pwa. Capacitor iOS shell. Playwright.
**Data:** IndexedDB via idb (v5: fragrances, catalog, images blob cache). Optional Open-Meteo + Fraganty. No accounts.
**Perfection v3:** `qa/perfection/` — SCN-V3-1/2/3 FIXED (Phase I); SCN-V3-4 gallery OPEN.

## Run & verify
```bash
npm install
npm run verify       # lint + unit + e2e — CI gate
npm run gallery      # regen gallery shots
npm run gallery:view # http://127.0.0.1:8771/screen-gallery.html
# device-qa (PW_CORE + PLAYWRIGHT_BROWSERS_PATH): see qa/perfection/STATE.md
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

## 3.0 notes
- UI: use `src/design/system.css` primitives + `src/components/kit` only (see DESIGN.md). Legacy CSS lives in the `legacy` layer; delete once unused.
- Catalog: `npm run catalog` rebuilds `public/data/catalog.json` + `public/bottles/` (cache in `scripts/.cache/`, gitignored). `node scripts/test-catalog.mjs` guards integrity.
- Media: `CAPTURE_GALLERY=1 npm run gallery`, `CAPTURE_STORE=1 npx playwright test e2e/store.spec.ts`, `CAPTURE_VIDEO=1 npx playwright test e2e/video.spec.ts && scripts/encode-videos.sh`.

## Gotchas — read before coding
- Completely free: no Stripe, IAP, Pro gates, or bottle limits. All routes open.
- Playwright mocks geolocation + Open-Meteo + fraganty.ai in helpers.ts — new network calls need mocks or CI flakes.

## Where decisions live
- Dated decisions: Capricorn-Brain project note (path above)
- Release history: `CHANGELOG.md`
- Fleet-level events: `Cap-Apps/docs/CHANGELOG.md` (master)
