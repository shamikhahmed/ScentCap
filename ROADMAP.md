# ScentCap — Roadmap

> Updated 2026-10-24. Fleet order & standard: `capricorn-tooling/shared/CAP-STANDARD.md`.

## Now — v3.0.0 (production release)

In flight (see `CURSOR-TASKS.md`):

- Design system remint + bundled offline catalog of real bottles (Claude)
- Production hardening: iOS App Store pack, legal pages, Lighthouse CI, Tier 1 (Cursor Phase 1)
- Secondary screens on the new design system (Cursor Phase 2, after `DESIGN.md`)
- Website, stories, screenshots, videos (Cursor Phase 3, after release GO)

## Cap Standard gaps
| Cap Standard item | Status |
|---|---|
| Docs pack | ✅ (3.0 refresh in progress) |
| Screen gallery | ✅ (regen in Phase 3) |
| Version discipline | 🔄 targeting 3.0.0 |
| QA / e2e | ✅ |
| CI gate | ✅ (+ Lighthouse job) |
| PWA polish | ✅ |
| Demo mode | ✅ |

## Next (ordered)
1. Land ScentCap 3 design system + secondary screens
2. App Store / TestFlight readiness (native shell already scaffolded)
3. Keep gallery regenerated each release

## Later
- Additional catalog providers (adapter ready; Fraganty optional live)
- Optional Capricorn Worker/BFF (key proxy only — no wardrobe host)
- Batch tracking, barcode, user-key LLM Labs (disabled by default)
- Cloud backup research only after privacy review

## Ground rules
- No dirty trees: commit or discard before ending a session.
- CI green before tag; tag `vX.Y.Z` per release.
- Bump SW cache with any asset change (PWA apps).
- Never commit `.env` / secrets.
- Smart Advisor = rules engine — never fake AI marketing.
- Bottle images © their respective brands, via Parfumo.
