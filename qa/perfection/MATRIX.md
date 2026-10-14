# ScentCap — Perfection Loop v3 · MATRIX

Updated: 2026-10-14 · Matrix-Builder  
Legend: ✅ evidence path · ⏳ pending · N/A reason  
Devices: SE 375 · iPhone 390 · iPad-P 820 · iPad-L 1180 · Mac 1440 · wide 1920  
Engines: W=WebKit · C=Chromium

## Today `/?demo=1` (device-qa hard gates)

| Cell | Status | Evidence |
|---|---|---|
| light×iPhone SE 375×webkit | ✅ | `qa/perfection/baseline/device-qa.json` · `ScentCap-webkit-iphone-se.png` |
| light×iPhone 390×webkit | ✅ | baseline |
| light×iPad port 820×webkit | ✅ | baseline |
| light×iPad land 1180×webkit | ✅ | baseline |
| light×MacBook 1440×webkit | ✅ | baseline |
| light×MacBook 1440×chromium | ✅ | baseline |
| light×Android 412×chromium | ✅ | baseline |
| Live wave-z | ✅ | `capricorn-tooling/docs/perfection-2026-10/live-verify-wave/ScentCap/device-qa.json` |
| Auditor live 2.2.0 | ✅ | `qa/perfection/auditor-2026-10-14/device-qa.json` |

Hard failures: **0/7**. tap&lt;32: **0**. text&lt;11: **0**. pageErr: **0**.

## Gallery v3 (schema 2 · 10 routes × light/dark × iphone/ipad/mac)

Manifest: `docs/screenshots/gallery/gallery-manifest.json` · paths `docs/screenshots/gallery/<theme>/<device>/<group>--<screen>--<state>.webp`

| Screen | State | light×iphone | light×ipad | light×mac | dark×iphone | dark×ipad | dark×mac |
|---|---|---|---|---|---|---|---|
| Today | demo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Onboarding | welcome | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Collection | demo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add fragrance | demo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Advisor | demo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Calendar | demo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Analytics | demo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Layering lab | demo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Travel kit | demo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Settings | demo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Example evidence: `docs/screenshots/gallery/dark/iphone/daily--today--demo.webp`

## N/A (justified)

| Item | Reason |
|---|---|
| iPhone SE / iPad portrait per-screen gallery duplicates | §9.1 — layout unchanged vs iphone 390 / ipad landscape captures |
| Chromium cells per gallery row | Gallery captured via Playwright Chromium; device-qa exercises Chromium on home |
| wide 1920×light/dark×engines | No wide-only layout breakpoint in v3 gallery scope |

## Extended inventory × states (§13.7 remainder)

| Entry | light/dark × devices | Status | Notes |
|---|---|---|---|
| `/fragrance/:id` detail | all | ⏳ | SCN-V3-5 · LH route |
| Wear log / rating modal | all | ⏳ | SCN-V3-5 |
| Collection empty · add validation error | all | ⏳ | SCN-V3-5 |
| 404 · offline banner | all | ⏳ | SCN-V3-5 |

## Coverage rollup

| Bucket | ✅ | N/A | ⏳ |
|---|---:|---:|---:|
| Device-qa smoke (7 engines/devices) | 7 | 0 | 0 |
| Gallery v3 primary (60 theme×device cells) | 60 | 0 | 0 |
| Justified N/A rows | 0 | 3 | 0 |
| Extended inventory groups | 0 | 0 | 4 |
| **Matrix %** | | | **94%** (70/74 counted cells) |
