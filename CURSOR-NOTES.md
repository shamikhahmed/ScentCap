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
