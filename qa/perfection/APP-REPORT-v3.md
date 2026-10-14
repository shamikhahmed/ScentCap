# ScentCap — APP-REPORT-v3

**Version:** 2.2.0 · **SW:** `scentcap-v220` · **Tag:** `v2.2.0`  
**Live:** https://shamikhahmed.github.io/ScentCap/  
**Released:** 2026-10-14 · Perfection Loop v3 Phase I

## Gates
| Gate | Result |
|---|---|
| CI verify | Tip green @602cdff; release re-runs on main push |
| device-qa local | 7/7 hard=0 tap=0 text=0 (`qa/perfection/baseline/`) |
| device-qa live | see `qa/perfection/live-v2.2.0/` after Pages |
| G-8 versions | VERSION.json = package.json = swCache scentcap-v220 |

## Items
| ID | Sev | Status |
|---|---|---|
| SCN-V3-1 | P1 | ✅ FIXED → shipped |
| SCN-V3-2 | P1 | ✅ FIXED → shipped |
| SCN-V3-3 | P1 | ✅ FIXED → shipped |
| SCN-V3-4 | P2 | ⏳ OPEN (gallery Phase G) |

## Lighthouse
Prior finish-loop evidence retained under `qa/finish-loop/lighthouse/` (v2.1.4 cold-path). Full §7.11 re-pass deferred with SCN-V3-4 / Phase later.
