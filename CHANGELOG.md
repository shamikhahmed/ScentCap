## [2.0.0] — 2026-07-22

### Boutique wardrobe OS
- Design system: `--sc-*` tokens, Cormorant Garamond + Manrope, marble/blotter materials, boutique splash
- Catalog: `CatalogProvider` + Fraganty adapter; IndexedDB `catalog` + `images` blob cache (DB v5)
- Smart Advisor prefs (avoid sweet / office-only); Why-this-bottle breakdown; wear weather/zones snapshot
- You tab, offline banner, privacy network copy; Travel TSA disclaimer; Layering “Suggested pairing”
- SW `scentcap-v200`

## [1.4.2] — 2026-07-20
- Today blotter deep: mobile stack; desktop counter / flacon / wear-ledger rails. SW `scentcap-v142`.

## [1.4.1] — 2026-07-20

### Beauty — mist / flacon remint
- Blush `#D4A8B8` + amber `#C9A47B` + marble cream tokens
- Playfair Display (bottle names) + Source Sans 3 body
- Onboarding splash: flacon silhouette + mist orbs (not passport desk)
- SW `scentcap-v141`

## [1.4.0] — 2026-07-20

### Beauty — perfume blotter / flacon
- Blotter-strip boot loader; brass/amber tokens (kill iOS blue)
- Cormorant + DM Sans; bottle cards as blotter stubs
- SW `scentcap-v140`

## [1.3.2] — 2026-07-19

- Capricorn QR asset in SW allowlist (`assets/qr-scentcap.png`)
- SW `scentcap-v132`

# Changelog

## [1.3.1] - 2026-07-19
- Cap Family Mega-Wave: Capricorn OS brand lock — wired `mark.svg`, favicon, apple-touch-icon-180, and separate any/maskable PWA icons in manifest + `index.html`.
- In-app BrandMark and desktop nav use gold bottle mark; removed unused Vite template `icons.svg`.
- Apple polish: greeting and mood tiles drop emoji chrome for Lucide icons; gallery viewer accent aligned to Cap Neutral.
- Version / SW cache bump (`scentcap-v131`); gallery regenerated for release.

## [1.3.0] - 2026-07-11
- Cap Standard pilot: full screen gallery (20 shots, mobile + desktop) via `npm run gallery` + browsable `screen-gallery.html`.
- CI now gates Pages deploys on `npm run verify` (lint + build + 13 Playwright e2e tests).
- Fix TS5076 build break in TitleSync (`??`/`||` precedence).
- Per-route document titles (TitleSync), offline demo wardrobe, offline banner (from 1.2.x sweep).
- MIT LICENSE added; package.json version synced with VERSION.json.

## [1.2.0] - 2026-06-15
- Launch preview: all features unlocked (Analytics, Layering Lab, Travel Kit, unlimited bottles, export) until App Store IAP ships.
- Premium empty states on Home, Wardrobe, and Analytics with demo collection shortcut on Today.
- Settings: honest launch preview messaging; export no longer gated.
- Pro paywall reframed as App Store roadmap (no dead-end purchase buttons on web).

## [1.1.1] - 2026-06-14
- iOS: adopt UIScene lifecycle (`SceneDelegate`, Info.plist manifest) for iOS 26+ / future SDK.
- Fix Analytics charts crashing WKWebView in Capacitor (measured chart sizes vs ResponsiveContainer).

## [1.1.0] - 2026-06-14
- Light mode: fix card contrast, borders, inputs, photo scrims, and hardcoded dark Tailwind utilities.
- Catalog v2: ~1,000 real fragrance names (Dior, Chanel, Creed, Lattafa, etc.) replacing synthetic filler.
- Optional online search via Fraganty API (`VITE_FRAGANTY_API_KEY`) when local results are sparse.

## [1.0.9] - 2026-06-14
- Fix fragrance catalog fetch using `BASE_URL` (broken on deep GitHub Pages routes).
- Add `BottleVisual` SVG bottle placeholders with family color + brand initials on wardrobe, detail, and Today pick.
- Generate missing PWA icons (`icon-192.png`, `icon-512.png`).

## [1.0.8] - 2026-06-14
- Pre-launch: Playwright App Store screenshot automation (`docs/screenshots/`), Terms/Support legal pages, IAP service (`src/lib/iap.ts`) wired to PaywallModal.
- iOS: Info.plist camera/photo/location strings, app icon script outputs 1024px iOS asset, Xcode version 1.0.8 (8).
- E2E: delete bottle test, IAP web fallback test, shared `e2e/helpers.ts`.
- Docs: `PRE-LAUNCH.md`, `SCREENSHOTS.md`, expanded `IOS-BUILD.md` day-1 IAP steps, `APP-STORE.md` legal URLs.

## [1.0.7] - 2026-06-14
- Phase 4: Fuzzy catalog search (brand/name), Recent additions on empty query, wishlist tabs (Owned/Want/Tested) in IndexedDB.
- Phase 5: Capacitor iOS scaffold (`cap:sync`, `cap:ios`), dual base path for GH Pages vs native, Pro paywall (12-bottle free limit, gated Analytics/Layering/Travel/Export), IAP stub with price placeholders.

## [1.0.6] - 2026-06-14
- Phase 3: Office Safe in onboarding + Advisor callout; square/story share cards (Cap Neutral); Save to Layering Lab from Advisor/Home; Settings privacy badge; App Store copy draft; e2e calendar + share tests.

## [1.0.5] - 2026-06-14
- Phase 2 design: Cap Neutral sober Apple-like UI — restrained blue accent, solid surfaces, reduced glass/mist/gradients.
- Onboarding fast path: 2-question setup, prominent demo collection, skip-with-defaults.
- Home: rotation health banner, neglected bottles polish, Office Safe indicator.

## [1.0.4] - 2026-06-14
- Phase 1 parity: bottle delete/edit on FragranceDetail, calendar month navigation, wear history CSV export, travel kit manual pick, wear log notes and edit.

## [1.0.3] - 2026-06-12
- Phase P4: Playwright e2e for travel kit trip name persistence across reload.

## [1.0.0] - 2026-06-12

### P1 polish

- Added `VERSION.json` and synced package version to 1.0.0
- CI deploy workflow runs `npm run lint` before build
- Weather fallback UX: clear messages when location is denied or fetch fails (Home & Advisor)
- Wear rating modal resets state when reopened
