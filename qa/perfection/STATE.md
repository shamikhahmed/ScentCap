# ScentCap — Perfection Loop v3 · STATE

Updated: 2026-10-14T12:20:00Z  
Phase: **C · Matrix** (gallery bridged · extended states open)  
Branch: `main` (from `perfection/scentcap-v3`)  
App version: **2.2.0** · SW `scentcap-v220`

## Released
- G-8 2.2.0 · SCN-V3-1/2/3 FIXED (Builder; Auditor stamp pending if not yet ✅ VERIFIED)
- Merge `--no-ff` perfection/scentcap-v3 → main · tag `v2.2.0` · own Pages

## Evidence
- Local: `qa/perfection/{baseline,post-fix}/device-qa.json` — 7/7 hard=0 tap=0 text=0
- Live: `qa/perfection/live-v2.2.0/device-qa.json` (after Pages deploy)

## Open
- SCN-V3-5 matrix extended routes/states (P2)

## Reproduce (live)
```bash
export PW_CORE=/Users/shamikhahmed/Projects/Cap/Cap-Apps/MasteryCap/node_modules/playwright-core
export PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright
cd /Users/shamikhahmed/Projects/Cap/Cap-Apps
node capricorn-tooling/scripts/device-qa.mjs ScentCap/qa/perfection/live-v2.2.0 \
  --apps=ScentCap \
  --url='ScentCap=https://shamikhahmed.github.io/ScentCap/?demo=1'
curl -s https://shamikhahmed.github.io/ScentCap/VERSION.json
```
