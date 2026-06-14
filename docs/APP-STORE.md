# ScentCap — App Store Listing Draft

> Version 1.0.7 · Cap Neutral · Local-first PWA + Capacitor iOS scaffold

## App Name

**ScentCap**

## Subtitle (30 characters max)

Daily scent picks · wear log · layering

## Keywords (100 characters max)

```
fragrance,perfume,cologne,scent,layering,wardrobe,office safe,wear tracker,collection,decant,travel
```

_Char count: 97_

## Promotional Text (170 characters, optional)

Office Safe mode keeps work-day picks desk-friendly. Your entire wardrobe, wear log, and layering combos stay on your device — no account required.

## Short Description (~80 words)

ScentCap is your private fragrance operating system. Add the bottles you own, get a daily scent pick matched to weather and occasion, log wears with ratings, and build layering combos in the Lab. **Office Safe** filters work-day recommendations to low-projection, conference-room-friendly scents — a feature competitors like ScentMax and Aromoshelf don't offer. Everything stays on your device. Export anytime.

## Full Description

**Stop guessing. Start wearing.**

ScentCap turns your fragrance collection into a daily decision engine. No social feed, no cloud account, no ads — just your wardrobe, your rules, your data on your phone.

**Today's pick**
Every morning, ScentCap analyzes your collection against weather, occasion, and your profile to recommend exactly what to wear — with spray count and body placement map.

**Office Safe — our hero feature**
Enable Office Safe and work-day picks automatically filter to low-projection, desk-friendly scents. Set a max spray limit for the office. Perfect for open-plan floors and client meetings. Unlike generic collection apps, ScentCap is built for real-world professional wear.

**Scent Advisor**
Customize time, occasion, dress code, and vibe for a fresh recommendation with backup picks and reasoning.

**Layering Lab**
Pick a base from your wardrobe and discover compatible partners. Save combos for one-tap recall.

**Wear log & calendar**
Track every wear with ratings, compliments, and notes. Spot neglected bottles and rotation gaps.

**Analytics & travel kit**
Collection value, seasonality insights, and a travel decant planner.

**Private by design**
Your wardrobe, photos, and history never leave your device unless you export them. No analytics SDKs. No third-party data collection. See our privacy policy for details.

Built for collectors who want clarity, not clutter.

---

## Screenshot Captions (6 screens)

| # | Screen | Caption |
|---|--------|---------|
| 1 | **Today** | Your daily scent pick — matched to weather and mood |
| 2 | **Office Safe** | Desk-friendly mode for work days — low projection, max sprays |
| 3 | **Spray Map** | Where to apply — pulse points, skin, and clothing |
| 4 | **Layering** | Find and save compatible scent combos |
| 5 | **Analytics** | Rotation health, value, and wear patterns |
| 6 | **Travel** | Pack the right decants for any trip |

## Privacy Nutrition Label Notes

| Data type | Collected | Linked to user | Used for tracking |
|-----------|-----------|----------------|-------------------|
| Contact info | No | — | — |
| Health & fitness | No | — | — |
| Financial info | No | — | — |
| Location | Optional, on-device only (weather) | No | No |
| User content (wardrobe, photos, wear log) | Yes, **local only** | No | No |
| Identifiers | No | — | — |
| Usage data | No | — | — |
| Diagnostics | No | — | — |

**Summary for App Store Connect:** Data Not Collected off device. Location is requested optionally for weather-aware picks and is not transmitted to ScentCap servers (there are none). Users can export JSON/CSV backups manually.

## Competitive Positioning

| Feature | ScentCap | ScentMax | Aromoshelf |
|---------|----------|----------|------------|
| Local-first / no account | ✅ | ❌ | ❌ |
| Daily scent pick | ✅ | Partial | ❌ |
| Office Safe mode | ✅ **Hero** | ❌ | ❌ |
| Spray body map | ✅ | ❌ | ❌ |
| Layering lab | ✅ | ❌ | Partial |
| Wear calendar | ✅ | ✅ | ✅ |
| Offline PWA | ✅ | ❌ | ❌ |

**Tagline for marketing:** _The fragrance OS that respects your nose — and your privacy._

## What's New (1.0.7)

- Catalog search upgrade: fuzzy brand/name match, Recent additions
- Wishlist tabs: Owned / Want / Tested (local IndexedDB)
- ScentCap Pro paywall scaffold ($4.99/mo, $39.99/yr) — 12-bottle free tier
- Capacitor iOS wrapper — see [IOS-BUILD.md](./IOS-BUILD.md)

## What's New (1.0.6)

- Office Safe surfaced in onboarding and Advisor
- Square & story share cards (Cap Neutral styling)
- Save Advisor layering combos to Layering Lab
- Privacy badge in Settings with export reminder
- Calendar navigation and share export QA
