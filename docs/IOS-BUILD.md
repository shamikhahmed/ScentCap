# ScentCap — iOS Build Guide

> Version 1.0.8 · Capacitor wrapper for native App Store distribution

## Prerequisites

- macOS with Xcode 15+
- Apple Developer account (for device testing and App Store)
- Node.js 20+
- CocoaPods (`sudo gem install cocoapods`)

## Quick start

```bash
# Install dependencies (includes @capacitor/core, cli, ios)
npm install

# Generate PWA + iOS app icons
npm run generate-icons

# Build web assets with root base path (required for Capacitor)
npm run build:cap

# Sync web build into native projects
npx cap sync ios

# Open in Xcode
npx cap open ios
```

Or use the combined scripts:

```bash
npm run cap:sync    # build:cap + cap sync
npm run cap:ios     # cap:sync + open Xcode
npm run cap:open    # open existing ios/ project
```

## Base path: GitHub Pages vs Capacitor

| Target | Base path | Build command |
|--------|-----------|---------------|
| GitHub Pages PWA | `/ScentCap/` | `npm run build` |
| Capacitor iOS/Android | `/` | `npm run build:cap` |

`vite.config.ts` reads `CAPACITOR=true` to switch `base` and PWA `start_url`. Never deploy a Capacitor build to GitHub Pages without resetting the base path.

## Xcode workflow

1. Run `npm run cap:ios`
2. In Xcode, select your Team under **Signing & Capabilities**
3. Choose a simulator or connected device
4. Product → Run (⌘R)

## Info.plist (pre-configured)

- `CFBundleDisplayName`: ScentCap
- `MARKETING_VERSION`: 1.0.8
- `NSCameraUsageDescription` — bottle photos
- `NSPhotoLibraryUsageDescription` — photo picker
- `NSLocationWhenInUseUsageDescription` — weather (Open-Meteo)

## In-App Purchases — day 1 checklist (Apple Developer required)

ScentCap ships an IAP **service scaffold** (`src/lib/iap.ts`) wired to `PaywallModal`. StoreKit is stubbed until products exist in App Store Connect.

### Step 1 — Create products in App Store Connect

1. App Store Connect → your app → **Subscriptions** → create group **ScentCap Pro**
2. Add subscriptions:

| Product ID | Type | Price (USD) |
|------------|------|-------------|
| `com.capricorn.scentcap.pro.monthly` | Auto-renewable, 1 month | $4.99 |
| `com.capricorn.scentcap.pro.yearly` | Auto-renewable, 1 year | $39.99 |

3. Add localization (display name: "ScentCap Pro", description from paywall features)
4. Submit products for review alongside the app binary

### Step 2 — Install native purchases plugin

`@capacitor-community/in-app-purchases` is not maintained for Capacitor 8. Use Capgo instead:

```bash
npm install @capgo/native-purchases@^8
npx cap sync ios
```

### Step 3 — Wire `src/lib/iap.ts`

Replace stub `purchase()` / `restorePurchases()` with plugin calls:

```typescript
import { NativePurchases } from '@capgo/native-purchases';

// purchase(productId) → NativePurchases.purchaseProduct({ productIdentifier: productId })
// restorePurchases() → NativePurchases.restorePurchases()
// On success → applyProEntitlement()
```

Validate receipts server-side before production (optional for v1; client-only acceptable for solo dev with StoreKit 2).

### Step 4 — Persist entitlement on native

- Move Pro flag from `localStorage` to **Keychain** on iOS (Capacitor Preferences or secure storage plugin)
- `restorePurchases` must re-check active subscriptions on launch

### Step 5 — Sandbox testing

1. App Store Connect → Users and Access → Sandbox → create tester
2. iOS Settings → App Store → Sandbox Account → sign in
3. Run app from TestFlight or Xcode on device
4. Tap Monthly/Yearly in paywall → confirm Sandbox purchase dialog

### Pro features gated

- Collection Analytics
- Layering Lab
- Travel Kit
- JSON/CSV export
- More than 12 bottles (free tier limit)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank white screen in simulator | Ensure `npm run build:cap` was used (base must be `/`) |
| `ios/` folder missing | Run `npx cap add ios` after `npm install` |
| CocoaPods errors | `cd ios/App && pod install` |
| UIScene lifecycle warning in Xcode | Fixed in v1.1.1 — `SceneDelegate.swift` + `UIApplicationSceneManifest` in Info.plist |
| WebContent process crash (signal 9) in Simulator | Often Recharts + WKWebView; fixed chart sizing in v1.1.1. If it persists: Simulator → Device → Erase All Content; avoid opening Analytics immediately on cold launch |
| Harmless simulator noise | `RTIInputSystemClient`, `WebPrivacy`, `CA Event` — ignore; not app bugs |
| Routing 404 on deep links | Capacitor uses `BrowserRouter` with `basename` from `import.meta.env.BASE_URL` |
| IAP products empty | Products must be "Ready to Submit" and bundle ID must match |
| Missing app icon in Xcode | Run `npm run generate-icons` |

## Version sync

After bumping version, update:

- `package.json` / `VERSION.json`
- `docs/APP-STORE.md` / `docs/PRE-LAUNCH.md`
- `CHANGELOG.md`
- `ios/App/App.xcodeproj` → `MARKETING_VERSION` + `CURRENT_PROJECT_VERSION`
- `vite.config.ts` → workbox cache name

See [PRE-LAUNCH.md](./PRE-LAUNCH.md) for the full submission checklist.
