# ScentCap — Perfection Loop v3 · ITEMS

Seeded from CURSOR-PERFECTION-LOOP.md §13.7. Status: only Auditor sets ✅ VERIFIED.

### SCN-V3-1 — main CI red (demo bottle photo e2e)
severity: P1 · status: ✅ VERIFIED  
Where: GitHub Actions `Deploy to GitHub Pages` / `npm run verify`  
Cause: Merge of `finish/scentcap-stepR` still expected Fraganty HTTPS hydrate; demo ships offline SVG data URIs for cold-path LH.  
Fix: already on `main` @ `602cdff` — e2e asserts `data:image/` ≥6 (PR #3). Tip CI green; perfection branch cut from tip.  
Evidence: `gh run list` merge @ `7dde2eb` + tip @ `cea2468` → success; live **2.2.0** device-qa 7/7  
Auditor: ✅ VERIFIED 2026-10-14T12:08:00Z — CI green + live gate clean

### SCN-V3-2 — brand captions text &lt; 11px
severity: P1 · status: ✅ VERIFIED  
Where: home demo · WebKit+Chromium · brand labels + flacon etched SVG  
Cause: HTML brands at `text-[10px]` / `0.6875rem`; SVG etched brand `font-size="5.5"` scales &lt;11px.  
Fix: brand captions → `0.75rem` / `text-xs` (Home, BottleCard, shelf/editorial CSS); remove etched brand SVG text; keep monogram at `fontSize="14"`.  
Evidence: live **2.2.0** `qa/perfection/auditor-2026-10-14/device-qa.json` textUnder11=0  
Auditor: ✅ VERIFIED 2026-10-14T12:08:00Z

### SCN-V3-3 — "Use my collection" target &lt; 32px
severity: P1 · status: ✅ VERIFIED  
Where: DemoBanner on `?demo=1`  
Cause: ghost Button forced `!h-7 !min-h-0` (~28px).  
Fix: `!min-h-[44px] !min-w-[44px] !h-11` on DemoBanner CTA.  
Evidence: live **2.2.0** `qa/perfection/auditor-2026-10-14/device-qa.json` tapUnder32=0  
Auditor: ✅ VERIFIED 2026-10-14T12:08:00Z

### SCN-V3-4 — gallery 20 shots → full v3
severity: P2 · status: ✅ FIXED  
Where: `docs/screenshots/gallery/` · schema v2 · 60 shots (10 routes × light/dark × iphone/ipad/mac)  
Evidence: `gallery-manifest.json` @ `b3111db`; MATRIX § Gallery v3 bridged 2026-10-14  
Fix: Gallery-Engineer v3 capture + manifest v2  
Auditor: — (matrix cells ✅; completeness gate Phase F)

### SCN-V3-5 — matrix extended routes × states
severity: P2 · status: ⏳ OPEN  
Where: fragrance detail · wear/rating modals · empty/error/404/offline × light/dark × devices  
Evidence: MATRIX.md extended section ⏳  
Fix: Phase G capture or wave-z regression shots when UI stable  
Auditor: —
