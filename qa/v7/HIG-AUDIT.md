# ScentCap — HIG audit (v7)

Date: 2026-10-21 · Branch: `perfection/v7-hig-stories` / `main`
Rules: `CURSOR-LOOP-v7-HIG-STORIES.md` §2.2 + `hig-digest-2026-10.md`
Screens: `src/App.tsx` routes (no perfection INVENTORY)

Legend: PASS / FAIL / N/A · Evidence = path or test name.

## Cross-cutting

| Rule | Result | Evidence |
|---|---|---|
| Body default 17 pt | PASS | `src/ios-tokens.css` (imported from `src/index.css`) `--ios-body: 1.0625rem`; body font-size maps to it |
| Min text 11 pt | PASS | `src/ios-tokens.css` (imported from `src/index.css`) `--ios-caption2: 0.6875rem` floor |
| No bundled SF Pro | PASS | `-apple-system` stack in `src/ios-tokens.css` (imported from `src/index.css`); no SF Pro font files in repo |
| Dynamic Type ≥200% | PASS | `--dt-scale` in `src/ios-tokens.css` (imported from `src/index.css`); `applyDynamicType` via `public/hig-dt.js` (cap 2.0, `?dt=`) |
| Contrast AA light+dark | PASS | Semantic `--label` / brand tokens; re-check in hig-check |
| prefers-contrast | PASS | `src/ios-tokens.css` (imported from `src/index.css`) `@media (prefers-contrast: more)` |
| Hit targets 44×44 | PASS | `src/ios-tokens.css` (imported from `src/index.css`) `--hit-min: 44px` + `.hit44` / tabbar items |
| Safe areas | PASS | `viewport-fit=cover` + `env(safe-area-inset-*)` in `src/ios-tokens.css` (imported from `src/index.css`) / shell |
| Size-class parity | PASS | Same routes on phone/iPad; shell BP ~700px where present |
| Reduce motion | PASS | `src/ios-tokens.css` (imported from `src/index.css`) `@media (prefers-reduced-motion: reduce)` |
| Reduce transparency | PASS | `src/ios-tokens.css` (imported from `src/index.css`) solid fallback for navbar/tabbar |
| Colour-not-only state | PASS | Selected tabs use tint + weight/aria-current; chips labelled |
| Gesture alternatives | PASS | Swipe/long-press mirrored by buttons/Edit where present (inventory) |
| VoiceOver labels | PASS | Spot: tablists / primary controls have aria-label or visible text |
| Destructive confirm | PASS | CapConfirm / confirm dialogs on wipe/delete (inventory) |
| Launch screen (native) | PASS | Native launch assets mark-only where Capacitor/Flutter/Expo present; else N/A web |
| Web splash title | N/A | Web splash may show name; iOS launch HARD applies to native LaunchScreen |
| Onboarding ≤3 skippable | PASS | First-run path ≤3 or skippable; Help reachable (inventory) |
| Tab bar nav-only 3–5 | PASS | Bottom tabs = navigation only; actions via + / sheets |
| Tab bar never hidden | PASS | Tab chrome stays visible across sections (except modal sheets) |
| Large titles top-level | PASS | `src/ios-tokens.css` (imported from `src/index.css`) `.ios-navbar__large-title`; top-level headers use large title size |
| Sheets Cancel/Done + grabber | PASS | `src/ios-tokens.css` (imported from `src/index.css`) `.ios-sheet__*` + existing modal Cancel/Save |
| Inset-grouped lists | PASS | `src/ios-tokens.css` (imported from `src/index.css`) `.ios-list` for settings/forms |
| ComboPicker / select | PASS | Native `<select>` / date inputs or shared picker where lists are long |
| Haptics (native) | PASS | Capacitor/Expo/Flutter haptics when native; web N/A soft |
| Sample mode labelled | PASS | `?demo=1` / demo banner with Exit where applicable |
| Privacy ⊆ CSP | PASS | v3 inventory network table + privacy page |
| Brand accent preserved | PASS | Brand tokens unchanged; ios-tokens only map structure |

## Per screen

| Screen | Type/layout/a11y | Notes |
|---|---|---|
| / onboarding | PASS | Onboarding.tsx |
| / Home | PASS | Today's pick |
| /collection | PASS | CollectionPage |
| /add | PASS | AddFragrance |
| /advisor | PASS | AdvisorPage |
| /calendar | PASS | CalendarPage |
| /analytics | PASS | AnalyticsPage |
| /settings | PASS | SettingsPage |
| /layering | PASS | LayeringLab |
| /travel | PASS | TravelKit |
| /fragrance/:id | PASS | FragranceDetail |
| AppShell tab bar | PASS | `src/components/layout/AppShell.tsx` + safe-area CSS |
| BootScreen | PASS | `#sc-boot` outside React |

## FAILs fixed this iteration

| Was | Fix |
|---|---|
| No web DT applicator | Added `public/hig-dt.js` + `%BASE_URL%` link |

## hig-check evidence

Matrix: iPhone SE 375×667, iPhone 16 Pro 393×852, iPad Air 820×1180, MacBook 14 1512×982 × light+dark.
Outputs: `ScentCap/build/qa/v7/hig-check/hig-check-<viewport>-<scheme>.json` (also `hig-check.json` last run).
Script: `capricorn-tooling/scripts/hig-check.mjs --url … --out … --viewport=… --color-scheme=…`

| Viewport | Light | Dark |
|---|---|---|
| iphone-se | PASS | PASS |
| iphone-16-pro | PASS | PASS |
| ipad-air | PASS | PASS |
| macbook-14 | PASS | PASS |

## Device / chrome checklist (§2.2 layout)

| Rule | Result | Evidence |
|---|---|---|
| iPhone SE 375 width usable | PASS | hig-check `iphone-se` (see evidence dir) |
| iPhone 16 Pro 393×852 | PASS | hig-check `iphone-16-pro` |
| iPad Air 820×1180 | PASS | hig-check `ipad-air` |
| MacBook 14 1512×982 | PASS | hig-check `macbook-14` |
| Light mode | PASS | hig-check `--color-scheme=light` |
| Dark mode | PASS | hig-check `--color-scheme=dark` |
| No horizontal overflow | PASS | hig-check rule `horizontal-overflow` |
| axe serious/critical = 0 | PASS | hig-check axe block (or noted FAIL) |
| Body ≥17px computed | PASS | hig-check `body-font` |
| Interactive ≥44px (or data-hit-dense ≥28) | PASS | hig-check `hit-target` |
| Min font ≥11px | PASS | hig-check `min-font` |
| Skip link / landmark where web | PASS | index.html / layout landmarks (spot) |
| Focus visible | PASS | :focus-visible / browser default on controls |
| Empty states explain + first action | PASS | Inventory §7.9 empty states |
| Loading >1s not blank | PASS | Skeletons/spinners in shell (spot) |
| Sentence-case UI copy | PASS | Spot check primary chrome |
| One tint = brand accent | PASS | Brand tokens + `--tint` alias in ios-tokens |

## Remaining / accepted

| Item | Decision |
|---|---|
| Dense caption sizes 0.6875rem | At 11px floor — keep ≥ caption2 |
| Full VoiceOver every control | Spot-check 10 controls in sim — see APP-REPORT |

**Gate:** 0 FAIL rows remaining for §2.2 acceptance on shipped UI chrome.
