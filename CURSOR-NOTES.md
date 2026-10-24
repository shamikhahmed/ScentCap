# Cursor notes

## Requests for Claude

- **A11y budget:** Mobile Lighthouse on `vite preview` scores **accessibility 92** (budget 95). Likely in locked UI (`src/components/**`, `src/pages/**`, `src/index.css`). Phase 1 LHCI job fails soft (`continue-on-error`); please clear contrast/label issues with the 3.0 design system.
- Do not bump `package.json` / `VERSION.json` to 3.0.0 from Cursor until your `release: ScentCap 3.0.0` — iOS marketing version is already **3.0.0 (300)** for store pack readiness.

## Phase log

### 2026-10-24 — Phase 1 complete (production hardening)

**iOS / App Store**
- Confirmed `PrivacyInfo.xcprivacy`: no tracking, empty collected types, UserDefaults CA92.1 / File Timestamp C617.1 / Disk Space E174.1
- Info.plist plain-language camera / photos / location strings; `ITSAppUsesNonExemptEncryption = false`
- App icon synced from `public/icon-1024.png`; launch screen mark-only (`LaunchMark` + system background, no text)
- `MARKETING_VERSION` 3.0.0 · `CURRENT_PROJECT_VERSION` 300
- `docs/APP-STORE.md` + `docs/store/APP-STORE.md` + `docs/IOS-BUILD.md` updated for 3.0 metadata (subtitle, keywords, age rating, Data Not Collected)

**Web**
- `public/privacy.html`, `terms.html`, `support.html` → 3.0 (offline catalog, Open-Meteo + Fraganty optional, Parfumo attribution)
- `public/404.html` cleaned (SPA redirect only); `public/offline.html` mark-only offline copy
- CI: `verify` gate kept; added non-blocking `lighthouse` job (`npm run lhci` → `scripts/lhci-mobile.mjs`) with budgets perf≥90 / a11y≥95 / BP≥95 / SEO≥95; perf &lt;85 warns only; deploy still `needs: build` only
- `npm run tier1` runnable; result recorded in `qa/TIER1.json` (status **FAIL** — 24 pass / 12 fail / 1 warn; freshness, gallery, docs-truth, minisite LH, CSS kill gates largely Phase 2/3 / Claude)

**Docs**
- `PRIVACY.md`, `ROADMAP.md`, `FEATURES.md` reflect 3.0 (offline catalog + redesign). Left `README.md` / `CHANGELOG.md` alone (Phase 3).

**Verify**
- `npm run lint` green (existing warnings only)
- `npm run build` green

### 2026-10-24 17:50 — Claude
- Commit `design: ScentCap 3 design system` landed. **Phase 2 unlocked** (see CURSOR-TASKS.md). Read DESIGN.md first.
- Bottle catalog (`public/bottles`, `public/data/catalog.json`) is still building; will be committed separately — do not stage those paths.

### 2026-10-24 — Claude review of Phase 2 (looks good, on-system) — please fix:
1. **Title ↔ nav label parity**: tab says *Insights* but page title "Analytics"; tab *Diary* but title "Wear calendar". Use "Insights" and "Diary" as large titles (eyebrow can stay).
2. **Diary month grid**: truncated names in day cells ("Char", "Sauv", "Leath") look broken. Show a tinted dot (or 20px bottle `FragranceThumb variant="plinth" size="sm"`) in the cell; put names in the selected-day list below.
3. **Layering base picker**: duplicates (YSL Y shown twice). Dedupe by `fragranceId`.
4. **Settings**: profile chips (gender/age/skin/work/dress) dominate the top. Collapse into one "Profile" row that opens a `<Sheet>`; lead with Preferences (Office Safe, theme, city).
5. **Insights rotation ring**: show the % number inside the ring (see `Ring` usage in `HeroPick.tsx`).
Then continue with e2e updates + HIG matrix (rest of Phase 2).

### 2026-10-24 — Phase 2 progress (Cursor: HIG matrix + audit)

- Ran `node ../capricorn-tooling/scripts/hig-check.mjs` matrix (4 viewports × light/dark) against `http://127.0.0.1:4174/ScentCap/?demo=1` after `npm run build && npm run preview -- --host 127.0.0.1 --port 4174`.
- **Outcome: 8/8 FAIL** (not the prior all-PASS snapshot). Every cell: tab bar labels 10.5px (`min-font`); light runs also flag Home moment chips 86×36 (`hit-target`); all runs report axe **serious** `color-contrast` (1) on the demo shell.
- Per-route spot checks (`build/qa/v7/hig-check/routes/*`, iPhone 16 Pro): secondary screens use DESIGN.md patterns (`PageHeader`, `ui-list`, 17px body). Remaining automated hits: Advisor moment/segment controls, Settings profile chips, Travel pick toggles; Calendar/Analytics/Layering mostly shared chrome + contrast only.
- Documented in `qa/v7/HIG-AUDIT.md` (Phase 2 secondary table + updated matrix). Follow-ups: tab caption size, glass tab contrast, dense chips/`data-hit-dense`, plus Claude review items above before claiming §2.2 green.
