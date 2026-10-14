# ScentCap — Perfection Loop v3 · STATE

Updated: 2026-10-14T11:26:00Z  
Phase: **F · Verify (hand-off)** — Wave C SCN-V3-1/2/3 FIXED → Auditor  
Branch: `perfection/scentcap-v3`  
App version: 2.1.4 (no release bump — Phase I)

## Last commits
- Tip: see `git rev-parse HEAD` on `perfection/scentcap-v3` after push
- Base: `602cdff` (main tip — e2e offline SVG assert; tip CI green)

## What's running
```bash
npm run build
rm -rf /tmp/scentcap-qa-serve && mkdir -p /tmp/scentcap-qa-serve/ScentCap
rsync -a dist/ /tmp/scentcap-qa-serve/ScentCap/
# serve /tmp/scentcap-qa-serve on :8776 → http://127.0.0.1:8776/ScentCap/?demo=1
```

## Baseline / post-fix
`qa/perfection/baseline/device-qa.json` (+ `post-fix/` JSON copy)  
**7/7 hard=0 · tap&lt;32=0 · text&lt;11=0 · pageErr=0 · hubConsole=0**

## Next 3 actions (Auditor)
1. Clean checkout `perfection/scentcap-v3`; `npm ci` && `npm run build`; serve dist under `/ScentCap/`.
2. Re-run device-qa with `PW_CORE` + `PLAYWRIGHT_BROWSERS_PATH`; confirm summary all zeros.
3. Spot-check: brand captions ≥12px; "Use my collection" ≥44×44; flacon SVG has monogram only (no etched brand string).

## Reproduce
```bash
export PW_CORE=/Users/shamikhahmed/Projects/Cap/Cap-Apps/MasteryCap/node_modules/playwright-core
export PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright
cd /Users/shamikhahmed/Projects/Cap/Cap-Apps/ScentCap
git checkout perfection/scentcap-v3 && npm ci && npm run build
# serve as above, then:
cd /Users/shamikhahmed/Projects/Cap/Cap-Apps
node capricorn-tooling/scripts/device-qa.mjs ScentCap/qa/perfection/auditor \
  --apps=ScentCap \
  --url='ScentCap=http://127.0.0.1:8776/ScentCap/?demo=1'
```
