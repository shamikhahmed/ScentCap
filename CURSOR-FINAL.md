# Cursor — final unattended run (owner away; do NOT ask questions, decide sensibly and keep going)

Repo: /Users/shamikhahmed/Projects/Cap/Cap-Apps/ScentCap (branch `main`). Claude Code works in the same checkout.
Rules from CURSOR-TASKS.md still apply: stage only your own paths, never `git add -A`, never stash/reset/rebase, prefix commits `cursor:`.
Do not touch: public/bottles/**, public/data/catalog.json, scripts/build-catalog.mjs (Claude is building the catalog).

## Step A — finish Phase 2 (now)
1. Apply the 5 review fixes at the bottom of CURSOR-NOTES.md (titles Insights/Diary, Diary grid dots, Layering dedupe, Settings profile sheet, Insights ring %).
2. Update e2e specs/selectors for the 3.0 UI (tab bar is `.ui-tabbar`, sidebar `data-testid="desktop-sidebar"`, banner `data-testid="demo-banner"`, Add search `#catalog-search`). Bundled catalog means search works offline — mock/disable fraganty.ai in e2e helpers. Make `npm run verify` green.
3. HIG matrix (`node ../capricorn-tooling/scripts/hig-check.mjs`) on 4 viewports × light/dark; update qa/v7/HIG-AUDIT.md. Commit.

## Step B — wait for Claude's release
Poll every 2 minutes in a terminal until this prints a line:
  `git log --oneline -30 | grep "release: ScentCap 3.0.0"`
(If CURSOR-NOTES.md contains "Phase 3 GO", that also counts.) Then `git pull` is NOT needed (same checkout) — just continue.

## Step C — Phase 3: everything public-facing (use the demo wardrobe, `?demo=1`; real bottle photos must show)
1. Screen gallery: `npm run gallery` — every screen, mobile + desktop, light + dark. Update docs/screenshots/**, screen-gallery.html/.js/.css, GALLERY.md.
2. App Store screenshots: 6.9" 1320×2868, 6.5" 1284×2778, iPad 13" 2064×2752 → docs/store/** (Today, Add search, Collection, Detail, Advisor, Diary, Insights; clean captions).
3. Videos: 20–30 s walkthrough via Playwright video (1080×1920 and 1920×1080): onboarding → Today pick → Wear today → Add via search → Collection → Detail. ffmpeg → MP4 H.264 ≤ 6 MB in docs/video/. App Store preview 886×1920 15–30 s in docs/store/preview/. Poster JPGs.
4. Example stories: rewrite qa/v7/STORIES.md + qa/v7/personas/* for the 3.0 flows (fictional people, labelled fictional).
5. App website: public/landing.html, pitch.html, presentation.html (+ support/privacy/terms consistency) in the 3.0 design language from DESIGN.md: real bottle imagery, new screenshots, video (poster, preload="none"), features, attribution "Bottle images © their respective brands, via Parfumo." Lighthouse ≥ 95 on landing.
6. Portfolio: update the ScentCap entry in /Users/shamikhahmed/Projects/Cap/Cap-Apps/shamikhahmed.github.io (card image, description, screenshots, v3.0.0). Separate repo: commit + push there.
7. Docs: README.md, CHANGELOG.md (3.0.0), HANDOVER.md; append dated decision to ~/Capricorn-Brain/01 Projects/ScentCap.md.
8. `npm run verify` green → `git push origin main`. Wait for the GitHub Pages deploy to finish (`gh run watch`), open https://shamikhahmed.github.io/ScentCap/ and confirm it loads with real bottles.

## Step D — signal completion (REQUIRED — Claude shuts the laptop down when it sees this)
Append exactly this line to CURSOR-NOTES.md, commit (`cursor: phase 3 done`) and push:
  `PHASE 3 DONE`
If something is impossible, still write `PHASE 3 DONE` with a short "Skipped:" list so the run can finish.
Estimated: Step A ~30–45 min, Step C ~1.5–2.5 h.
