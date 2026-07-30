# ScentCap — Fragrance OS

**Version:** 2.0.8

Offline-first PWA for fragrance wardrobe management. Build a collection, get daily weather-aware picks, layer with confidence, and track every wear — all on your device.

**Live demo:** [https://shamikhahmed.github.io/ScentCap/](https://shamikhahmed.github.io/ScentCap/)

**Marketing:** [Landing](https://shamikhahmed.github.io/ScentCap/landing.html) · [Pitch](https://shamikhahmed.github.io/ScentCap/pitch.html) · [Presentation](https://shamikhahmed.github.io/ScentCap/presentation.html) · [Privacy](https://shamikhahmed.github.io/ScentCap/privacy.html) · [Terms](https://shamikhahmed.github.io/ScentCap/terms.html) · [Support](https://shamikhahmed.github.io/ScentCap/support.html)

**Pre-launch:** See [docs/PRE-LAUNCH.md](docs/PRE-LAUNCH.md) for App Store day-1 checklist.

## Features

- **Today dashboard** — weather context, daily advisor pick, wear logging, occasion presets
- **Wardrobe** — bottle catalog with concentration, level tracking, favorites, signature scent
- **Smart Advisor** — rules-based recommendations (office, date, weekend, gala) — no external API
- **Layering Lab** — experiment with base + top fragrance combos
- **Calendar & Analytics** — wear heatmap, rotation health, family breakdown charts
- **Travel Kit** — pack decants and travel-friendly bottles for trips
- **Demo mode** — 12 sample bottles and 30 days of wear history to explore instantly
- **IndexedDB** persistence via `idb`
- **PWA** with offline support; optional Open-Meteo weather when location is granted

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173/ScentCap/
npm run build
npm run preview    # production preview
npm run generate-icons
npm run test:e2e   # Playwright tests
npm run verify     # lint + build + full e2e (CI gate)
```

## Screen gallery

Every screen, mobile + desktop, auto-captured with Playwright:

```bash
npm run gallery        # regenerate docs/screenshots/gallery/
npm run gallery:view   # then open http://127.0.0.1:8771/screen-gallery.html
```

Regenerate on each release so [screen-gallery.html](./screen-gallery.html) stays current.

## Deploy

GitHub Pages workflow deploys from `main` to `https://shamikhahmed.github.io/ScentCap/`.

Set `base: '/ScentCap/'` in `vite.config.ts` (already configured). Marketing pages live in `public/` and ship with the build.

## Tech stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS v4
- React Router · Framer Motion · Lucide React · Recharts
- IndexedDB (`idb`) · vite-plugin-pwa · Playwright

## Privacy

Your wardrobe stays on your device. See [PRIVACY.md](./PRIVACY.md) and [privacy.html](./public/privacy.html).

Built by [Shamikh Ahmed](https://shamikhahmed.github.io/) — part of the Cap portfolio alongside Capricorn Systems.