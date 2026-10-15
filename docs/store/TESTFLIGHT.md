# ScentCap — TestFlight / App Store readiness (G-1 / D-01)

Readiness only. **Do not upload or submit** from this finish loop. Upload is an owner Apple-account action (**BLOCKED-EXTERNAL**).

## Status (Perfection v4)

| Step | Status |
|---|---|
| Store copy + fields | ✅ Ready — `APP-STORE.md` |
| Privacy labels | ✅ Ready — `PRIVACY-LABELS.md` |
| Screenshot shot list | ✅ Ready — `SCREENSHOTS.md` |
| Privacy manifest | ✅ `ios/App/App/PrivacyInfo.xcprivacy` |
| Info.plist purpose strings | ✅ Camera, Photos, Location When-In-Use |
| Export compliance | ✅ `ITSAppUsesNonExemptEncryption` = false |
| Xcode 26 / iOS 26 SDK clean build | ⛔ **BLOCKED** — see below |
| App Store Connect upload / TestFlight | ⛔ **BLOCKED-EXTERNAL** |

## App identity

| Field | Value |
|---|---|
| Name | ScentCap |
| Subtitle | What to wear today |
| Bundle ID | `com.capricorn.scentcap` |
| SKU | `scentcap-ios` |
| Marketing version | 2.2.0 (`MARKETING_VERSION`) |
| Build | 220 (`CURRENT_PROJECT_VERSION`) |
| Primary category | Lifestyle |
| Age rating | 4+ |
| Pricing | Free (G-2 — no IAP) |

## Purpose strings (Info.plist)

- **Camera:** ScentCap uses the camera to photograph bottles in your wardrobe.
- **Photo Library:** ScentCap accesses your photo library so you can attach bottle photos to your collection.
- **Location When In Use:** ScentCap uses your location once to fetch local weather for scent recommendations. Coordinates are sent only to Open-Meteo, not to ScentCap servers.

## Privacy manifest

`ios/App/App/PrivacyInfo.xcprivacy`:

- `NSPrivacyTracking` = false; no tracking domains
- Required Reason APIs: UserDefaults (CA92.1), File Timestamp (C617.1), Disk Space (E174.1)
- No collected data types declared (wardrobe data stays on device; optional weather coords go only to Open-Meteo)

## Build — Xcode 26 / iOS 26 SDK

### Prerequisites (owner machine)

1. Install **Xcode 26** from the Mac App Store (or Apple Developer downloads).
2. Open Xcode once → accept license → install additional components.
3. Select it as active toolchain:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
xcodebuild -version   # expect Xcode 26.x
xcrun --sdk iphoneos --show-sdk-version   # expect 26.x
```

4. Node.js 20+, CocoaPods / SPM as pulled by Capacitor 8.

### Clean archive steps

```bash
cd /path/to/ScentCap
npm ci
npm run generate-icons
npm run build:cap
npx cap sync ios
npx cap open ios
```

In Xcode 26:

1. Select team under **Signing & Capabilities** (bundle `com.capricorn.scentcap`).
2. Destination: **Any iOS Device (arm64)** (or a connected device).
3. **Product → Clean Build Folder**, then **Product → Archive**.
4. Organizer → **Distribute App → App Store Connect → Upload** (owner only; not part of this program).
5. App Store Connect → TestFlight → Internal Testing.

CLI alternative after Xcode is selected:

```bash
xcodebuild -project ios/App/App.xcodeproj -scheme App \
  -configuration Release -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  clean build CODE_SIGNING_ALLOWED=NO
```

(Signing required for a real Archive/upload.)

### BLOCKED on this agent machine (2026-10-15)

| Check | Result |
|---|---|
| `/Applications/Xcode*.app` | Missing |
| `xcode-select` active | Command Line Tools only |
| `xcrun --sdk iphoneos` | SDK not found |

**Exact next step:** Install Xcode 26, run `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`, re-run the clean archive steps above. Do not submit until the owner is ready.

## URLs

- Support: https://shamikhahmed.github.io/support.html
- Privacy: https://shamikhahmed.github.io/ScentCap/privacy.html

## Review notes (for later upload)

Demo wardrobe available after install. Camera and Photos optional for bottle photos. Location optional for weather-based picks (Open-Meteo). Brand names belong to their owners — ScentCap isn’t affiliated with any fragrance house.
