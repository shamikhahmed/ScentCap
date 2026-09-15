# ScentCap — APP-REPORT

**Status:** `TIER1.json` **PASS** — fleet Tier 1 **not** claimed (VO evidence not linked; Xcode ⛔ BLOCKED-EXTERNAL)  
**Version:** 2.1.1 · **SW:** `scentcap-v212` · **Tag:** `v2.1.1`  
**Live URL:** https://shamikhahmed.github.io/ScentCap/  
**Updated:** 2026-09-15 (app loop after Step R)

Evidence: [`TIER1.json`](TIER1.json) · [`SINKS.md`](SINKS.md) · [`lighthouse/home-demo-mobile.json`](lighthouse/home-demo-mobile.json) · CI https://github.com/shamikhahmed/ScentCap/actions/runs/34959937910

## 1. Status
- Automated gate file: **PASS** (23 pass, 0 fail, 1 warn: `matrix:shots`)
- Fleet Tier 1 certification: **not verified** until VoiceOver (macOS Safari or device) evidence is linked
- Native Xcode 26 build: ⛔ **BLOCKED-EXTERNAL** (CLT only; store pack docs present)

## 2. Scorecard
No estimated dimension scores (C-09). Gates use evidence only.

### G1–G14 (honest)
| Gate | Result | Notes |
|---|---|---|
| G1 Native / store | PARTIAL / EXTERNAL | Capacitor pack + `docs/store/*` + PrivacyInfo; xcodebuild ⛔ |
| G2 Feature honesty | PASS pending human | No Pro gate; advisor rules on-device |
| G3 Naming | PASS | ScentCap |
| G4 Responsive | WARN | finish-matrix spec present; shots warn |
| G5 Performance | EVIDENCE | LH mobile perf **0.58** recorded — not claimed as G5 pass |
| G6 Privacy | PASS | `public/privacy.html`; on-device wardrobe |
| G7 A11y | PARTIAL | LH a11y **0.96**; VO ⛔ not linked |
| G8 Versioning | PASS | 2.1.1 / scentcap-v212 / tag / CI green |
| G9 Fonts / CSP | PASS | kill-list Google Fonts 0 |
| G10 Security sinks | PASS | SINKS.md (1 static demo template) |
| G11 Tests | PARTIAL | lint + unit + e2e in CI verify |
| G12 Docs | PASS | finish-loop records + store pack |
| G13 Gallery | WARN | gallery command exists; regen optional |
| G14 Live smoke | PASS | Deploy workflow success on main |

**Overall:** automated Tier 1 file PASS; product Tier 1 **not** claimed without VO.

## 3. Issues found and resolved this slice
| ID | Severity | What | Done | Evidence |
|---|---|---|---|---|
| kill-list hex | P0 | Raw hex outside brand tokens | Moved to `src/design/tokens.ts`; CSS vars | `npm run tier1` kill:raw-hex 0 |
| native dialogs | P0 | `alert`/`confirm` in Settings | ConfirmDialog | Settings.tsx |
| suppressions | P0 | eslint-disable exhaustive-deps | useCallback + deps | Advisor/Home |
| C-22 LH | P1 | Missing LH JSON | home-demo-mobile.json | qa/finish-loop/lighthouse/ |
| C-10 CI | P0 | finish-matrix `any` lint fail | Typed `__APP_READY__` | CI run 34959937910 |

## 4. Remaining
- `matrix:shots` warn — run `FINISH_MATRIX=1` capture
- VO evidence (macOS Safari) for G7 close
- Xcode 26 simulator build when full Xcode available

## 5. Decisions applied
- D-01 / G-1 native pack without store submission
- C-09 honesty — no estimated scores
- FND-04 ConfirmDialog for destructive/confirm flows
