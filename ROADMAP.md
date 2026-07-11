# ScentCap — Roadmap

> Updated 2026-07-11. Fleet order & standard: `capricorn-tooling/shared/CAP-STANDARD.md`.

## Now — v1.3.0
Current shipped state. See `CHANGELOG.md` for how we got here.

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
2. Keep gallery regenerated each release (release commit includes shots)

## Later
- Fraganty.ai catalog expansion
- Wear-streak widgets

## Ground rules
- No dirty trees: commit or discard before ending a session.
- CI green before tag; tag `vX.Y.Z` per release.
- Bump SW cache with any asset change (PWA apps).
- Never commit `.env` / secrets.
