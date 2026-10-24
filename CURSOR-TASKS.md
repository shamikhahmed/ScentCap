# ScentCap 3.0 — Cursor work orders

Owner split for the 3.0 production release. Claude Code and Cursor work **in the same checkout on `main`
at the same time**, so the file locks below are hard rules.

## Ground rules (read first)

- **Never** `git add -A`, `git add .`, `git stash`, `git reset`, `git checkout -- <file>`, or rebase. Stage only the paths you
  changed: `git add <path> <path>`. Commit small, prefix `cursor:` (e.g. `cursor: ios privacy manifest`).
- **Do not edit Claude-locked files** (list below). If you need a change there, write it in
  `CURSOR-NOTES.md` under "Requests for Claude" and move on.
- Brand-copyright note: bottle photos in `public/bottles/` come from Parfumo product shots. Keep the
  attribution line ("Bottle images © their respective brands, via Parfumo") anywhere images are credited.
- Read `HANDOVER.md`, `~/Capricorn-Brain/01 Projects/ScentCap.md`, and the HIG digest at
  `../capricorn-tooling/docs/perfection-2026-10/hig-digest-2026-10.md` before starting.
- Keep `npm run lint` and `npm run build` green after each commit.

### Claude-locked (do not touch until Phase 2 says so)

```
src/design/**            src/index.css           src/ios-tokens.css
src/scent-premium-overrides.css                  src/components/**
src/pages/Home.tsx       src/pages/Collection.tsx src/pages/AddFragrance.tsx
src/pages/FragranceDetail.tsx                    src/pages/Onboarding.tsx
src/catalog/**           src/services/**         src/lib/**
src/App.tsx              index.html              vite.config.ts
scripts/fetch-bottle-images.mjs                  public/bottles/**  public/data/catalog.json
```

---

## Phase 1 — production hardening (start now, parallel with Claude)

1. **iOS App Store readiness** (`ios/`, `capacitor.config.ts`, `docs/APP-STORE.md`, `docs/IOS-BUILD.md`)
   - Add `ios/App/App/PrivacyInfo.xcprivacy` (no tracking; declare UserDefaults / file timestamp
     required-reason APIs if Capacitor uses them; no collected data types — app is local-first).
   - Info.plist: `NSLocationWhenInUseUsageDescription` (weather picks), `NSCameraUsageDescription` +
     `NSPhotoLibraryUsageDescription` (bottle photos) with plain-language strings; `ITSAppUsesNonExemptEncryption = false`.
   - App icon set 1024 single-size from `public/icon-1024.png`; launch screen mark-only (HIG: no branding text).
   - Version/build: marketing version `3.0.0`, build number bump.
   - Update `docs/APP-STORE.md` with final metadata: name, subtitle (≤30), promo text, description,
     keywords (≤100 chars), support/privacy URLs, age rating answers, App Privacy "Data Not Collected".
2. **Web hardening** (`public/*.html` legal pages, `public/404.html`, `public/offline.html`, `.github/workflows/**`)
   - Legal pages: update privacy/terms/support to 3.0 (bundled offline catalog; optional Open-Meteo +
     Fraganty network calls; image attribution line above).
   - CI: keep `verify` gate; add a Lighthouse CI step (mobile, budgets: perf ≥ 90, a11y ≥ 95, BP ≥ 95, SEO ≥ 95)
     against `vite preview`; upload report artifact. Don't fail the deploy on perf flake below 85 — warn.
   - Make `npm run tier1` runnable (fix `../capricorn-tooling/shared/testing/tier1.mjs` path issues if any)
     and record result in `qa/TIER1.json`.
3. **Docs** — `PRIVACY.md`, `ROADMAP.md`, `FEATURES.md`: reflect 3.0 (offline catalog of real bottles, redesign).
   Do **not** edit `README.md`/`CHANGELOG.md` yet (Phase 3).

When Phase 1 is done, append a summary to `CURSOR-NOTES.md`.

---

## Phase 2 — secondary screens on the new design system

**Start only after** `DESIGN.md` exists at repo root **and** a commit titled
`design: ScentCap 3 design system` is on `main` (check `git log --oneline | grep "design: ScentCap 3"`).

After that, these files unlock for you (Claude stays off them):

```
src/pages/Advisor.tsx    src/pages/CalendarPage.tsx  src/pages/Analytics.tsx
src/pages/Settings.tsx   src/pages/LayeringLab.tsx   src/pages/TravelKit.tsx
e2e/**                   playwright.config.ts
```

1. Rebuild each page with the primitives and tokens documented in `DESIGN.md` only
   (no new ad-hoc colours, no inline hex, no legacy `--sc-*`/`tile-premium`/`museum-*` classes).
   Large title header, inset-grouped lists for settings/forms, 44pt targets, 17pt body, light + dark.
2. Settings: grouped list (Profile · Preferences · Data (export/import/wipe w/ double confirm) · About (version,
   attribution, privacy, support)).
3. Update e2e specs/selectors for the new UI; `npm run verify` green. Run the HIG matrix
   (`node ../capricorn-tooling/scripts/hig-check.mjs`) on the 4 viewports × light/dark; update `qa/v7/HIG-AUDIT.md`.

---

## Phase 3 — website, stories, screenshots, videos (last)

**Start only after** Claude's commit `release: ScentCap 3.0.0` lands, or Claude writes "Phase 3 GO" in `CURSOR-NOTES.md`.

1. **Screenshots**: regenerate `npm run gallery` (all screens, mobile + desktop, light + dark) and the App Store
   sets (6.9" 1320×2868, 6.5" 1284×2778, iPad 13" 2064×2752) from the demo wardrobe — real bottle photos must show.
   Update `docs/screenshots/**`, `docs/store/**`, `screen-gallery.*`, `GALLERY.md`.
2. **Videos**: record a 20–30s product walkthrough (Playwright `video: 'on'`, 1080×1920 + 1920×1080): open → Today pick →
   wear → add a perfume via search → collection → detail. Convert to MP4/H.264 (ffmpeg, ≤ 6 MB) into `docs/video/`.
   App Store preview (886×1920, 15–30s) into `docs/store/preview/`.
3. **Stories**: refresh `qa/v7/STORIES.md` + `qa/v7/personas/*` to the new flows (fictional people, labelled as such).
4. **App website**: update `public/landing.html`, `public/pitch.html`, `public/presentation.html` to the 3.0 design language
   (same tokens as `DESIGN.md`), new screenshots, video embed (poster + `preload="none"`), real bottle imagery,
   feature list, App Store badge placeholder, attribution line. Lighthouse ≥ 95 on landing.
5. **Portfolio site**: update the ScentCap entry in `/Users/shamikhahmed/Projects/Cap/Cap-Apps/shamikhahmed.github.io`
   (card image, description, screenshots, version 3.0.0, links). Separate repo — commit there separately.
6. **Docs**: `README.md`, `CHANGELOG.md` (3.0.0 entry), `HANDOVER.md`, `VERSION.json` if not already 3.0.0;
   append a dated decision to `~/Capricorn-Brain/01 Projects/ScentCap.md`.
7. Push `main` only after `npm run verify` is green; confirm the Pages deploy and check the live URL.
