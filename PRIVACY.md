# ScentCap — Privacy Policy

**Last updated:** October 24, 2026 · **Version 3.0**

ScentCap is an offline-first Progressive Web App (and Capacitor iOS shell) for fragrance wardrobe management. **Your collection stays on your device** unless you explicitly export it. App Store privacy: **Data Not Collected**.

## What we collect

- **Nothing by default.** No accounts, analytics SDKs, or third-party trackers ship in this app.
- A **bundled offline catalog** of real bottles ships with the app for browsing without a network.
- Optional weather context may call [Open-Meteo](https://open-meteo.com/) for temperature and humidity — only when you grant location access or enter a city. Coordinates/city are sent to Open-Meteo, not to Capricorn servers.
- Optional live catalog search may call [Fraganty](https://fraganty.ai/) with the fragrance name or brand you type. Your wardrobe, wears, ratings, and notes are never uploaded as part of catalog requests.

## Storage

- App state is stored in **IndexedDB** and **localStorage** / UserDefaults-backed web storage on your device (wardrobe, wears, layer recipes, travel kits, catalog cache, bottle image blobs).
- Uninstalling or clearing site data removes your wardrobe and wear history.

## Network

- GitHub Pages (web) / App Store CDN (iOS) serve static files only — no server-side access to your collection.
- Weather and live catalog lookups are optional and can be denied or unused.
- See in-app Settings → Privacy & network for a live summary.

## Photos & exports

- Bottle photos you add stay on your device.
- Bottle images © their respective brands, via Parfumo; Capricorn does not claim ownership of those images.
- JSON/CSV exports are generated locally — you choose where to save or share them.

## iOS privacy manifest

`ios/App/App/PrivacyInfo.xcprivacy` declares no tracking, no collected data types, and required-reason API use for UserDefaults / file timestamps / disk space as used by the Capacitor shell.

## Contact

Built by Shamikh Ahmed — issues via the [ScentCap GitHub repository](https://github.com/shamikhahmed/ScentCap).
