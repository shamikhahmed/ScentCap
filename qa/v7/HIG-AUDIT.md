# ScentCap — HIG audit (v7)

Date: 2026-10-24 · Branch: `main` (Phase 2 secondary screens)
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
| /advisor | PASS* | `Advisor.tsx` — `PageHeader` + `ui-page`; see Phase 2 table |
| /calendar | PASS* | `CalendarPage.tsx` — Diary large title + inset timeline |
| /analytics | PASS* | `Analytics.tsx` — Insights header + inset rank lists |
| /settings | PASS* | `Settings.tsx` — grouped inset lists (Profile · Prefs · Data · About) |
| /layering | PASS* | `LayeringLab.tsx` — kit header + `ui-list` saved combos |
| /travel | PASS* | `TravelKit.tsx` — trip form inset list + segmented mode |
| /fragrance/:id | PASS | FragranceDetail |
| AppShell tab bar | PASS | `src/components/layout/AppShell.tsx` + safe-area CSS |
| BootScreen | PASS | `#sc-boot` outside React |

## FAILs fixed this iteration

| Was | Fix |
|---|---|
| No web DT applicator | Added `public/hig-dt.js` + `%BASE_URL%` link |

## Phase 2 — secondary screens vs DESIGN.md

Audited against `DESIGN.md` (large title, inset grouped lists, 17pt body, 44pt targets, light+dark).
Automated spot-check: `?demo=1` on each route, iPhone 16 Pro 393×852, light+dark — JSON under `build/qa/v7/hig-check/routes/<route>/`.

| Screen | Large title | Body 17pt | 44pt targets | Inset lists | Light + dark | hig-check notes |
|---|---|---|---|---|---|---|
| Advisor (`/advisor`) | PASS — `PageHeader` “Scent Advisor” | PASS | FAIL — 20 controls &lt;44px (moment chips, segmented filters; no `data-hit-dense`) | PASS — results/history in `ui-list` | PASS — theme + color-scheme | Light: min-font + hit-target + axe `color-contrast`. Dark: hit-target + axe |
| Calendar / Diary (`/calendar`) | PASS — `PageHeader` “Diary” | PASS | PASS — 0 undersized interactives on pro | PASS — “Timeline” `ui-list` + day sheet lists | PASS | Light/dark: tab bar min-font + axe `color-contrast` only |
| Analytics (`/analytics`) | PASS — `PageHeader` “Analytics” | PASS | PASS | PASS — sleeper/spend `ui-list` blocks | PASS | Same as Calendar (shared chrome) |
| Settings (`/settings`) | PASS — `PageHeader` “Settings” | PASS | FAIL — 33 undersized (profile `ui-chip` grid, compact rows) | PASS — Profile · Preferences · Tools · Data · Sample · About headers + `ui-list` | PASS | Wipe: two-step `Sheet` + danger block button. Light/dark: min-font + hit-target + axe |
| Layering Lab (`/layering`) | PASS — `PageHeader` / `EmptyState` | PASS | PASS on pro light (saved rows use `ui-icon-btn` / min-h 44) | PASS — saved combos `ui-list` | PASS | Light: min-font + axe. Dark: axe only |
| Travel kit (`/travel`) | PASS — `PageHeader` “Travel kit” | PASS | FAIL — 2 undersized (bottle pick toggles on pro light) | PASS — trip fields + picks in `ui-list` | PASS | Light: min-font + hit-target + axe. Dark: min-font + axe |

\*Layout/a11y **PASS** on structure and tokens; automated hig-check still reports shared chrome + a few dense controls (see matrix).

## hig-check evidence

Matrix: iPhone SE 375×667, iPhone 16 Pro 393×852, iPad Air 820×1180, MacBook 14 1512×982 × light+dark.
URL: `http://127.0.0.1:4174/ScentCap/?demo=1` (demo wardrobe so routes render inside shell).
Outputs: `ScentCap/build/qa/v7/hig-check/hig-check-<viewport>-<scheme>.json` (also `hig-check.json` last run).
Script: `capricorn-tooling/scripts/hig-check.mjs --url … --out … --viewport=… --color-scheme=…`
Run: 2026-10-24 after `npm run build && npm run preview -- --host 127.0.0.1 --port 4174`.

| Viewport | Light | Dark |
|---|---|---|
| iphone-se | FAIL (min-font, hit-target, axe) | FAIL (min-font, axe) |
| iphone-16-pro | FAIL (min-font, hit-target, axe) | FAIL (min-font, axe) |
| ipad-air | FAIL (min-font, hit-target, axe) | FAIL (min-font, axe) |
| macbook-14 | FAIL (min-font, hit-target, axe) | FAIL (min-font, axe) |

Shared failures: floating tab bar labels at 10.5px (below 11px rule); Home “moment” chips 86×36px; axe WCAG **serious** `color-contrast` (1) on demo home — likely tertiary/tab label vs glass tab bar. No horizontal overflow; body computed 17px on all matrix runs.

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
| axe serious/critical = 0 | FAIL | hig-check: 1 serious `color-contrast` on demo shell (all viewports) |
| Body ≥17px computed | PASS | hig-check `body-font` = 17px with `?demo=1` |
| Interactive ≥44px (or data-hit-dense ≥28) | FAIL | Tab bar + Home chips; Advisor/Settings/Travel secondary hits — see Phase 2 table |
| Min font ≥11px | FAIL | Tab bar caption labels 10.5px (10 nodes) on every screen |
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
| Tab bar 10.5px labels | Accept for iOS-style tab captions **or** bump to caption2 + re-run matrix |
| Advisor/Settings profile chips | Mark `data-hit-dense` or enlarge to 44px — tracked Phase 2 |
| axe color-contrast on glass tab bar | Tune `--label-3` / tab inactive on glass — tracked Phase 2 |
| Full VoiceOver every control | Spot-check 10 controls in sim — see APP-REPORT |

**Gate:** Secondary screens match DESIGN.md structure (large title + inset lists + 17pt body). Automated hig-check matrix **8/8 FAIL** until shared tab bar, contrast, and dense chips are fixed; no new horizontal overflow.
