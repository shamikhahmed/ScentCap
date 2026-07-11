# ScentCap — Handover

> Read this + `ROADMAP.md` + `~/Capricorn-Brain/01 Projects/ScentCap.md` before working here.
> Last updated: 2026-07-11 · Fleet-wide standard: `capricorn-tooling/shared/CAP-STANDARD.md`

## What this is
Fragrance OS — wardrobe, weather-aware daily picks, layering lab, analytics. CAP STANDARD REFERENCE APP.

## Facts
**Version:** 1.3.0
**Live:** https://shamikhahmed.github.io/ScentCap/
**Repo:** https://github.com/shamikhahmed/ScentCap
**Stack:** React 19 + TypeScript + Vite 8 + Tailwind v4. IndexedDB (idb). vite-plugin-pwa. Capacitor iOS shell. Playwright.
**Data:** IndexedDB via idb. Optional Open-Meteo weather (mocked in tests). No accounts.

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

## Cap Standard status (2026-07-11)
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
- Launch preview mode unlocks Pro on web deliberately — don't 'fix' the paywall until IAP ships.
- Playwright mocks geolocation + Open-Meteo + fraganty.ai in helpers.ts — new network calls need mocks or CI flakes.

## Where decisions live
- Dated decisions: Capricorn-Brain project note (path above)
- Release history: `CHANGELOG.md`
- Fleet-level events: `Cap-Apps/docs/CHANGELOG.md` (master)
