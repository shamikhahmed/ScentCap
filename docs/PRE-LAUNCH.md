# ScentCap — Pre-Launch Checklist

> Version 2.0.1 · Completely free PWA (optional Capacitor iOS shell)

## ✅ DONE

| Item | Status | Location |
|------|--------|----------|
| Capacitor iOS scaffold | ✅ | `ios/`, `capacitor.config.ts` |
| App icon (1024 + PWA 192/512) | ✅ | `npm run generate-icons` |
| Completely free (no Stripe / IAP / Pro) | ✅ | Paywall + IAP modules removed |
| Legal pages (Terms, Support, Privacy) | ✅ | `public/terms.html`, `support.html`, `privacy.html` |
| App Store listing copy draft | ✅ | `docs/APP-STORE.md` |
| Screenshot automation (6 screens) | ✅ | `e2e/screenshots.spec.ts`, `docs/SCREENSHOTS.md` |
| E2E tests | ✅ | `e2e/app.spec.ts` |
| iOS build guide | ✅ | `docs/IOS-BUILD.md` |

### Public URLs (GitHub Pages)

| Page | URL |
|------|-----|
| Privacy | https://shamikhahmed.github.io/ScentCap/privacy.html |
| Terms | https://shamikhahmed.github.io/ScentCap/terms.html |
| Support | https://shamikhahmed.github.io/ScentCap/support.html |
| App | https://shamikhahmed.github.io/ScentCap/ |

---

## Optional native shell (Apple Developer $99)

ScentCap is free. Do **not** create subscription products.

### 1. Apple Developer enrollment
1. Go to [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll)
2. Pay $99/year, complete identity verification

### 2. App Store Connect app record
1. [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **+** → New App
2. Platform: iOS · Name: **ScentCap** · Bundle ID: `com.capricorn.scentcap`
3. SKU: `scentcap-ios` · Primary language: English (U.S.)
4. Price: **Free**

### 3. Xcode signing
1. `npm run cap:ios`
2. Xcode → **Signing & Capabilities** → select your Team
3. Product → Archive → Distribute to App Store Connect

### 4. App Store listing
1. Paste copy from [APP-STORE.md](./APP-STORE.md)
2. Upload screenshots from `docs/screenshots/` (see [SCREENSHOTS.md](./SCREENSHOTS.md))
3. Set **Privacy Policy URL**: `https://shamikhahmed.github.io/ScentCap/privacy.html`
4. Set **Support URL**: `https://shamikhahmed.github.io/ScentCap/support.html`
5. Set **Marketing URL** (optional): `https://shamikhahmed.github.io/ScentCap/landing.html`

### 5. Privacy questionnaire
- **Data Not Collected** off device
- Location: optional, for weather only, not linked to identity, not used for tracking
- No third-party analytics SDKs
- No purchases / no account

### 6. TestFlight + submit
1. Internal Testing → install via TestFlight
2. Review notes: demo wardrobe via onboarding "Try demo collection"; app is free with all features unlocked
3. Submit

---

## Review risk notes

| Risk | Mitigation |
|------|------------|
| **Guideline 4.2 — Minimum functionality** | Demo wardrobe + full feature surface; no empty shell |
| **Privacy** | Local-only data; optional weather; see privacy.html |
| **Missing restore purchases** | N/A — no IAP |

## Still manual (device / account)

- Production code signing for device/App Store
- Real device QA of Capacitor shell

See [IOS-BUILD.md](./IOS-BUILD.md) and [APP-STORE.md](./APP-STORE.md).
