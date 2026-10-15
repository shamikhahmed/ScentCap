# ScentCap — iOS Build Guide

> Version 2.2.0 · Capacitor 8 · App Store / TestFlight readiness (no submission in finish program)

## Prerequisites

- macOS with **Xcode 26** (iOS 26 SDK) — required for current App Store uploads
- Apple Developer account (device testing / TestFlight / App Store — owner only)
- Node.js 20+
- Active developer directory must be full Xcode, not Command Line Tools:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
xcodebuild -version
xcrun --sdk iphoneos --show-sdk-version
```

## Quick start

```bash
npm install
npm run generate-icons
npm run build:cap          # web assets with base `/` for Capacitor
npx cap sync ios
npx cap open ios           # or: npm run cap:ios
```

Combined scripts:

```bash
npm run cap:sync    # build:cap + cap sync
npm run cap:ios     # cap:sync + open Xcode
npm run cap:open    # open existing ios/ project
```

## Base path: GitHub Pages vs Capacitor

| Target | Base path | Build command |
|--------|-----------|---------------|
| GitHub Pages PWA | `/ScentCap/` | `npm run build` |
| Capacitor iOS | `/` | `npm run build:cap` |

Never deploy a Capacitor build to GitHub Pages without resetting the base path.

## Xcode 26 workflow

1. Run `npm run cap:ios`
2. Signing & Capabilities → Team; bundle `com.capricorn.scentcap`
3. Product → Clean Build Folder → Archive (generic iOS device)
4. Distribute → App Store Connect → Upload (**owner**; outside finish program)
5. TestFlight Internal Testing

CLI smoke build (no signing):

```bash
xcodebuild -project ios/App/App.xcodeproj -scheme App \
  -configuration Release -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  clean build CODE_SIGNING_ALLOWED=NO
```

## Info.plist (pre-configured)

- `CFBundleDisplayName`: ScentCap
- `MARKETING_VERSION`: 2.2.0 · `CURRENT_PROJECT_VERSION`: 220
- `NSCameraUsageDescription` — bottle photos
- `NSPhotoLibraryUsageDescription` — photo picker
- `NSLocationWhenInUseUsageDescription` — weather (Open-Meteo)
- `ITSAppUsesNonExemptEncryption`: false

## Privacy manifest

`ios/App/App/PrivacyInfo.xcprivacy` — no tracking; UserDefaults / File Timestamp / Disk Space reason APIs declared.

## Pricing

Completely free. No Stripe, no App Store IAP, no Pro gates (G-2).

## Agent / CI machine status (2026-10-15)

⛔ **BLOCKED:** This machine has only Command Line Tools (`xcode-select` → `/Library/Developer/CommandLineTools`). No `/Applications/Xcode.app`, no `iphoneos` SDK.

**Exact next step:** Install Xcode 26 → `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` → re-run clean archive. See [`store/TESTFLIGHT.md`](./store/TESTFLIGHT.md).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank white screen in simulator | Use `npm run build:cap` (base must be `/`) |
| `ios/` folder missing | `npx cap add ios` after `npm install` |
| SPM / Capacitor resolve errors | Network once for `capacitor-swift-pm` 8.4.0; File → Packages → Resolve |
| UIScene lifecycle warning | `SceneDelegate.swift` + `UIApplicationSceneManifest` already present |
| Missing app icon | `npm run generate-icons` |

## Version sync

After bumping version, update:

- `package.json`
- `ios/App/App.xcodeproj` → `MARKETING_VERSION` + `CURRENT_PROJECT_VERSION`
- `docs/store/APP-STORE.md` + `docs/store/TESTFLIGHT.md`
- `CHANGELOG.md`
- Vite / workbox cache name if applicable
