# ScentCap — App Store Listing Draft

> Version **3.0.0** (build 300) · Local-first PWA + Capacitor iOS · App Privacy: **Data Not Collected**

## Required URLs (GitHub Pages)

| Field | URL |
|-------|-----|
| **Privacy Policy** | https://shamikhahmed.github.io/ScentCap/privacy.html |
| **Terms of Use (EULA)** | https://shamikhahmed.github.io/ScentCap/terms.html |
| **Support** | https://shamikhahmed.github.io/ScentCap/support.html |
| **Marketing (optional)** | https://shamikhahmed.github.io/ScentCap/landing.html |

## App Name

**ScentCap**

## Subtitle (30 characters max)

```
Daily picks · wardrobe · layering
```

_Char count: 30_

## Keywords (100 characters max)

```
fragrance,perfume,cologne,scent,layering,wardrobe,office safe,wear tracker,collection,decant,travel
```

_Char count: 97_

## Promotional Text (170 characters, optional)

Offline catalog of real bottles. Weather-aware picks, Office Safe for work days, and a wear log that never leaves your phone — no account required.

## Description

**Stop guessing. Start wearing.**

ScentCap is your private fragrance operating system. Browse a bundled offline catalog of real bottles, add what you own, get a daily scent pick matched to weather and occasion, log wears, and build layering combos in the Lab. Everything stays on your device.

**Today’s pick**
Every morning, ScentCap recommends what to wear from your wardrobe — with spray count and placement guidance — using optional weather context when you allow location.

**Office Safe**
Enable Office Safe and work-day picks filter to low-projection, desk-friendly scents. Set a max spray limit for open-plan floors and client meetings.

**Scent Advisor**
Customize time, occasion, dress code, and vibe for a fresh recommendation with backup picks and reasoning.

**Layering Lab**
Pick a base from your wardrobe and discover compatible partners. Save combos for one-tap recall.

**Wear log & calendar**
Track every wear with ratings, compliments, and notes. Spot neglected bottles and rotation gaps.

**Analytics & travel kit**
Collection insights and a travel decant planner.

**Private by design**
Your wardrobe, photos, and history never leave your device unless you export them. No analytics SDKs. No accounts. App Privacy: Data Not Collected.

Bottle images © their respective brands, via Parfumo. ScentCap is not affiliated with any fragrance house.

Built for collectors who want clarity, not clutter.

## Screenshot Captions (6 screens)

| # | Screen | Caption |
|---|--------|---------|
| 1 | **Today** | Your daily scent pick — matched to weather and mood |
| 2 | **Office Safe** | Desk-friendly mode for work days — low projection, max sprays |
| 3 | **Spray Map** | Where to apply — pulse points, skin, and clothing |
| 4 | **Layering** | Find and save compatible scent combos |
| 5 | **Analytics** | Rotation health, value, and wear patterns |
| 6 | **Travel** | Pack the right decants for any trip |

## Age rating (App Store Connect answers)

| Question | Answer |
|----------|--------|
| Unrestricted web access | No |
| Gambling / contests | No |
| Mature / suggestive themes | No |
| Violence / horror | No |
| Medical / drug info beyond fragrance wear | No |
| **Suggested rating** | **4+** |

## App Privacy — Data Not Collected

Declare **Data Not Collected** in App Store Connect. ScentCap is local-first:

| Data type | Collected off-device? |
|-----------|----------------------|
| Contact info | No |
| Health & fitness | No |
| Financial info | No |
| Location | No (optional on-device use for Open-Meteo weather only; not linked to you; not used for tracking) |
| User content | No (wardrobe / photos / wear log stay on device) |
| Identifiers | No |
| Usage data | No |
| Diagnostics | No |
| Tracking | No |

Optional network calls (user-initiated): Open-Meteo (city or coordinates for weather), Fraganty (catalog search queries). No ScentCap backend stores wardrobe data.

## Privacy nutrition (detail)

See also [`store/PRIVACY-LABELS.md`](./store/PRIVACY-LABELS.md) and the privacy manifest at `ios/App/App/PrivacyInfo.xcprivacy`.

## Competitive positioning

| Feature | ScentCap | Typical cloud wardrobe apps |
|---------|----------|----------------------------|
| Local-first / no account | ✅ | Often ❌ |
| Bundled offline bottle catalog | ✅ | Rare |
| Daily scent pick + Office Safe | ✅ | Partial / missing |
| Layering lab + wear calendar | ✅ | Partial |
| Offline PWA + iOS shell | ✅ | Rare |

**Tagline:** _The fragrance OS that respects your nose — and your privacy._

## What’s New (3.0.0)

- ScentCap 3 redesign + bundled offline catalog of real bottles
- App Store hardening: privacy manifest, usage strings, mark-only launch, version 3.0.0

## Related

- Native build: [`IOS-BUILD.md`](./IOS-BUILD.md)
- Store pack: [`store/APP-STORE.md`](./store/APP-STORE.md)
- TestFlight: [`store/TESTFLIGHT.md`](./store/TESTFLIGHT.md)
