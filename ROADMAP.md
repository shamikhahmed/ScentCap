# ScentCap — Roadmap

> Updated 2026-07-22. Fleet order & standard: `capricorn-tooling/shared/CAP-STANDARD.md`.

## Now — v2.0.0 (Boutique Wardrobe)
Shipped: `--sc-*` design system, catalog/image blob cache (IDB v5), Smart Advisor prefs + Why sheet, gallery regen. See `CHANGELOG.md`.

## Cap Standard gaps
| Cap Standard item | Status |
|---|---|
| Docs pack | ✅ |
| Screen gallery | ✅ |
| Version discipline | ✅ |
| QA / e2e | ✅ |
| CI gate | ✅ |
| PWA polish | ✅ |
| Demo mode | ✅ |

## Next (ordered)
1. App Store IAP + submission (docs/APP-STORE.md, PRE-LAUNCH.md ready; launch-preview unlock currently active)
2. Collection museum shelf / Detail dossier deep remint (desktop IA)
3. Keep gallery regenerated each release

## Later
- Additional catalog providers (adapter ready; Fraganty default)
- Optional Capricorn Worker/BFF (key proxy only — no wardrobe host)
- Batch tracking, barcode, user-key LLM Labs (disabled by default)
- Cloud backup research only after privacy review

## Ground rules
- No dirty trees: commit or discard before ending a session.
- CI green before tag; tag `vX.Y.Z` per release.
- Bump SW cache with any asset change (PWA apps).
- Never commit `.env` / secrets.
- Smart Advisor = rules engine — never fake AI marketing.
