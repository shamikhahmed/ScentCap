# ScentCap — Pre-Launch Checklist

> Version 1.0.8 · Everything possible **before** Apple Developer ($99)

## ✅ DONE (all code — no paid account needed)

| Item | Status | Location |
|------|--------|----------|
| Capacitor iOS scaffold | ✅ | `ios/`, `capacitor.config.ts` |
| Info.plist display name, version 1.0.8, privacy strings | ✅ | `ios/App/App/Info.plist` |
| App icon (1024 + PWA 192/512) | ✅ | `npm run generate-icons` |
| IAP service scaffold (product IDs, purchase/restore stubs) | ✅ | `src/lib/iap.ts`, `PaywallModal.tsx` |
| Pro paywall + 12-bottle free tier | ✅ | `ProContext`, `ProGate` |
| Legal pages (Terms, Support, Privacy) | ✅ | `public/terms.html`, `support.html`, `privacy.html` |
| App Store listing copy draft | ✅ | `docs/APP-STORE.md` |
| Screenshot automation (6 screens) | ✅ | `e2e/screenshots.spec.ts`, `docs/SCREENSHOTS.md` |
| E2E tests (onboarding, demo, delete bottle, paywall, travel, calendar, share) | ✅ | `e2e/app.spec.ts` |
| iOS build guide with day-1 IAP steps | ✅ | `docs/IOS-BUILD.md` |

### Public URLs (GitHub Pages)

| Page | URL |
|------|-----|
| Privacy | https://shamikhahmed.github.io/ScentCap/privacy.html |
| Terms | https://shamikhahmed.github.io/ScentCap/terms.html |
| Support | https://shamikhahmed.github.io/ScentCap/support.html |
| App | https://shamikhahmed.github.io/ScentCap/ |

---

## 🔒 Requires Apple Developer ($99) — ~30 minutes on day 1

Do these in order the day you enroll:

### 1. Apple Developer enrollment (5 min)
1. Go to [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll)
2. Pay $99/year, complete identity verification
3. Wait for approval (usually minutes to 24h)

### 2. App Store Connect app record (5 min)
1. [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **+** → New App
2. Platform: iOS · Name: **ScentCap** · Bundle ID: `com.capricorn.scentcap`
3. SKU: `scentcap-ios` · Primary language: English (U.S.)

### 3. Xcode signing (5 min)
1. `npm run cap:ios`
2. Xcode → **Signing & Capabilities** → select your Team
3. Confirm version **1.0.8** (8) matches `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`
4. Product → Archive → Distribute to App Store Connect

### 4. Subscription products in App Store Connect (10 min)
Create an auto-renewable subscription **group** named `ScentCap Pro`, then:

| Product ID | Duration | Price |
|------------|----------|-------|
| `com.capricorn.scentcap.pro.monthly` | 1 month | $4.99 |
| `com.capricorn.scentcap.pro.yearly` | 1 year | $39.99 |

Add localized display names and review notes. See [IOS-BUILD.md](./IOS-BUILD.md) for StoreKit wiring.

### 5. App Store listing (10 min)
1. Paste copy from [APP-STORE.md](./APP-STORE.md)
2. Upload screenshots from `docs/screenshots/` in order (see [SCREENSHOTS.md](./SCREENSHOTS.md))
3. Set **Privacy Policy URL**: `https://shamikhahmed.github.io/ScentCap/privacy.html`
4. Set **Support URL**: `https://shamikhahmed.github.io/ScentCap/support.html`
5. Set **Marketing URL** (optional): `https://shamikhahmed.github.io/ScentCap/landing.html`

### 6. Privacy questionnaire (5 min)
Use answers from [APP-STORE.md](./APP-STORE.md) → Privacy Nutrition Label:
- **Data Not Collected** off device
- Location: optional, for weather only, not linked to identity, not used for tracking
- No third-party analytics SDKs

### 7. TestFlight (5 min)
1. After first build upload, wait for processing
2. App Store Connect → TestFlight → Internal Testing → add yourself
3. Install via TestFlight app; test IAP in **Sandbox** (Settings → App Store → Sandbox Account)

### 8. Submit for review
1. Complete export compliance (no encryption beyond HTTPS → typically "No")
2. Add review notes: demo wardrobe available via onboarding "Try demo collection"
3. Submit

---

## App Store Connect product IDs

```
com.capricorn.scentcap.pro.monthly
com.capricorn.scentcap.pro.yearly
```

Bundle ID: `com.capricorn.scentcap`

---

## Screenshot upload order

1. Today/Home → 2. Office Safe → 3. Spray map → 4. Layering → 5. Analytics → 6. Travel

Regenerate: `npm run screenshots`

---

## Common rejection fixes (fragrance / lifestyle apps)

| Rejection reason | Fix for ScentCap |
|------------------|------------------|
| **Guideline 2.1 — IAP not working** | Ensure subscription products are "Ready to Submit" and StoreKit plugin is wired; provide Sandbox test account in review notes |
| **Guideline 3.1.2 — Subscriptions** | Terms + Privacy URLs must be live; paywall shows price and auto-renewal terms |
| **Guideline 5.1.1 — Privacy** | Location string in Info.plist explains Open-Meteo; privacy questionnaire matches "local only" |
| **Guideline 2.3.3 — Screenshots misleading** | Use Playwright captures from real app UI, not mockups |
| **Guideline 4.0 — Design** | Office Safe is differentiated; ensure iPad screenshots if targeting iPad (optional for v1) |
| **Missing restore purchases** | Restore button in paywall (`PaywallModal`) — wire StoreKit on day 1 |

---

## What literally cannot be done without $99

- TestFlight distribution
- App Store Connect listing creation (requires enrolled account)
- Real IAP / Sandbox purchase testing
- Production code signing for device/App Store
- App Review submission

Everything else in this repo is ready.
