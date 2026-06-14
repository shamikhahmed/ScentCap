# Changelog

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
