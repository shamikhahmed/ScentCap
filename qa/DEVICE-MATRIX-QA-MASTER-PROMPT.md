# CAPRICORN FLEET — DEVICE MATRIX VISUAL QA MASTER PROMPT (LOOPING)

Copy from `===== START PASTE =====` to `===== END PASTE =====` into Cursor (or any coding agent) for any Cap app.  
VaultCap reference: `tests/device-matrix.spec.js` + `qa/device-matrix/` + this file.

**This is a LOOPING prompt.** Agent must not stop after one pass. Fix → re-capture → re-check until exit criteria met.

===== START PASTE =====

You are Staff Engineer + Product Designer + QA Lead for a Capricorn Systems PWA (offline-first, production SaaS for 1M+ users).

## Goal

Run **device-family visual QA** and **keep looping** until chrome (header / footer / corners / safe-area / tabs / sidebar / toast / FAB / sheets) is clean on every matrix device for major screens.

Families:

1. **iPhone** — home-button, notch, Dynamic Island  
2. **iPad** — mini, Air, Pro 11, Pro 13 (portrait + landscape)  
3. **Browser** — phone-width, laptop, desktop, ultrawide  

## LOOP PROTOCOL (mandatory — do not stop early)

```
LOOP:
  1. CAPTURE   — DEVICE_MATRIX=1 (or Cap equivalent) full matrix majors
  2. PROBE     — layout mode + overflow from meta.json / DOM
  3. REVIEW    — open worst shots: SE lock, SE dash, Pro Island dash,
                 iPad mini dash, laptop settings, ultrawide dash
  4. CLASSIFY  — Critical / High / Medium / Low (issue format below)
  5. FIX       — all Critical + High this iteration; Medium if <30 min
  6. REBUILD   — bundle / CSS as needed; smoke + viewport contract
  7. RE-CAPTURE affected devices (full matrix if shell breakpoint changed)
  8. UPDATE    — REPORT.md (WRONG→FIXED; residual list shrinks)
UNTIL exit criteria true
THEN: version bump surfaces + Brain dated decision + commit/push if user asked
```

### Exit criteria (ALL must be true)

- [ ] Every matrix device: correct layout mode (phone→tabs; tablet/desktop→sidebar per Cap BP)
- [ ] Zero horizontal overflow on majors
- [ ] Lock: no toast over keypad; clock/brand not clipped by notch/DEMO/island
- [ ] Tabs / sidebar footers: labels not truncated; 44px targets; safe-area once (no double pad)
- [ ] Toast / FAB clear of tab bar and home indicator
- [ ] Demo / status banner respects `safe-area-inset-top`
- [ ] Sidebar / About version string matches `VERSION.json` / `window.VER`
- [ ] Viewport contract tests pass (include tablet width just above BP)
- [ ] REPORT.md lists residual only as **Low** or empty
- [ ] No Critical/High open

If user says “fix all / completely / looping / don’t stop” → treat as **full loop until exit**. Do not ask permission between iterations.

## Absolute rules

1. Read Brain project note + shell breakpoint CSS before layout changes.
2. No fake AI marketing. Rules engines = “Smart Assistant”.
3. Smallest correct fix. No drive-by redesign.
4. Shots: `qa/device-matrix/{iphone|ipad|browser}/{device-id}/{screen}.png` — gitignore PNGs; keep REPORT.md.
5. Simulate safe-area in Chromium (`safeTop` / `safeBottom` inject). Prefer WebKit device project when available.
6. Chat may be terse; **prompt, REPORT, commits = clear English**.
7. Never force-push main. Commit/push only when user asked.

## Device matrix (IDs exact)

### A. iPhone (`family: iphone`)

| id | label | CSS W×H | chrome | safeTop | safeBottom |
|----|-------|---------|--------|---------|------------|
| iphone-se | iPhone SE (3rd) home button | 375×667 | home-button | 20 | 0 |
| iphone-13-mini | iPhone 13 mini notch | 375×812 | notch | 50 | 34 |
| iphone-14 | iPhone 14 notch | 390×844 | notch | 47 | 34 |
| iphone-14-pro | iPhone 14/15 Pro Dynamic Island | 393×852 | dynamic-island | 59 | 34 |
| iphone-15-pro-max | iPhone 15 Pro Max Dynamic Island | 430×932 | dynamic-island | 59 | 34 |
| iphone-16-pro-max | iPhone 16 Pro Max Dynamic Island | 440×956 | dynamic-island | 62 | 34 |

### B. iPad (`family: ipad`)

| id | label | CSS W×H | chrome | safeTop | safeBottom |
|----|-------|---------|--------|---------|------------|
| ipad-mini | iPad mini | 744×1133 | tablet | 24 | 20 |
| ipad-air-11 | iPad Air 11″ | 820×1180 | tablet | 24 | 20 |
| ipad-pro-11 | iPad Pro 11″ | 834×1194 | tablet | 24 | 20 |
| ipad-pro-13 | iPad Pro 13″ portrait | 1024×1366 | tablet | 24 | 20 |
| ipad-pro-13-land | iPad Pro 13″ landscape | 1366×1024 | tablet | 24 | 20 |

### C. Browser (`family: browser`)

| id | label | CSS W×H | chrome |
|----|-------|---------|--------|
| browser-phone-360 | Mobile browser | 360×740 | browser |
| browser-sm-laptop | Laptop | 1280×800 | browser |
| browser-hd | Desktop HD | 1440×900 | browser |
| browser-fhd | Desktop FHD | 1920×1080 | browser |
| browser-ultrawide | Ultrawide | 2560×1080 | browser |

Browser safe areas = 0 unless PWA standalone.

## Major screens (minimum)

Each device × dark (spot-check light once):

1. `lock` 2. `dashboard` 3. `primary-list` 4. `settings` 5. `secondary-hub` 6. `overlay`  
Optional: form sheet, empty state, long-scroll footer.

## Capture protocol

1. Unlock via Cap demo helper.
2. `setViewportSize` + inject safe-area CSS vars / chrome pads; document patches.
3. Dismiss tours/modals/**toasts** before shot; wait fonts/list paint.
4. Record layout mode: `mobile-tabs` | `sidebar` | `hybrid`.
5. Overflow probe: `scrollWidth > clientWidth + 2`.

## Checklist per shot

### Chrome & safe area
- Notch / Island / DEMO does not clip titles, lock clock, brand
- Home indicator not under tabs / FAB / primary CTA
- Home-button SE: no fake home-indicator gap
- Toast never covers lock keypad

### Navigation
- Phone → tabs; tablet/desktop → sidebar (Cap BP — VaultCap **700px**)
- **Trap:** width just under old 768 (iPad mini 744) must not keep phone chrome if Cap BP ≤744
- Tab labels not truncated; active state clear
- FAB / sheets ≥8px + safe above tabs

### Footer / header / corners
- Content `padding-bottom` ≥ tab height + safe
- No double footer (app + browser + tabs)
- Sheet Save/Cancel fully tappable
- Sidebar foot: 44px targets + safe-bottom
- Corner radius / card edges not clipped by viewport

### Spacing & cue tuning
- SE: CTAs reachable; no crushed type
- Ultrawide: max-width / columns intentional (no empty desert)
- Chamber / grid counts always show (use `0`, never blank hole)
- Settings row affordances consistent (chevron vs button pattern)

### A11y
- 44×44 touch; contrast AA; reduced-motion respected

## Issue format

- **Severity** · **Business impact** · **User impact** · **Fix complexity**  
- **Devices** · **Screens** · **Evidence** (PNG path) · **Recommended solution**

## Output each loop iteration

1. Matrix summary table  
2. Issues (WRONG) — fixed this loop vs still open  
3. What looks RIGHT  
4. Plans if code changes (Architecture · Refactor · Migration · Test · Rollback) — brief  
5. Update `qa/device-matrix/REPORT.md`  

## App hooks (fill before run)

- **App / path:** …  
- **Live URL:** …  
- **Shell breakpoint:** …  
- **Tabs / sidebar selectors:** …  
- **Demo unlock:** …  
- **Dense list route:** …  
- **Known pain:** …

## Done when

Exit criteria above all true + Brain note dated + docs/version synced if shipping.

===== END PASTE =====

## VaultCap fill-in

- App: VaultCap — `/Users/shamikhahmed/Desktop/Cap-Apps/VaultCap`
- Live: https://shamikhahmed.github.io/VaultCap
- Shell BP: **700px** (tabs ≤699; sidebar ≥700) — iPad mini 744 → sidebar
- Tabs: `.btabs` / `#btabs.btabs-in` · Sidebar: `#sidebar` / `.sidebar`
- Unlock: `tests/demo-unlock.js` → `fastGalleryUnlock` / `unlockDemoVault`
- Dense list: `banks` · Secondary: `family` / `documents` · Overlay: more sheet
- Test: `DEVICE_MATRIX=1 npx playwright test tests/device-matrix.spec.js`
- Out: `qa/device-matrix/` · REPORT: `qa/device-matrix/REPORT.md`
- SW / VER: keep `boot-ver.js`, `VERSION.json`, `sw-v51.js`, `index.html?v=` in sync

## ScentCap fill-in

- App: ScentCap — `/Users/shamikhahmed/Desktop/Cap-Apps/ScentCap`
- Live: https://shamikhahmed.github.io/ScentCap/
- Shell BP: **700px** (tabs ≤699; sidebar ≥700) — iPad mini 744 → sidebar
- Tabs: `.atelier-tabbar` / `.atelier-tab` · Sidebar: `[data-testid="desktop-sidebar"]`
- Unlock: `e2e/helpers.ts` → `loadDemoWardrobe`
- Dense list: `/collection` · Secondary: `/advisor` · Form: `/add` · Welcome: `/onboarding`
- Test: `npm run matrix` (`DEVICE_MATRIX=1 playwright test e2e/device-matrix.spec.ts`)
- Out: `qa/device-matrix/` · REPORT: `qa/device-matrix/REPORT.md`
- SW / VER: `VERSION.json` → `APP_VERSION` / `SW_CACHE` / vite PWA `cacheId`
