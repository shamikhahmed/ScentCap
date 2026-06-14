# ScentCap — iOS Build Guide

> Version 1.0.7 · Capacitor wrapper for native App Store distribution

## Prerequisites

- macOS with Xcode 15+
- Apple Developer account (for device testing and App Store)
- Node.js 20+
- CocoaPods (`sudo gem install cocoapods`)

## Quick start

```bash
# Install dependencies (includes @capacitor/core, cli, ios)
npm install

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

## In-App Purchases (scaffold)

ScentCap v1.0.7 ships a **client-side paywall scaffold** (`ProContext`, `PaywallModal`). StoreKit integration is documented but not wired until an Apple Developer account is configured.

### Planned IAP setup

1. Install `@capacitor-community/in-app-purchases` (or native StoreKit 2 via a Capacitor plugin)
2. Create subscription products in App Store Connect:
   - `com.capricorn.scentcap.pro.monthly` — $4.99/mo
   - `com.capricorn.scentcap.pro.yearly` — $39.99/yr
3. Replace `activatePro()` stub in `PaywallModal` with purchase + receipt validation
4. Persist entitlement via Keychain (not localStorage) on native

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
| Routing 404 on deep links | Capacitor uses `BrowserRouter` with `basename` from `import.meta.env.BASE_URL` |

## Version sync

After bumping version, update:

- `package.json` / `VERSION.json`
- `docs/APP-STORE.md`
- `CHANGELOG.md`
- Xcode target version (manual, in Xcode)
