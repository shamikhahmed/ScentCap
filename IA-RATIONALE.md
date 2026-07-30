# Information Architecture — ScentCap

**Version:** 2.0.9 · **Date:** 2026-07-30

## Product shape

Local-first fragrance wardrobe PWA. Five primary jobs, five tabs. Secondary power tools live under Settings so the tab bar stays scannable.

## Tab bar (≤2 taps to core)

| Tab | One job | Why here |
|-----|---------|----------|
| **Today** (`/`) | Daily pick + wear | Most frequent action. Identity of the product. |
| **Collection** (`/collection`) | Browse / manage bottles | Inventory home. Add is a FAB, not a 6th tab. |
| **Advisor** (`/advisor`) | Guided pick for occasion | Explicit advisor flow when Home pick isn’t enough. |
| **Calendar** (`/calendar`) | Wear history over time | Time dimension — not jammed into Collection. |
| **You** (`/settings`) | Identity + prefs + tools | Mature “me” hub. Not a catch-all dump. |

**Add fragrance** (`/add`): primary FAB from shell — creation is a verb, not a destination tab.

**Detail** (`/fragrance/:id`): drill-in from Collection / Home / Advisor. Back → Collection.

## Settings ordering (mature convention)

Top → bottom = most-used / identity → rare → destructive / legal.

1. **Account** — profile (skin, gender, sensitivities). Advisor needs this; users edit rarely but it’s identity.
2. **Appearance** — light/dark only. Language would live here later as its own sibling, never nested under Appearance.
3. **Advisor** — avoid-sweet, office-only, office-safe + spray cap. One concept group: “how picks behave.”
4. **Weather** — city / location for daily climate. Separate from Advisor so users don’t hunt under “AI” or Theme.
5. **Tools** — Analytics, Layering Lab, Travel kit. Power features with one home each. Not in tab bar (usage < daily pick / collection). Reachable in 2 taps: You → Tools → screen.
6. **Privacy & Data** — local-first promise, network disclosure, export/import, demo wardrobe. Export near bottom of this group; import next to it. Demo after backup (destructive-ish).
7. **About & Legal** — version, privacy policy, clear-cache recovery. Always last.

## Progressive disclosure

- Home: bottle + Wear first; mood chips + stats below the fold.
- Settings: section labels + short descriptions; toggles as buttons with `aria-pressed`; Tools as list rows.
- Advisor / Layering / Travel: full screens, not crammed into Settings cards.

## Anti-patterns fixed

| Before | After | Why |
|--------|-------|-----|
| Loose Analytics/Layering/Travel links above profile | Tools section, labelled rows | Discoverable, one job each |
| Privacy badge first, then theme mid-page | Account → Appearance → … → Privacy → About | Identity top, legal bottom |
| Duplicate Export in privacy card + Backup card | Single Backup under Privacy & Data | One concept, one place |
| PWA shortcut `/daily` (dead) | Shortcut → Home (`/`) | Shortcut matches real route |
| Theme dark-first in UI | Light default first in control order | Matches atelier light default |

## Discoverability budget

Core journeys ≤2 taps:

- Wear today → Today tab (0–1)
- Find bottle → Collection (1)
- Occasion pick → Advisor (1)
- Analytics → You → Analytics (2)
- Layering → You → Layering (2)
- Travel → You → Travel (2)
- Export backup → You → scroll Privacy & Data (2)

## Out of scope (intentional)

No accounts, no cloud sync UI, no billing. “Account” here means local profile identity only.
