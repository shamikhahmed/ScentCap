# ScentCap — Perfection Loop v3 · ITEMS

Seeded from CURSOR-PERFECTION-LOOP.md §13.7. Status: only Auditor sets ✅ VERIFIED.

### SCN-V3-1 — main CI red (demo bottle photo e2e)
severity: P1 · status: ✅ FIXED (Phase I shipped 2.2.0)  
Where: GitHub Actions `Deploy to GitHub Pages` / `npm run verify`  
Cause: Merge of `finish/scentcap-stepR` still expected Fraganty HTTPS hydrate; demo ships offline SVG data URIs for cold-path LH.  
Fix: already on `main` @ `602cdff` — e2e asserts `data:image/` ≥6 (PR #3). Tip CI green; perfection branch cut from tip.  
Evidence: `gh run list --commit 602cdff` → success  
Auditor: —

### SCN-V3-2 — brand captions text &lt; 11px
severity: P1 · status: ✅ FIXED (Phase I shipped 2.2.0)  
Where: home demo · WebKit+Chromium · brand labels + flacon etched SVG  
Cause: HTML brands at `text-[10px]` / `0.6875rem`; SVG etched brand `font-size="5.5"` scales &lt;11px.  
Fix: brand captions → `0.75rem` / `text-xs` (Home, BottleCard, shelf/editorial CSS); remove etched brand SVG text; keep monogram at `fontSize="14"`.  
Evidence: `qa/perfection/baseline/device-qa.json` summary `textUnder11=0`  
Auditor: —

### SCN-V3-3 — "Use my collection" target &lt; 32px
severity: P1 · status: ✅ FIXED (Phase I shipped 2.2.0)  
Where: DemoBanner on `?demo=1`  
Cause: ghost Button forced `!h-7 !min-h-0` (~28px).  
Fix: `!min-h-[44px] !min-w-[44px] !h-11` on DemoBanner CTA.  
Evidence: baseline `tapUnder32=0` (was `smallTargets: ["Use my collection"]`)  
Auditor: —

### SCN-V3-4 — gallery 20 shots → full v3
severity: P2 · status: ⏳ OPEN  
Where: Phase G screen gallery  
Fix: — (full v3 capture both themes × devices)  
Auditor: —
